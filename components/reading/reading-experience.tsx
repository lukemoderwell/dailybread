"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Check, Flame, Settings } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FamilyMember {
  id: string;
  name: string;
  age: number;
}

interface Question {
  familyMemberId: string;
  name: string;
  age: number;
  question: string;
}

interface ReadingExperienceProps {
  userId: string;
  familyMembers: FamilyMember[];
  currentBook: string;
  currentChapter: number;
  currentStreak: number;
  longestStreak: number;
  bibleTranslation: string;
  ttsVoice: string;
}

type ReadingState =
  | "loading"
  | "ready"
  | "playing-scripture"
  | "scripture-complete"
  | "playing-question"
  | "all-complete";

export default function ReadingExperience({
  userId,
  familyMembers,
  currentBook,
  currentChapter,
  currentStreak,
  bibleTranslation,
  ttsVoice,
}: ReadingExperienceProps) {
  const router = useRouter();
  const [state, setState] = useState<ReadingState>("loading");
  const [passage, setPassage] = useState("");
  const [reference, setReference] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [scriptureAudioUrl, setScriptureAudioUrl] = useState<string | null>(null);
  const [isPreloadingAudio, setIsPreloadingAudio] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [verses, setVerses] = useState<string[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number>(-1);
  const [wordTimestamps, setWordTimestamps] = useState<Array<{word: string, startSecond: number, endSecond: number}>>([]);

  // Load today's passage and generate questions
  useEffect(() => {
    async function loadContent() {
      try {
        // Fetch Bible passage
        const passageRes = await fetch("/api/bible/passage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            book: currentBook,
            chapter: currentChapter,
            translation: bibleTranslation
          }),
        });

        if (!passageRes.ok) throw new Error("Failed to fetch passage");

        const passageData = await passageRes.json();

        // Strip HTML tags from content for TTS
        const cleanContent = passageData.content
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim();

        setPassage(cleanContent);
        setReference(passageData.reference);

        // Split into verses using verse numbers [1], [2], etc.
        const verseArray = cleanContent.split(/(?=\[\d+\])/).filter((v: string) => v.trim().length > 0);
        setVerses(verseArray);

        // Generate questions
        const questionsRes = await fetch("/api/bible/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passage: cleanContent,
            reference: passageData.reference,
            familyMembers: familyMembers,
          }),
        });

        if (!questionsRes.ok) throw new Error("Failed to generate questions");

        const questionsData = await questionsRes.json();
        setQuestions(questionsData.questions);

        // Preload scripture audio in the background
        preloadAudio(cleanContent, passageData.reference);

        setState("ready");
      } catch (error) {
        console.error("Content loading error:", error);
        toast.error("Failed to load today's reading");
      }
    }

    loadContent();
  }, [currentBook, currentChapter, familyMembers, bibleTranslation, ttsVoice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate cache key for audio
  const generateCacheKey = (text: string, voice: string): string => {
    // Simple hash function
    const str = `${text}:${voice}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `tts_audio_${Math.abs(hash).toString(36)}`;
  };

  // IndexedDB helper functions
  const openAudioCache = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AudioCache', 2); // Bumped version to clear old cache

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Delete old object store if it exists
        if (db.objectStoreNames.contains('audio')) {
          db.deleteObjectStore('audio');
        }

        // Create fresh object store
        db.createObjectStore('audio');
      };
    });
  };

  const getCachedAudio = async (key: string): Promise<{blob: Blob, timestamps: Array<{word: string, startSecond: number, endSecond: number}>} | null> => {
    try {
      const db = await openAudioCache();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['audio'], 'readonly');
        const store = transaction.objectStore('audio');
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          if (result && result.blob instanceof Blob) {
            resolve(result);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting cached audio:', error);
      return null;
    }
  };

  const setCachedAudio = async (key: string, blob: Blob, timestamps: Array<{word: string, startSecond: number, endSecond: number}>): Promise<void> => {
    try {
      const db = await openAudioCache();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['audio'], 'readwrite');
        const store = transaction.objectStore('audio');
        const request = store.put({ blob, timestamps }, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error caching audio:', error);
    }
  };

  // Preload scripture audio only
  const preloadAudio = async (passageText: string, ref: string) => {
    setIsPreloadingAudio(true);

    try {
      const fullText = `${ref}. ${passageText}`;
      const cacheKey = generateCacheKey(fullText, ttsVoice);

      // Check IndexedDB cache first
      const cachedData = await getCachedAudio(cacheKey);
      if (cachedData) {
        console.log('Using cached audio from IndexedDB');
        const url = URL.createObjectURL(cachedData.blob);
        setScriptureAudioUrl(url);
        setWordTimestamps(cachedData.timestamps || []);
        setIsPreloadingAudio(false);
        return;
      }

      // Generate scripture audio
      console.log('Generating new audio...');
      const scriptureResponse = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: fullText,
          voice: ttsVoice
        }),
      });

      if (scriptureResponse.ok) {
        const data = await scriptureResponse.json();

        // Convert base64 audio back to blob
        const audioData = atob(data.audio);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioData.length; i++) {
          view[i] = audioData.charCodeAt(i);
        }
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(audioBlob);

        setScriptureAudioUrl(url);
        setWordTimestamps(data.wordTimestamps || []);

        // Cache the blob and timestamps in IndexedDB
        await setCachedAudio(cacheKey, audioBlob, data.wordTimestamps || []);
        console.log('Audio cached to IndexedDB with timestamps');

        console.log('Scripture audio preloaded');
      }
    } catch (error) {
      console.error('Audio preload error:', error);
    } finally {
      setIsPreloadingAudio(false);
    }
  };

  const toggleQuestion = (index: number) => {
    const newAnswered = new Set(answeredQuestions);
    if (newAnswered.has(index)) {
      newAnswered.delete(index);
    } else {
      newAnswered.add(index);
    }
    setAnsweredQuestions(newAnswered);
  };

  // Play preloaded audio
  const playPreloadedAudio = (url: string, type: "scripture" | "question") => {
    setIsPlaying(true);

    const audio = new Audio();
    audio.src = url;
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentVerseIndex(-1); // Reset highlighting
      if (type === "scripture") {
        setState("scripture-complete");
      } else {
        // Move to next question or complete
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setState("scripture-complete");
        } else {
          setState("all-complete");
        }
      }
    };

    audio.onerror = () => {
      setIsPlaying(false);
      setCurrentVerseIndex(-1);
      toast.error("Audio playback failed");
    };

    // For scripture, highlight verses using timestamps if available
    if (type === "scripture" && verses.length > 0) {
      if (wordTimestamps.length > 0) {
        // Use accurate word timestamps to find current verse
        audio.ontimeupdate = () => {
          const currentTime = audio.currentTime;

          // Find the current word being spoken
          const currentWordIndex = wordTimestamps.findIndex((wt, idx) => {
            const nextWord = wordTimestamps[idx + 1];
            return currentTime >= wt.startSecond && (!nextWord || currentTime < nextWord.startSecond);
          });

          if (currentWordIndex >= 0) {
            // Map word index to verse index
            let wordCount = 0;
            for (let i = 0; i < verses.length; i++) {
              const verseWordCount = verses[i].split(/\s+/).length;
              if (currentWordIndex < wordCount + verseWordCount) {
                setCurrentVerseIndex(i);
                break;
              }
              wordCount += verseWordCount;
            }
          }
        };
      } else {
        // Fallback to progress-based estimation
        audio.ontimeupdate = () => {
          if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
            const progress = audio.currentTime / audio.duration;
            const verseIndex = Math.floor(progress * verses.length);
            setCurrentVerseIndex(Math.min(verseIndex, verses.length - 1));
          }
        };
      }
    }

    audio.play();

    if (type === "scripture") {
      setState("playing-scripture");
    } else {
      setState("playing-question");
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const startScripture = () => {
    if (scriptureAudioUrl) {
      playPreloadedAudio(scriptureAudioUrl, "scripture");
    } else {
      toast.error("Audio is still loading, please wait...");
    }
  };


  const completeReading = async () => {
    try {
      const supabase = createSupabaseClient();

      // Save session
      await supabase.from("reading_sessions").insert({
        user_id: userId,
        book: currentBook,
        chapter: currentChapter,
        content: {
          scripture_text: passage,
          reference: reference,
          questions: questions,
        },
      });

      toast.success("Great job! See you tomorrow!");

      // Refresh to get new chapter
      router.refresh();
    } catch (error) {
      console.error("Complete reading error:", error);
      toast.error("Failed to save progress");
    }
  };

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading today&apos;s reading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
      {/* Header with streak */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Today&apos;s Reading</h1>
          <p className="text-muted-foreground text-sm">{reference}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <div className="text-right">
              <div className="text-2xl font-bold">{currentStreak}</div>
              <div className="text-xs text-muted-foreground">day streak</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="scripture" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="scripture" className="text-base">Scripture</TabsTrigger>
          <TabsTrigger value="questions" className="text-base">Questions</TabsTrigger>
        </TabsList>

        {/* Scripture Tab */}
        <TabsContent value="scripture" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-lg leading-relaxed max-w-none">
                {verses.map((verse, index) => {
                  const isCurrentVerse = index === currentVerseIndex;
                  const isPastVerse = index < currentVerseIndex;

                  return (
                    <span
                      key={index}
                      className={`inline transition-all duration-300 ${
                        isCurrentVerse
                          ? "bg-yellow-400 dark:bg-yellow-500 text-black font-bold px-2 py-1 rounded-md"
                          : isPastVerse
                          ? "bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded"
                          : ""
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: verse.replace(
                          /\[(\d+)\]/g,
                          '<sup class="text-primary font-semibold ml-1">$1</sup>'
                        ) + ' ',
                      }}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="mt-6">
          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card
                key={question.familyMemberId}
                className={answeredQuestions.has(index) ? "opacity-60" : ""}
              >
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleQuestion(index)}
                        className="mt-1 flex-shrink-0"
                      >
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          answeredQuestions.has(index)
                            ? "bg-primary border-primary"
                            : "border-muted-foreground"
                        }`}>
                          {answeredQuestions.has(index) && (
                            <Check className="h-4 w-4 text-primary-foreground" />
                          )}
                        </div>
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold">{question.name}</h3>
                          <span className="text-sm text-muted-foreground">Age {question.age}</span>
                        </div>
                        <p className="text-lg leading-relaxed">{question.question}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {questions.length > 0 && (
              <Button
                size="lg"
                onClick={completeReading}
                className="w-full h-16 mt-6"
              >
                <Check className="h-6 w-6 mr-2" />
                Mark as Complete
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button for Audio Control */}
      {(state === "ready" || state === "scripture-complete" || state === "playing-scripture") && (
        <div className="fixed bottom-6 right-6 z-50">
          {!isPlaying ? (
            <Button
              size="lg"
              onClick={startScripture}
              disabled={!scriptureAudioUrl || isPreloadingAudio}
              className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="h-8 w-8" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={pauseAudio}
              variant="outline"
              className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all bg-background"
            >
              <Pause className="h-8 w-8" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
