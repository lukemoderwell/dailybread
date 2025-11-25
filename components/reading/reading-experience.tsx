'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getColorById } from '@/lib/colors';
import {
  calculateEndingPosition,
  type VersePosition,
} from '@/lib/bible-metadata';
import { getLocalDateISO } from '@/lib/dates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// import BiblePainting from '@/components/bible-painting';

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
  application?: string;
}

interface DiscussionGuide {
  bigIdea: string;
  aboutGod: string;
  aboutPeople: string;
  starterQuestion: string;
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
  versesPerSession: number;
  // enablePaintings?: boolean;
}

type ReadingState = 'loading' | 'ready';

export default function ReadingExperience({
  userId,
  familyMembers,
  currentBook,
  currentChapter,
  currentVerse,
  bibleTranslation,
  versesPerSession,
  // enablePaintings = false,
}: ReadingExperienceProps) {
  const router = useRouter();
  const [state, setState] = useState<ReadingState>('loading');
  const [passage, setPassage] = useState('');
  const [reference, setReference] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [discussionGuide, setDiscussionGuide] = useState<DiscussionGuide | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(
    new Set()
  );
  const [questionFeedback, setQuestionFeedback] = useState<
    Map<string, { rating: 1 | -1; text?: string }>
  >(new Map());
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedQuestionForFeedback, setSelectedQuestionForFeedback] =
    useState<Question | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCompletingReading, setIsCompletingReading] = useState(false);
  const [activeTab, setActiveTab] = useState('scripture');
  const [openApplications, setOpenApplications] = useState<Set<string>>(
    new Set()
  );
  const [isDiscussionGuideOpen, setIsDiscussionGuideOpen] = useState(true);

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
  const [sessionSummary, setSessionSummary] = useState<string>('');
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
        setPassage('');
        setReference('');
        setQuestions([]);
        setDiscussionGuide(null);
        setPassageMetadata(null);
        setSessionSummary('');
        setIsDiscussionGuideOpen(true);

        // If viewing a historical session, load that session's data
        if (currentSessionId !== null) {
          const sessionRes = await fetch('/api/bible/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSessionId }),
          });

          if (!sessionRes.ok) throw new Error('Failed to fetch session');

          const sessionData = await sessionRes.json();

          // Set historical session data
          setPassage(sessionData.session.content.scripture_text);
          setReference(sessionData.session.content.reference);
          setQuestions(sessionData.session.content.questions || []);
          // Handle backward compatibility: old formats (array or string) and new format (structured object)
          const guide = sessionData.session.content.discussionGuide;
          if (guide && typeof guide === 'object' && !Array.isArray(guide)) {
            // New structured format
            setDiscussionGuide(guide);
          } else if (guide) {
            // Old format: convert to new structure with summary only
            const summaryText = Array.isArray(guide) ? guide.join('\n\n') : guide;
            setDiscussionGuide({
              bigIdea: summaryText,
              aboutGod: '',
              aboutPeople: '',
              starterQuestion: '',
            });
          } else {
            setDiscussionGuide(null);
          }
          setIsHistoricalView(true);
          setNavigationMeta(sessionData.navigation);
          setState('ready');
          setIsLoadingQuestions(false);

          // Check if we have a cached summary
          if (sessionData.session.summary) {
            // Use cached summary
            setSessionSummary(sessionData.session.summary);
            setIsLoadingSummary(false);
          } else {
            // Generate summary in the background
            setIsLoadingSummary(true);
            fetch('/api/bible/summarize-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
                console.error('Summary generation failed:', error);
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
        const passageRes = await fetch('/api/bible/passage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            book: currentBook,
            chapter: currentChapter,
            verse: currentVerse,
            translation: bibleTranslation,
            verses_per_session: versesPerSession,
          }),
        });

        if (!passageRes.ok) throw new Error('Failed to fetch passage');

        const passageData = await passageRes.json();

        // Use the HTML content directly from the API
        // The API returns: <span class="v">1</span>The text...
        // We'll style these with CSS instead of converting to [1]
        const htmlContent = passageData.content;

        // Set initial content
        setPassage(htmlContent);

        // Highlight Jesus' words (only for Gospels and Acts)
        const gospelsAndActs = ['Matthew', 'Mark', 'Luke', 'John', 'Acts'];
        if (gospelsAndActs.includes(passageData.book)) {
          // Call highlighting API asynchronously (non-blocking)
          fetch('/api/bible/highlight-jesus-words', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              htmlContent: passageData.content,
              reference: passageData.reference,
              book: passageData.book,
            }),
          })
            .then(async (highlightRes) => {
              if (highlightRes.ok) {
                const highlightData = await highlightRes.json();
                if (highlightData.highlightedContent) {
                  setPassage(highlightData.highlightedContent);
                }
              }
            })
            .catch((error) => {
              console.error('Failed to highlight Jesus words:', error);
              // Continue with original content
            });
        }
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

        // Extract plain text for question generation
        const plainText = htmlContent
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Show content immediately - user can start reading while questions load
        setState('ready');

        // Load questions in parallel (non-blocking)
        Promise.all([
          // Generate questions
          fetch('/api/bible/generate-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              passage: plainText,
              reference: passageData.reference,
              familyMembers: familyMembers,
            }),
          })
            .then(async (questionsRes) => {
              if (questionsRes.ok) {
                const questionsData = await questionsRes.json();
                setQuestions(questionsData.questions);
                // Handle structured discussion guide
                const guide = questionsData.discussionGuide;
                if (guide && typeof guide === 'object' && !Array.isArray(guide)) {
                  // New structured format
                  setDiscussionGuide(guide);
                } else if (guide) {
                  // Old format: convert to new structure with summary only
                  const summaryText = Array.isArray(guide) ? guide.join('\n\n') : guide;
                  setDiscussionGuide({
                    bigIdea: summaryText,
                    aboutGod: '',
                    aboutPeople: '',
                    starterQuestion: '',
                  });
                } else {
                  setDiscussionGuide(null);
                }
              } else {
                console.error('Failed to generate questions');
              }
            })
            .finally(() => {
              setIsLoadingQuestions(false);
            }),

          // Fetch navigation metadata for current reading
          fetch('/api/bible/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}), // No sessionId = current reading
          }).then(async (navRes) => {
            if (navRes.ok) {
              const navData = await navRes.json();
              setNavigationMeta(navData.navigation);
            }
          }),
        ]).catch((error) => {
          console.error('Error loading questions:', error);
          setIsLoadingQuestions(false);
          // Don't block the UI - content is already showing
        });
      } catch (error) {
        console.error('Content loading error:', error);
        toast.error("Failed to load today's reading");
      }
    }

    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentBook,
    currentChapter,
    currentVerse,
    familyMembers,
    bibleTranslation,
    currentSessionId,
  ]);

  useEffect(() => {
    setOpenApplications(new Set());
  }, [questions]);

  const toggleQuestion = (index: number) => {
    const newAnswered = new Set(answeredQuestions);
    if (newAnswered.has(index)) {
      newAnswered.delete(index);
    } else {
      newAnswered.add(index);
    }
    setAnsweredQuestions(newAnswered);
  };

  const toggleApplication = (id: string) => {
    setOpenApplications((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleQuestionFeedback = (question: Question, rating: 1 | -1) => {
    const currentFeedback = questionFeedback.get(question.familyMemberId);

    // Toggle off if clicking same rating
    if (currentFeedback?.rating === rating) {
      const newFeedback = new Map(questionFeedback);
      newFeedback.delete(question.familyMemberId);
      setQuestionFeedback(newFeedback);
      return;
    }

    // For thumbs up, just set rating
    if (rating === 1) {
      const newFeedback = new Map(questionFeedback);
      newFeedback.set(question.familyMemberId, { rating: 1 });
      setQuestionFeedback(newFeedback);
      return;
    }

    // For thumbs down, show feedback dialog
    setSelectedQuestionForFeedback(question);
    setFeedbackText(currentFeedback?.text || '');
    setFeedbackDialogOpen(true);
  };

  const handleRegenerateQuestion = async () => {
    if (!selectedQuestionForFeedback) return;

    setIsRegenerating(true);

    try {
      // Get all other questions for context
      const otherQuestions = questions
        .filter(
          (q) => q.familyMemberId !== selectedQuestionForFeedback.familyMemberId
        )
        .map((q) => q.question);

      const response = await fetch('/api/bible/regenerate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage: passage
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim(),
          reference,
          familyMember: {
            id: selectedQuestionForFeedback.familyMemberId,
            name: selectedQuestionForFeedback.name,
            age: selectedQuestionForFeedback.age,
            color: selectedQuestionForFeedback.color,
          },
          previousQuestion: selectedQuestionForFeedback.question,
          feedback: feedbackText || undefined,
          allQuestions: otherQuestions,
        }),
      });

      if (!response.ok) throw new Error('Failed to regenerate question');

      const { question: newQuestion, application: newApplication } =
        await response.json();

      // Update the question in the questions array
      setQuestions(
        questions.map((q) =>
          q.familyMemberId === selectedQuestionForFeedback.familyMemberId
            ? {
                ...q,
                question: newQuestion,
                application: newApplication || q.application,
              }
            : q
        )
      );

      // Set thumbs down feedback with text
      const newFeedback = new Map(questionFeedback);
      newFeedback.set(selectedQuestionForFeedback.familyMemberId, {
        rating: -1,
        text: feedbackText || undefined,
      });
      setQuestionFeedback(newFeedback);

      toast.success('Question regenerated!');
      setFeedbackDialogOpen(false);
    } catch (error) {
      console.error('Regeneration error:', error);
      toast.error('Failed to regenerate question');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Session navigation handlers
  const navigateToPrevious = () => {
    if (navigationMeta.previousId) {
      setState('loading');
      setCurrentSessionId(navigationMeta.previousId);
    }
  };

  const navigateToNext = () => {
    setState('loading');
    if (navigationMeta.nextId) {
      setCurrentSessionId(navigationMeta.nextId);
    } else {
      // Navigate to current reading (today)
      setCurrentSessionId(null);
      setIsHistoricalView(false);
    }
  };

  const completeReading = async () => {
    setIsCompletingReading(true);
    try {
      if (!passageMetadata) {
        toast.error('Session data not loaded yet');
        setIsCompletingReading(false);
        return;
      }

      const supabase = createSupabaseClient();

      // Get user's local date in ISO format to avoid timezone issues
      const localDate = getLocalDateISO();

      // Save session with ending position metadata
      const { data: session, error: sessionError } = await supabase
        .from('reading_sessions')
        .insert({
          user_id: userId,
          book: passageMetadata.startBook,
          chapter: passageMetadata.startChapter,
          verses_read: passageMetadata.versesRead,
          date: localDate, // Explicitly set user's local date
          content: {
            scripture_text: passage,
            reference: reference,
            questions: questions,
            discussionGuide: discussionGuide,
            ending_book: passageMetadata.endingBook,
            ending_chapter: passageMetadata.endingChapter,
            ending_verse: passageMetadata.endingVerse,
          },
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Save question feedback if any exists
      if (questionFeedback.size > 0 && session) {
        const feedbackPromises = Array.from(questionFeedback.entries()).map(
          ([familyMemberId, feedback]) => {
            const question = questions.find(
              (q) => q.familyMemberId === familyMemberId
            );
            if (!question) return Promise.resolve();

            return fetch('/api/bible/question-feedback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: session.id,
                familyMemberId: question.familyMemberId,
                familyMemberName: question.name,
                familyMemberAge: question.age,
                questionText: question.question,
                rating: feedback.rating,
                bibleReference: reference,
                feedbackText: feedback.text,
              }),
            });
          }
        );

        await Promise.all(feedbackPromises);
      }

      // Calculate next starting position (one verse after where we ended)
      const currentEndPos: VersePosition = {
        book: passageMetadata.endingBook,
        chapter: passageMetadata.endingChapter,
        verse: passageMetadata.endingVerse,
      };

      const nextStartPos = calculateEndingPosition(currentEndPos, 1);

      if (!nextStartPos) {
        // We've reached the end of the Bible - wrap around to Genesis 1:1
        await supabase
          .from('reading_progress')
          .update({
            current_book: 'Genesis',
            current_chapter: 1,
            current_verse: 1,
          })
          .eq('user_id', userId);
      } else {
        // Update reading_progress with next starting position
        await supabase
          .from('reading_progress')
          .update({
            current_book: nextStartPos.book,
            current_chapter: nextStartPos.chapter,
            current_verse: nextStartPos.verse,
          })
          .eq('user_id', userId);
      }

      toast.success('Great job! See you tomorrow!');

      // Refresh to get new reading (this unmounts the component and reloads from scratch)
      router.refresh();
    } catch (error) {
      console.error('Complete reading error:', error);
      toast.error('Failed to save progress');
      setIsCompletingReading(false);
    }
  };

  if (state === 'loading') {
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
    <div className="max-w-4xl mx-auto px-2 py-4 pb-24 space-y-6 md:p-4 md:pb-24">
      {/* Header with streak and navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {navigationMeta.hasPrevious && (
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateToPrevious}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-lg lg:text-2xl font-bold">
              {isHistoricalView ? 'Previous Reading' : "Today's Reading"}
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
        {/* Navigation moved to layout (BottomNav on mobile, Header on desktop) */}
      </div>

      {isHistoricalView && (
        <div className="bg-muted/50 border border-muted rounded-lg p-4 space-y-2">
          {isLoadingSummary ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-2">
                Loading summary...
              </p>
              <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
            </div>
          ) : sessionSummary ? (
            <p className="text-sm leading-relaxed">{sessionSummary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              You&apos;re viewing a previous reading. Use the arrows above to
              navigate back to today&apos;s reading.
            </p>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="scripture" className="text-base">
            Scripture
          </TabsTrigger>
          <TabsTrigger value="questions" className="text-base">
            Discussion
          </TabsTrigger>
        </TabsList>

        {/* Scripture Tab */}
        <TabsContent value="scripture" className="mt-6">
          <Card className="border-0 md:border shadow-none md:shadow-sm">
            <CardContent className="pt-4 px-4 pb-8 md:pt-8 md:px-12 md:pb-12">
              <div className="mx-auto" style={{ maxWidth: '65ch' }}>
                <style jsx>{`
                  .scripture-content {
                    /* Medium-inspired typography */
                    font-family: var(--font-serif), serif;
                    font-size: 1.125rem;
                    line-height: 1.7;
                    text-align: left;
                    color: hsl(var(--foreground));
                    font-weight: 400;
                    letter-spacing: -0.003em;
                    word-spacing: 0;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                  }

                  @media (min-width: 768px) {
                    .scripture-content {
                      font-size: 1.3125rem;
                      line-height: 1.75;
                      letter-spacing: -0.005em;
                    }
                  }

                  @media (min-width: 1024px) {
                    .scripture-content {
                      font-size: 1.375rem;
                      line-height: 1.8;
                    }
                  }

                  /* Style Bible API verse numbers - subtle and unobtrusive */
                  .scripture-content :global(.v) {
                    opacity: 0.75;
                    font-size: 0.7em;
                    font-weight: 500;
                    margin-right: 0.25em;
                    margin-left: 0.35em;
                    vertical-align: super;
                    line-height: 0;
                    position: relative;
                    top: -0.35em;
                    color: hsl(var(--muted-foreground));
                  }

                  /* Add slight spacing after verse spans for sentence separation */
                  .scripture-content :global(span[data-sid]) {
                    margin-right: 0.1em;
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

                  /* Style added words (italics in KJV) - subtle distinction */
                  .scripture-content :global(.add) {
                    font-style: italic;
                    opacity: 0.95;
                  }

                  /* Style Jesus' words - red letter edition */
                  .scripture-content :global(.jesus-words) {
                    color: hsl(0, 65%, 50%);
                    font-weight: 500;
                  }

                  /* Dark mode adjustment for Jesus' words */
                  @media (prefers-color-scheme: dark) {
                    .scripture-content :global(.jesus-words) {
                      color: hsl(0, 70%, 65%);
                    }
                  }

                  /* Section headings (e.g., "Jesus Knows What People Are Like") */
                  .scripture-content :global(.s),
                  .scripture-content :global(.s1) {
                    display: block;
                    margin-top: 1.75rem;
                    margin-bottom: 0.85rem;
                    font-size: 1.12em;
                    line-height: 1.4;
                    font-weight: 600;
                    letter-spacing: -0.01em;
                    color: hsl(var(--foreground));
                  }

                  .scripture-content :global(.s:first-child),
                  .scripture-content :global(.s1:first-child) {
                    margin-top: 0.5rem;
                  }

                  /* Improve text rendering */
                  .scripture-content {
                    text-rendering: optimizeLegibility;
                    font-feature-settings: 'kern' 1, 'liga' 1;
                  }

                  /* Selection styling for better reading experience */
                  .scripture-content :global(::selection) {
                    background-color: hsl(var(--accent) / 0.2);
                  }
                `}</style>
                <div
                  className="scripture-content"
                  dangerouslySetInnerHTML={{ __html: passage }}
                />
              </div>
              {/* Bible Painting - Commented out for now */}
              {/* {enablePaintings && passage && !isHistoricalView && (
                <BiblePainting
                  reference={reference}
                  passage={passage
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()}
                  familyMemberAges={familyMembers.map((m) => m.age)}
                  enabled={enablePaintings}
                  onPaintingGenerated={(data) => {
                    console.log('Painting generated:', data);
                    // Could save to session here if needed
                  }}
                />
              )} */}

              {/* Continue to Questions Button */}
              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
                  className="w-full md:w-auto min-w-[200px]"
                  onClick={() => setActiveTab('questions')}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Discuss Questions
                </Button>
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
                <Card className="border-0 md:border shadow-none md:shadow-sm">
                  <CardContent className="pt-6 space-y-3">
                    <div className="h-5 w-48 bg-muted animate-pulse rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                      <div className="h-4 bg-muted animate-pulse rounded w-11/12"></div>
                      <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
                {familyMembers.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-6 h-6 bg-muted animate-pulse rounded shrink-0 mt-1"></div>
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
                {discussionGuide && (
                  <Card className="border-0 md:border shadow-none md:shadow-sm">
                    <CardContent className="pt-6">
                      <button
                        onClick={() => setIsDiscussionGuideOpen(!isDiscussionGuideOpen)}
                        className="w-full flex items-center justify-between gap-3 text-left hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 rounded-full bg-primary/10 text-primary">
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground">
                              Family
                            </p>
                            <h3 className="text-xl font-semibold">
                              Discussion guide
                            </h3>
                          </div>
                        </div>
                        {isDiscussionGuideOpen ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                      </button>
                      {isDiscussionGuideOpen && (
                        <div className="mt-6 space-y-5">
                          {/* Big Idea */}
                          {discussionGuide.bigIdea && (
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                The Big Idea
                              </h4>
                              <p className="text-lg leading-relaxed text-foreground font-medium">
                                {discussionGuide.bigIdea}
                              </p>
                            </div>
                          )}

                          {/* About God & About People */}
                          {(discussionGuide.aboutGod || discussionGuide.aboutPeople) && (
                            <ul className="space-y-2">
                              {discussionGuide.aboutGod && (
                                <li className="flex gap-3 text-base leading-relaxed">
                                  <span className="text-primary font-bold shrink-0">•</span>
                                  <span className="text-foreground">
                                    <span className="font-semibold">About God:</span> {discussionGuide.aboutGod}
                                  </span>
                                </li>
                              )}
                              {discussionGuide.aboutPeople && (
                                <li className="flex gap-3 text-base leading-relaxed">
                                  <span className="text-primary font-bold shrink-0">•</span>
                                  <span className="text-foreground">
                                    <span className="font-semibold">About People:</span> {discussionGuide.aboutPeople}
                                  </span>
                                </li>
                              )}
                            </ul>
                          )}

                          {/* Family Starter Question */}
                          {discussionGuide.starterQuestion && (
                            <div className="pt-4 border-t">
                              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                Family Starter
                              </h4>
                              <p className="text-lg leading-relaxed text-foreground font-medium">
                                {discussionGuide.starterQuestion}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                {questions.map((question, index) => {
                  const memberColor = getColorById(question.color);
                  const isApplicationOpen = openApplications.has(
                    question.familyMemberId
                  );
                  return (
                    <Card
                      key={question.familyMemberId}
                      className={`transition-all duration-300 border-0 ${
                        answeredQuestions.has(index)
                          ? 'opacity-60 saturate-50 bg-muted/50'
                          : 'shadow-sm hover:shadow-md'
                      }`}
                      style={{
                        backgroundColor: answeredQuestions.has(index)
                          ? undefined
                          : `color-mix(in srgb, ${memberColor.value}, transparent 92%)`,
                        borderLeft: `4px solid ${memberColor.value}`,
                      }}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-4">
                            <button
                              onClick={() => toggleQuestion(index)}
                              className="mt-1 shrink-0"
                            >
                              <div
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors`}
                                style={{
                                  backgroundColor: answeredQuestions.has(index)
                                    ? memberColor.value
                                    : 'transparent',
                                  borderColor: memberColor.value,
                                }}
                              >
                                {answeredQuestions.has(index) && (
                                  <Check
                                    className="h-4 w-4"
                                    style={{ color: memberColor.textColor }}
                                  />
                                )}
                              </div>
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                  style={{
                                    backgroundColor: memberColor.value,
                                    color: memberColor.textColor,
                                  }}
                                >
                                  {question.name.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="text-lg font-semibold">
                                  {question.name}
                                </h3>
                                <span className="text-sm text-muted-foreground">
                                  Age {question.age}
                                </span>

                                {/* Feedback menu */}
                                {!isHistoricalView && (
                                  <div className="ml-auto">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleQuestionFeedback(question, 1)
                                          }
                                          className={
                                            questionFeedback.get(
                                              question.familyMemberId
                                            )?.rating === 1
                                              ? 'bg-green-500/10 text-green-600'
                                              : ''
                                          }
                                        >
                                          <ThumbsUp className="h-4 w-4 mr-2" />
                                          Good question
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleQuestionFeedback(question, -1)
                                          }
                                          className={
                                            questionFeedback.get(
                                              question.familyMemberId
                                            )?.rating === -1
                                              ? 'bg-red-500/10 text-red-600'
                                              : ''
                                          }
                                        >
                                          <ThumbsDown className="h-4 w-4 mr-2" />
                                          Needs improvement
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                              </div>
                              <p
                                className="text-lg leading-relaxed"
                                style={{
                                  lineHeight: '1.7',
                                  fontSize: '1.0625rem',
                                  letterSpacing: '-0.002em',
                                }}
                              >
                                {question.question}
                              </p>
                              <div className="mt-4 border-t pt-4">
                                <button
                                  onClick={() =>
                                    toggleApplication(question.familyMemberId)
                                  }
                                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <span>Application idea</span>
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                      isApplicationOpen ? '-rotate-180' : ''
                                    }`}
                                  />
                                </button>
                                {isApplicationOpen && (
                                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                                    {question.application ||
                                      'Choose one simple way to live out this passage together this week.'}
                                  </p>
                                )}
                              </div>
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
                    disabled={isCompletingReading}
                    className="w-full h-16 mt-6"
                  >
                    {isCompletingReading ? (
                      <>
                        <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <Check className="h-6 w-6 mr-2" />
                        Mark as Complete
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help us improve this question</DialogTitle>
            <DialogDescription>
              What wasn&apos;t quite right about this question for{' '}
              {selectedQuestionForFeedback?.name}? (Optional)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Current question:</p>
              <p className="text-sm text-muted-foreground italic">
                &ldquo;{selectedQuestionForFeedback?.question}&rdquo;
              </p>
            </div>

            <Textarea
              placeholder="e.g., Too hard for their age, not engaging, off-topic..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFeedbackDialogOpen(false)}
              disabled={isRegenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegenerateQuestion}
              disabled={isRegenerating}
            >
              {isRegenerating ? 'Regenerating...' : 'Regenerate Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
