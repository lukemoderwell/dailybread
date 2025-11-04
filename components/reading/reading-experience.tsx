"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Check, Flame, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getColorById } from "@/lib/colors";
import { calculateEndingPosition, type VersePosition } from "@/lib/bible-metadata";

interface FamilyMember {
  id: string;
  name: string;
  age: number;
  color: string;
}

interface Question {
  familyMemberId: string;
  name: string;
  age: number;
  color: string;
  question: string;
}

interface ReadingExperienceProps {
  userId: string;
  familyMembers: FamilyMember[];
  currentBook: string;
  currentChapter: number;
  currentVerse: number;
  currentStreak: number;
  longestStreak: number;
  bibleTranslation: string;
  ttsVoice: string;
  enableTts: boolean;
  versesPerSession: number;
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
  currentVerse,
  currentStreak,
  bibleTranslation,
  ttsVoice,
  enableTts,
  versesPerSession,
}: ReadingExperienceProps) {
  const router = useRouter();
  const [state, setState] = useState<ReadingState>("loading");
  const [passage, setPassage] = useState("");
  const [reference, setReference] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [scriptureAudioUrl, setScriptureAudioUrl] = useState<string | null>(null);
  const [isPreloadingAudio, setIsPreloadingAudio] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [verses, setVerses] = useState<string[]>([]);
  const [wordTimestamps, setWordTimestamps] = useState<Array<{word: string, startSecond: number, endSecond: number}>>([]);

  // Track passage metadata for sequential reading
  const [passageMetadata, setPassageMetadata] = useState<{
    startBook: string;
    startChapter: number;
    startVerse: number;
    endingBook: string;
    endingChapter: number;
    endingVerse: number;
    versesRead: number;
  } | null>(null);

  // Session navigation state
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isHistoricalView, setIsHistoricalView] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [navigationMeta, setNavigationMeta] = useState<{
    hasPrevious: boolean;
    hasNext: boolean;
    previousId: number | null;
    nextId: number | null;
  }>({
    hasPrevious: false,
    hasNext: false,
    previousId: null,
    nextId: null,
  });

  // Load session data (either current reading or historical session)
  useEffect(() => {
    async function loadContent() {
      try {
        // Reset state when starting to load
        setPassage("");
        setReference("");
        setQuestions([]);
        setPassageMetadata(null);
        setSessionSummary("");

        // If viewing a historical session, load that session's data
        if (currentSessionId !== null) {
          const sessionRes = await fetch("/api/bible/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: currentSessionId }),
          });

          if (!sessionRes.ok) throw new Error("Failed to fetch session");

          const sessionData = await sessionRes.json();

          // Set historical session data
          setPassage(sessionData.session.content.scripture_text);
          setReference(sessionData.session.content.reference);
          setQuestions(sessionData.session.content.questions || []);
          setIsHistoricalView(true);
          setNavigationMeta(sessionData.navigation);
          setState("ready");
          setIsLoadingQuestions(false);

          // Check if we have a cached summary
          if (sessionData.session.summary) {
            // Use cached summary
            setSessionSummary(sessionData.session.summary);
            setIsLoadingSummary(false);
          } else {
            // Generate summary in the background
            setIsLoadingSummary(true);
            fetch("/api/bible/summarize-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: sessionData.session.id,
                reference: sessionData.session.content.reference,
                questions: sessionData.session.content.questions || [],
              }),
            })
              .then(async (summaryRes) => {
                if (summaryRes.ok) {
                  const summaryData = await summaryRes.json();
                  setSessionSummary(summaryData.summary);
                }
              })
              .catch((error) => {
                console.error("Summary generation failed:", error);
              })
              .finally(() => {
                setIsLoadingSummary(false);
              });
          }

          return;
        }

        // Otherwise, load current reading (today's reading)
        setIsHistoricalView(false);
        setIsLoadingQuestions(true);

        // Fetch Bible passage first (fastest, unblocks UI)
        const passageRes = await fetch("/api/bible/passage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            book: currentBook,
            chapter: currentChapter,
            verse: currentVerse,
            translation: bibleTranslation,
            verses_per_session: versesPerSession,
          }),
        });

        if (!passageRes.ok) throw new Error("Failed to fetch passage");

        const passageData = await passageRes.json();

        // Use the HTML content directly from the API
        // The API returns: <span class="v">1</span>The text...
        // We'll style these with CSS instead of converting to [1]
        const htmlContent = passageData.content;

        setPassage(htmlContent);
        setReference(passageData.reference);

        // Store passage metadata for completion tracking
        setPassageMetadata({
          startBook: passageData.book,
          startChapter: passageData.chapter,
          startVerse: passageData.verse,
          endingBook: passageData.ending_book,
          endingChapter: passageData.ending_chapter,
          endingVerse: passageData.ending_verse,
          versesRead: passageData.verses_read,
        });

        // For verse tracking (TTS highlighting), extract plain text
        const plainText = htmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

        // Split by verse numbers for highlighting (rough approximation)
        // This is just for TTS tracking, not display
        const verseArray = plainText.split(/(?=\d+\s)/).filter((v: string) => v.trim().length > 0);
        setVerses(verseArray);

        // Show content immediately - user can start reading while questions/audio load
        setState("ready");

        // Load questions and TTS in parallel (non-blocking)
        Promise.all([
          // Generate questions
          fetch("/api/bible/generate-questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              passage: plainText,
              reference: passageData.reference,
              familyMembers: familyMembers,
            }),
          }).then(async (questionsRes) => {
            if (questionsRes.ok) {
              const questionsData = await questionsRes.json();
              setQuestions(questionsData.questions);
            } else {
              console.error("Failed to generate questions");
            }
          }).finally(() => {
            setIsLoadingQuestions(false);
          }),

          // Preload scripture audio if TTS is enabled
          enableTts ? preloadAudio(plainText, passageData.reference) : Promise.resolve(),

          // Fetch navigation metadata for current reading
          fetch("/api/bible/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}), // No sessionId = current reading
          }).then(async (navRes) => {
            if (navRes.ok) {
              const navData = await navRes.json();
              setNavigationMeta(navData.navigation);
            }
          }),
        ]).catch((error) => {
          console.error("Error loading questions/audio:", error);
          setIsLoadingQuestions(false);
          // Don't block the UI - content is already showing
        });

      } catch (error) {
        console.error("Content loading error:", error);
        toast.error("Failed to load today's reading");
      }
    }

    loadContent();
  }, [currentBook, currentChapter, currentVerse, familyMembers, bibleTranslation, ttsVoice, currentSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

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
      toast.error("Audio playback failed");
    };

    // Note: Verse highlighting during TTS playback has been removed
    // Could be re-enabled in the future if needed

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

  // Session navigation handlers
  const navigateToPrevious = () => {
    if (navigationMeta.previousId) {
      setState("loading");
      setCurrentSessionId(navigationMeta.previousId);
    }
  };

  const navigateToNext = () => {
    setState("loading");
    if (navigationMeta.nextId) {
      setCurrentSessionId(navigationMeta.nextId);
    } else {
      // Navigate to current reading (today)
      setCurrentSessionId(null);
      setIsHistoricalView(false);
    }
  };

  const completeReading = async () => {
    try {
      if (!passageMetadata) {
        toast.error("Session data not loaded yet");
        return;
      }

      const supabase = createSupabaseClient();

      // Save session with ending position metadata
      await supabase.from("reading_sessions").insert({
        user_id: userId,
        book: passageMetadata.startBook,
        chapter: passageMetadata.startChapter,
        verses_read: passageMetadata.versesRead,
        content: {
          scripture_text: passage,
          reference: reference,
          questions: questions,
          ending_book: passageMetadata.endingBook,
          ending_chapter: passageMetadata.endingChapter,
          ending_verse: passageMetadata.endingVerse,
        },
      });

      // Calculate next starting position (one verse after where we ended)
      const currentEndPos: VersePosition = {
        book: passageMetadata.endingBook,
        chapter: passageMetadata.endingChapter,
        verse: passageMetadata.endingVerse,
      };

      const nextStartPos = calculateEndingPosition(currentEndPos, 1);

      if (!nextStartPos) {
        // We've reached the end of the Bible - wrap around to Genesis 1:1
        await supabase.from("reading_progress").update({
          current_book: "Genesis",
          current_chapter: 1,
          current_verse: 1,
        }).eq("user_id", userId);
      } else {
        // Update reading_progress with next starting position
        await supabase.from("reading_progress").update({
          current_book: nextStartPos.book,
          current_chapter: nextStartPos.chapter,
          current_verse: nextStartPos.verse,
        }).eq("user_id", userId);
      }

      toast.success("Great job! See you tomorrow!");

      // Refresh to get new reading
      router.refresh();
    } catch (error) {
      console.error("Complete reading error:", error);
      toast.error("Failed to save progress");
    }
  };

  if (state === "loading") {
    return (
      <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-muted animate-pulse rounded"></div>
            <div className="h-16 w-16 bg-muted animate-pulse rounded"></div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 h-12">
            <div className="bg-muted animate-pulse rounded"></div>
            <div className="bg-muted animate-pulse rounded"></div>
          </div>

          {/* Content skeleton */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-11/12"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-10/12"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-9/12"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
      {/* Header with streak and navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateToPrevious}
            disabled={!navigationMeta.hasPrevious}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isHistoricalView ? "Previous Reading" : "Today's Reading"}
            </h1>
            <p className="text-muted-foreground text-sm">{reference}</p>
          </div>
          {isHistoricalView && (
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateToNext}
              disabled={!navigationMeta.hasNext}
              className="h-8 w-8"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
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

      {isHistoricalView && (
        <div className="bg-muted/50 border border-muted rounded-lg p-4 space-y-2">
          {isLoadingSummary ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-2">Loading summary...</p>
              <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
            </div>
          ) : sessionSummary ? (
            <p className="text-sm leading-relaxed">{sessionSummary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              You&apos;re viewing a previous reading. Use the arrows above to navigate back to today&apos;s reading.
            </p>
          )}
        </div>
      )}

      <Tabs defaultValue="scripture" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="scripture" className="text-base">Scripture</TabsTrigger>
          <TabsTrigger value="questions" className="text-base">Questions</TabsTrigger>
        </TabsList>

        {/* Scripture Tab */}
        <TabsContent value="scripture" className="mt-6">
          <Card>
            <CardContent className="pt-6 px-6 md:px-12">
              <div className="mx-auto max-w-prose">
                <style jsx>{`
                  .scripture-content {
                    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
                    font-size: 1rem;
                    line-height: 1.75;
                    text-align: left;
                    hyphens: auto;
                    word-spacing: 0.05em;
                  }

                  @media (min-width: 768px) {
                    .scripture-content {
                      font-size: 1.125rem;
                    }
                  }

                  /* Style Bible API verse numbers */
                  .scripture-content :global(.v) {
                    opacity: 0.8;
                    font-size: 0.65em;
                    font-weight: normal;
                    margin-right: 0.3em;
                    margin-left: 0.1em;
                    vertical-align: super;
                    line-height: 0;
                    position: relative;
                    top: -0.4em;
                  }

                  /* Add slight spacing after verse spans for sentence separation */
                  .scripture-content :global(span[data-sid]) {
                    margin-right: 0.15em;
                  }

                  /* Make paragraphs flow inline without breaks */
                  .scripture-content :global(p) {
                    display: inline;
                    margin: 0;
                    padding: 0;
                  }

                  .scripture-content :global(.p) {
                    display: inline;
                  }

                  /* Style added words (italics in KJV) */
                  .scripture-content :global(.add) {
                    font-style: italic;
                    opacity: 0.9;
                  }
                `}</style>
                <div
                  className="scripture-content"
                  dangerouslySetInnerHTML={{ __html: passage }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="mt-6">
          <div className="space-y-4">
            {isLoadingQuestions ? (
              // Loading skeleton for questions
              <>
                {familyMembers.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-6 h-6 bg-muted animate-pulse rounded flex-shrink-0 mt-1"></div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
                              <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                            </div>
                            <div className="space-y-2">
                              <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                              <div className="h-4 bg-muted animate-pulse rounded w-11/12"></div>
                              <div className="h-4 bg-muted animate-pulse rounded w-10/12"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="h-16 bg-muted animate-pulse rounded w-full mt-6"></div>
              </>
            ) : (
              // Actual questions
              <>
                {questions.map((question, index) => {
                  const memberColor = getColorById(question.color);
                  return (
                    <Card
                      key={question.familyMemberId}
                      className={answeredQuestions.has(index) ? "opacity-60" : ""}
                      style={{
                        borderLeft: `4px solid ${memberColor.value}`,
                      }}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-4">
                            <button
                              onClick={() => toggleQuestion(index)}
                              className="mt-1 flex-shrink-0"
                            >
                              <div
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors`}
                                style={{
                                  backgroundColor: answeredQuestions.has(index) ? memberColor.value : 'transparent',
                                  borderColor: memberColor.value,
                                }}
                              >
                                {answeredQuestions.has(index) && (
                                  <Check className="h-4 w-4" style={{ color: memberColor.textColor }} />
                                )}
                              </div>
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                  style={{
                                    backgroundColor: memberColor.value,
                                    color: memberColor.textColor,
                                  }}
                                >
                                  {question.name.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="text-xl font-semibold">{question.name}</h3>
                                <span className="text-sm text-muted-foreground">Age {question.age}</span>
                              </div>
                              <p className="text-lg leading-relaxed">{question.question}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {questions.length > 0 && !isHistoricalView && (
                  <Button
                    size="lg"
                    onClick={completeReading}
                    className="w-full h-16 mt-6"
                  >
                    <Check className="h-6 w-6 mr-2" />
                    Mark as Complete
                  </Button>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button for Audio Control - only show if TTS is enabled */}
      {enableTts && (state === "ready" || state === "scripture-complete" || state === "playing-scripture") && (
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
