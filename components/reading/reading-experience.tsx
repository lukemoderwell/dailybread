'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
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
import { AchievementCelebration } from '@/components/achievements/achievement-celebration';

// Phase components
import GatheringPhase from './gathering-phase';
import BigIdeaReveal from './big-idea-reveal';
import QuestionCardStack from './question-card-stack';
import DiscoveryReveal, { type DiscoveryType } from './discovery-reveal';
import SessionSeal from './session-seal';

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

interface Discovery {
  type: DiscoveryType;
  content: string;
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
}

type SessionPhase =
  | 'loading'
  | 'gathering'
  | 'reading'
  | 'bigIdea'
  | 'spotlight'
  | 'discovery'
  | 'seal';

export default function ReadingExperience({
  userId,
  familyMembers,
  currentBook,
  currentChapter,
  currentVerse,
  currentStreak,
  bibleTranslation,
  versesPerSession,
}: ReadingExperienceProps) {
  const router = useRouter();

  // Phase state
  const [phase, setPhase] = useState<SessionPhase>('loading');

  // Content state
  const [passage, setPassage] = useState('');
  const [reference, setReference] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [discussionGuide, setDiscussionGuide] = useState<DiscussionGuide | null>(null);
  const [discovery, setDiscovery] = useState<Discovery | null>(null);
  const [tomorrowPreview, setTomorrowPreview] = useState<string>('');
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  // Previous session state (for "Previously on..." recap)
  const [previousReference, setPreviousReference] = useState<string>('');
  const [previousSummary, setPreviousSummary] = useState<string>('');

  // Feedback state
  const [questionFeedback, setQuestionFeedback] = useState<
    Map<string, { rating: 1 | -1; text?: string }>
  >(new Map());
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedQuestionForFeedback, setSelectedQuestionForFeedback] =
    useState<Question | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCompletingReading, setIsCompletingReading] = useState(false);

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

  // Achievement celebration state
  const [achievementNotifications, setAchievementNotifications] = useState<
    {
      notificationId: string;
      achievement: {
        id: string;
        name: string;
        description: string;
        icon: string;
        isMajor: boolean;
      };
    }[]
  >([]);
  const [pendingRefresh, setPendingRefresh] = useState(false);

  // Load session data
  useEffect(() => {
    async function loadContent() {
      try {
        // Reset state
        setPassage('');
        setReference('');
        setQuestions([]);
        setDiscussionGuide(null);
        setPassageMetadata(null);
        setSessionSummary('');
        setDiscovery(null);
        setTomorrowPreview('');
        setPreviousReference('');
        setPreviousSummary('');

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

          // Handle discussion guide
          const guide = sessionData.session.content.discussionGuide;
          if (guide && typeof guide === 'object' && !Array.isArray(guide)) {
            setDiscussionGuide(guide);
          } else if (guide) {
            const summaryText = Array.isArray(guide) ? guide.join('\n\n') : guide;
            setDiscussionGuide({
              bigIdea: summaryText,
              aboutGod: '',
              aboutPeople: '',
              starterQuestion: '',
            });
          }

          // Load discovery if available
          if (sessionData.session.content.discovery) {
            setDiscovery(sessionData.session.content.discovery);
          }

          setIsHistoricalView(true);
          setNavigationMeta(sessionData.navigation);
          setPhase('reading'); // Go straight to reading for historical
          setIsLoadingQuestions(false);

          // Handle summary
          if (sessionData.session.summary) {
            setSessionSummary(sessionData.session.summary);
          } else {
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
              .finally(() => setIsLoadingSummary(false));
          }

          return;
        }

        // Load current reading (today's reading)
        setIsHistoricalView(false);
        setIsLoadingQuestions(true);

        // Fetch Bible passage
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
        const htmlContent = passageData.content;

        setPassage(htmlContent);
        setReference(passageData.reference);

        // Store passage metadata
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

        // Move to gathering phase (content will load in background)
        setPhase('gathering');

        // Load questions in parallel
        Promise.all([
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

                // Handle discussion guide
                const guide = questionsData.discussionGuide;
                if (guide && typeof guide === 'object' && !Array.isArray(guide)) {
                  setDiscussionGuide(guide);
                } else if (guide) {
                  const summaryText = Array.isArray(guide) ? guide.join('\n\n') : guide;
                  setDiscussionGuide({
                    bigIdea: summaryText,
                    aboutGod: '',
                    aboutPeople: '',
                    starterQuestion: '',
                  });
                }

                // Handle discovery and preview if present
                if (questionsData.discovery) {
                  setDiscovery(questionsData.discovery);
                }
                if (questionsData.tomorrowPreview) {
                  setTomorrowPreview(questionsData.tomorrowPreview);
                }
              }
            })
            .finally(() => setIsLoadingQuestions(false)),

          // Fetch navigation metadata and previous session summary
          fetch('/api/bible/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          }).then(async (navRes) => {
            if (navRes.ok) {
              const navData = await navRes.json();
              setNavigationMeta(navData.navigation);

              // Fetch previous session for "Previously on..." recap
              if (navData.navigation.previousId) {
                const prevRes = await fetch('/api/bible/sessions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sessionId: navData.navigation.previousId }),
                });
                if (prevRes.ok) {
                  const prevData = await prevRes.json();
                  setPreviousReference(prevData.session.content.reference || '');

                  // Use cached summary if available, otherwise generate one
                  if (prevData.session.summary) {
                    setPreviousSummary(prevData.session.summary);
                  } else {
                    // Generate a brief summary focused on scripture content
                    const prevContent = prevData.session.content;
                    const scriptureText = prevContent.scripture_text
                      ?.replace(/<[^>]*>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();

                    const summaryRes = await fetch('/api/bible/summarize-session', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sessionId: prevData.session.id,
                        reference: prevContent.reference,
                        scriptureText,
                        bigIdea: prevContent.discussionGuide?.bigIdea,
                      }),
                    });
                    if (summaryRes.ok) {
                      const summaryData = await summaryRes.json();
                      setPreviousSummary(summaryData.summary);
                    }
                  }
                }
              }
            }
          }),
        ]).catch(console.error);
      } catch (error) {
        console.error('Content loading error:', error);
        toast.error("Failed to load today's reading");
      }
    }

    loadContent();
  }, [
    currentBook,
    currentChapter,
    currentVerse,
    familyMembers,
    bibleTranslation,
    currentSessionId,
    versesPerSession,
  ]);

  // Question feedback handlers
  const handleQuestionFeedback = (question: Question, rating: 1 | -1) => {
    const currentFeedback = questionFeedback.get(question.familyMemberId);

    if (currentFeedback?.rating === rating) {
      const newFeedback = new Map(questionFeedback);
      newFeedback.delete(question.familyMemberId);
      setQuestionFeedback(newFeedback);
      return;
    }

    if (rating === 1) {
      const newFeedback = new Map(questionFeedback);
      newFeedback.set(question.familyMemberId, { rating: 1 });
      setQuestionFeedback(newFeedback);
      return;
    }

    setSelectedQuestionForFeedback(question);
    setFeedbackText(currentFeedback?.text || '');
    setFeedbackDialogOpen(true);
  };

  const handleRegenerateQuestion = async () => {
    if (!selectedQuestionForFeedback) return;

    setIsRegenerating(true);

    try {
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

  // Navigation handlers
  const navigateToPrevious = () => {
    if (navigationMeta.previousId) {
      setPhase('loading');
      setCurrentSessionId(navigationMeta.previousId);
    }
  };

  const navigateToNext = () => {
    setPhase('loading');
    if (navigationMeta.nextId) {
      setCurrentSessionId(navigationMeta.nextId);
    } else {
      setCurrentSessionId(null);
      setIsHistoricalView(false);
    }
  };

  // Complete reading
  const completeReading = async () => {
    setIsCompletingReading(true);
    try {
      if (!passageMetadata) {
        toast.error('Session data not loaded yet');
        setIsCompletingReading(false);
        return;
      }

      const supabase = createSupabaseClient();
      const localDate = getLocalDateISO();

      // Save session
      const { data: session, error: sessionError } = await supabase
        .from('reading_sessions')
        .insert({
          user_id: userId,
          book: passageMetadata.startBook,
          chapter: passageMetadata.startChapter,
          verses_read: passageMetadata.versesRead,
          date: localDate,
          content: {
            scripture_text: passage,
            reference: reference,
            questions: questions,
            discussionGuide: discussionGuide,
            discovery: discovery,
            ending_book: passageMetadata.endingBook,
            ending_chapter: passageMetadata.endingChapter,
            ending_verse: passageMetadata.endingVerse,
          },
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Save question feedback
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

      // Calculate next starting position
      const currentEndPos: VersePosition = {
        book: passageMetadata.endingBook,
        chapter: passageMetadata.endingChapter,
        verse: passageMetadata.endingVerse,
      };

      const nextStartPos = calculateEndingPosition(currentEndPos, 1);

      if (!nextStartPos) {
        await supabase
          .from('reading_progress')
          .update({
            current_book: 'Genesis',
            current_chapter: 1,
            current_verse: 1,
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('reading_progress')
          .update({
            current_book: nextStartPos.book,
            current_chapter: nextStartPos.chapter,
            current_verse: nextStartPos.verse,
          })
          .eq('user_id', userId);
      }

      // Check for achievements
      try {
        const achievementRes = await fetch('/api/achievements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (achievementRes.ok) {
          const { newAchievements } = await achievementRes.json();

          if (newAchievements && newAchievements.length > 0) {
            setAchievementNotifications(
              newAchievements.map((a: { id: string; name: string; description: string; icon: string; isMajor: boolean }) => ({
                notificationId: a.id,
                achievement: a,
              }))
            );
            setPendingRefresh(true);
            setIsCompletingReading(false);
            return;
          }
        }
      } catch (achievementError) {
        console.error('Achievement check error:', achievementError);
      }

      toast.success('Great job! See you tomorrow!');
      router.refresh();
    } catch (error) {
      console.error('Complete reading error:', error);
      toast.error('Failed to save progress');
      setIsCompletingReading(false);
    }
  };

  // Achievement dismissal
  const handleAchievementDismiss = async (notificationId: string) => {
    try {
      await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markSeen', notificationId }),
      });
    } catch (error) {
      console.error('Failed to mark notification as seen:', error);
    }

    setAchievementNotifications((prev) =>
      prev.filter((n) => n.notificationId !== notificationId)
    );

    if (achievementNotifications.length <= 1 && pendingRefresh) {
      toast.success('Great job! See you tomorrow!');
      router.refresh();
    }
  };

  // Phase navigation handlers
  const handleGatheringComplete = () => setPhase('reading');
  const handleReadingComplete = () => {
    if (discussionGuide?.bigIdea) {
      setPhase('bigIdea');
    } else if (questions.length > 0) {
      setPhase('spotlight');
    } else {
      setPhase('seal');
    }
  };
  const handleBigIdeaComplete = () => {
    if (questions.length > 0) {
      setPhase('spotlight');
    } else {
      setPhase('seal');
    }
  };
  const handleSpotlightComplete = () => {
    if (discovery) {
      setPhase('discovery');
    } else {
      setPhase('seal');
    }
  };
  const handleDiscoveryComplete = () => setPhase('seal');

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-11/12"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 py-4 pb-24 md:p-4 md:pb-24">
      {/* Header with navigation (only shown for reading phase and historical) */}
      {(phase === 'reading' || isHistoricalView) && (
        <div className="flex items-center justify-between mb-6">
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
        </div>
      )}

      {/* Historical view summary */}
      {isHistoricalView && phase === 'reading' && (
        <div className="bg-muted/50 border border-muted rounded-lg p-4 space-y-2 mb-6">
          {isLoadingSummary ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Loading summary...</p>
              <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
            </div>
          ) : sessionSummary ? (
            <p className="text-sm leading-relaxed">{sessionSummary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              You&apos;re viewing a previous reading.
            </p>
          )}
        </div>
      )}

      {/* Phase content */}
      <AnimatePresence mode="wait">
        {phase === 'gathering' && !isHistoricalView && (
          <motion.div
            key="gathering"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GatheringPhase
              familyMembers={familyMembers}
              reference={reference}
              previousReference={previousReference}
              previousSummary={previousSummary}
              onReady={handleGatheringComplete}
            />
          </motion.div>
        )}

        {phase === 'reading' && (
          <motion.div
            key="reading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-0 md:border shadow-none md:shadow-sm">
              <CardContent className="pt-4 px-4 pb-8 md:pt-8 md:px-12 md:pb-12">
                <div className="mx-auto" style={{ maxWidth: '65ch' }}>
                  <style jsx>{`
                    .scripture-content {
                      font-family: var(--font-serif), serif;
                      font-size: 1.125rem;
                      line-height: 1.7;
                      text-align: left;
                      color: hsl(var(--foreground));
                      font-weight: 400;
                      letter-spacing: -0.003em;
                      -webkit-font-smoothing: antialiased;
                    }

                    @media (min-width: 768px) {
                      .scripture-content {
                        font-size: 1.3125rem;
                        line-height: 1.75;
                      }
                    }

                    @media (min-width: 1024px) {
                      .scripture-content {
                        font-size: 1.375rem;
                        line-height: 1.8;
                      }
                    }

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

                    .scripture-content :global(span[data-sid]) {
                      margin-right: 0.1em;
                    }

                    .scripture-content :global(p) {
                      display: inline;
                      margin: 0;
                      padding: 0;
                    }

                    .scripture-content :global(.p) {
                      display: inline;
                    }

                    .scripture-content :global(.add) {
                      font-style: italic;
                      opacity: 0.95;
                    }

                    .scripture-content :global(.s),
                    .scripture-content :global(.s1) {
                      display: block;
                      margin-top: 1.75rem;
                      margin-bottom: 0.85rem;
                      font-size: 1.12em;
                      line-height: 1.4;
                      font-weight: 600;
                    }

                    .scripture-content :global(.s:first-child),
                    .scripture-content :global(.s1:first-child) {
                      margin-top: 0.5rem;
                    }

                    .scripture-content {
                      text-rendering: optimizeLegibility;
                      font-feature-settings: 'kern' 1, 'liga' 1;
                    }

                    .scripture-content :global(::selection) {
                      background-color: hsl(var(--accent) / 0.2);
                    }
                  `}</style>
                  <div
                    className="scripture-content"
                    dangerouslySetInnerHTML={{ __html: passage }}
                  />
                </div>

                <div className="mt-8 flex justify-center">
                  {isHistoricalView ? (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={navigateToNext}
                      className="min-w-[200px]"
                    >
                      <ChevronRight className="mr-2 h-5 w-5" />
                      {navigationMeta.hasNext ? 'Next Reading' : "Today's Reading"}
                    </Button>
                  ) : isLoadingQuestions ? (
                    <Button size="lg" disabled className="min-w-[200px]">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Preparing Discussion...
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={handleReadingComplete}
                      className="min-w-[200px]"
                    >
                      <BookOpen className="mr-2 h-5 w-5" />
                      Continue to Discussion
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === 'bigIdea' && discussionGuide && !isHistoricalView && (
          <motion.div
            key="bigIdea"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <BigIdeaReveal
              bigIdea={discussionGuide.bigIdea}
              aboutGod={discussionGuide.aboutGod}
              aboutPeople={discussionGuide.aboutPeople}
              onContinue={handleBigIdeaComplete}
            />
          </motion.div>
        )}

        {phase === 'spotlight' && !isHistoricalView && (
          <motion.div
            key="spotlight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-foreground">Family Questions</h2>
              <p className="text-sm text-muted-foreground">Swipe through each question</p>
            </div>
            <QuestionCardStack
              questions={questions}
              onComplete={handleSpotlightComplete}
              onFeedback={handleQuestionFeedback}
              questionFeedback={questionFeedback}
              isHistoricalView={false}
            />
          </motion.div>
        )}

        {phase === 'discovery' && discovery && !isHistoricalView && (
          <motion.div
            key="discovery"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <DiscoveryReveal
              discovery={discovery}
              onContinue={handleDiscoveryComplete}
            />
          </motion.div>
        )}

        {phase === 'seal' && !isHistoricalView && (
          <motion.div
            key="seal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SessionSeal
              familyMembers={familyMembers}
              currentStreak={currentStreak + 1} // Will be incremented
              versesRead={passageMetadata?.versesRead || 0}
              tomorrowPreview={tomorrowPreview}
              onComplete={completeReading}
              isCompleting={isCompletingReading}
            />
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Achievement Celebration */}
      <AchievementCelebration
        notifications={achievementNotifications}
        onDismiss={handleAchievementDismiss}
      />
    </div>
  );
}
