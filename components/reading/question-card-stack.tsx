'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { getColorById } from '@/lib/colors';
import { Check, SkipForward, ChevronDown, ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Question {
  familyMemberId: string;
  name: string;
  age: number;
  color: string;
  question: string;
  application?: string;
}

interface QuestionCardStackProps {
  questions: Question[];
  onComplete: (answeredQuestions: Question[], skippedQuestions: Question[]) => void;
  onFeedback: (question: Question, rating: 1 | -1) => void;
  questionFeedback: Map<string, { rating: 1 | -1; text?: string }>;
  isHistoricalView?: boolean;
}

export default function QuestionCardStack({
  questions,
  onComplete,
  onFeedback,
  questionFeedback,
  isHistoricalView = false,
}: QuestionCardStackProps) {
  // Shuffle questions on mount for surprise order
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Question[]>([]);
  const [skippedQuestions, setSkippedQuestions] = useState<Question[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [expandedApplication, setExpandedApplication] = useState(false);

  // Shuffle questions on mount
  useEffect(() => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
  }, [questions]);

  const currentQuestion = shuffledQuestions[currentIndex];
  const remainingCards = shuffledQuestions.length - currentIndex;
  const isLastCard = currentIndex === shuffledQuestions.length - 1;

  const handleSwipeComplete = (direction: 'left' | 'right' | 'up') => {
    if (!currentQuestion) return;

    // Show celebration animation
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 600);

    if (direction === 'up') {
      // Skipped
      setSkippedQuestions([...skippedQuestions, currentQuestion]);
    } else {
      // Answered (left or right both count as "done")
      setAnsweredQuestions([...answeredQuestions, currentQuestion]);
    }

    // Reset application expanded state for next card
    setExpandedApplication(false);

    if (isLastCard) {
      // All cards done
      setTimeout(() => {
        onComplete(
          direction === 'up' ? answeredQuestions : [...answeredQuestions, currentQuestion],
          direction === 'up' ? [...skippedQuestions, currentQuestion] : skippedQuestions
        );
      }, 300);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (shuffledQuestions.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Progress indicator */}
      <div className="flex justify-center gap-1.5 mb-6">
        {shuffledQuestions.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index < currentIndex
                ? 'w-6 bg-primary'
                : index === currentIndex
                ? 'w-6 bg-primary/60'
                : 'w-1.5 bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Card stack */}
      <div className="relative h-[420px]">
        <AnimatePresence>
          {shuffledQuestions.slice(currentIndex, currentIndex + 3).map((question, stackIndex) => (
            <SwipeableCard
              key={question.familyMemberId}
              question={question}
              isTop={stackIndex === 0}
              stackIndex={stackIndex}
              onSwipeComplete={handleSwipeComplete}
              onFeedback={onFeedback}
              questionFeedback={questionFeedback}
              isHistoricalView={isHistoricalView}
              expandedApplication={stackIndex === 0 ? expandedApplication : false}
              onToggleApplication={() => setExpandedApplication(!expandedApplication)}
            />
          ))}
        </AnimatePresence>

        {/* Celebration overlay */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
            >
              <div className="bg-primary text-primary-foreground rounded-full p-4">
                <Check className="h-8 w-8" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Swipe hints */}
      <div className="flex justify-center gap-8 mt-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Check className="h-4 w-4" />
          </div>
          <span>Swipe to complete</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <SkipForward className="h-4 w-4" />
          </div>
          <span>Swipe up to skip</span>
        </div>
      </div>

      {/* Remaining count */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        {remainingCards} {remainingCards === 1 ? 'question' : 'questions'} remaining
      </p>
    </div>
  );
}

interface SwipeableCardProps {
  question: Question;
  isTop: boolean;
  stackIndex: number;
  onSwipeComplete: (direction: 'left' | 'right' | 'up') => void;
  onFeedback: (question: Question, rating: 1 | -1) => void;
  questionFeedback: Map<string, { rating: 1 | -1; text?: string }>;
  isHistoricalView: boolean;
  expandedApplication: boolean;
  onToggleApplication: () => void;
}

function SwipeableCard({
  question,
  isTop,
  stackIndex,
  onSwipeComplete,
  onFeedback,
  questionFeedback,
  isHistoricalView,
  expandedApplication,
  onToggleApplication,
}: SwipeableCardProps) {
  const memberColor = getColorById(question.color);

  // Motion values for drag
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transform rotation based on x position
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  // Opacity for swipe indicators
  const doneOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(y, [0, -100], [0, 1]);

  // Scale for stacked cards
  const scale = 1 - stackIndex * 0.05;
  const yOffset = stackIndex * 8;

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }
  ) => {
    const threshold = 100;
    const velocityThreshold = 500;

    // Check for upward swipe (skip)
    if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) {
      onSwipeComplete('up');
      return;
    }

    // Check for horizontal swipe (done)
    if (Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > velocityThreshold) {
      onSwipeComplete(info.offset.x > 0 ? 'right' : 'left');
      return;
    }
  };

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        zIndex: 10 - stackIndex,
      }}
      initial={{ scale: 0.9, opacity: 0, y: 50 }}
      animate={{
        scale,
        opacity: 1,
        y: yOffset,
        transition: { type: 'spring', stiffness: 300, damping: 25 },
      }}
      exit={{
        x: x.get() > 0 ? 300 : x.get() < 0 ? -300 : 0,
        y: y.get() < -50 ? -300 : 0,
        opacity: 0,
        transition: { duration: 0.2 },
      }}
    >
      <motion.div
        className="h-full rounded-2xl shadow-lg cursor-grab active:cursor-grabbing overflow-hidden"
        style={{
          x: isTop ? x : 0,
          y: isTop ? y : 0,
          rotate: isTop ? rotate : 0,
          backgroundColor: `color-mix(in srgb, ${memberColor.value}, white 60%)`,
          borderLeft: `6px solid ${memberColor.value}`,
        }}
        drag={isTop}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.9}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
      >
        {/* Swipe indicators */}
        {isTop && (
          <>
            {/* Done indicator (horizontal) */}
            <motion.div
              className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full font-semibold"
              style={{ opacity: doneOpacity }}
            >
              Done!
            </motion.div>

            {/* Skip indicator (up) */}
            <motion.div
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground px-4 py-2 rounded-full font-semibold"
              style={{ opacity: skipOpacity }}
            >
              Skip for now
            </motion.div>
          </>
        )}

        {/* Card content */}
        <div className="h-full flex flex-col p-6 text-gray-900">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
              style={{
                backgroundColor: memberColor.value,
                color: memberColor.textColor,
              }}
            >
              {question.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{question.name}</h3>
              <p className="text-sm text-gray-600">Age {question.age}</p>
            </div>

            {/* Feedback menu */}
            {!isHistoricalView && isTop && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onFeedback(question, 1)}
                    className={
                      questionFeedback.get(question.familyMemberId)?.rating === 1
                        ? 'bg-green-500/10 text-green-600'
                        : ''
                    }
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Good question
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onFeedback(question, -1)}
                    className={
                      questionFeedback.get(question.familyMemberId)?.rating === -1
                        ? 'bg-red-500/10 text-red-600'
                        : ''
                    }
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Needs improvement
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Question */}
          <div className="flex-1 flex items-center">
            <p
              className="text-lg leading-relaxed text-gray-900"
              style={{
                lineHeight: '1.7',
                fontSize: '1.125rem',
                letterSpacing: '-0.002em',
              }}
            >
              {question.question}
            </p>
          </div>

          {/* Application section */}
          {question.application && isTop && (
            <div className="border-t border-gray-400/30 pt-4 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleApplication();
                }}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span>Application idea</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedApplication ? '-rotate-180' : ''
                  }`}
                />
              </button>
              {expandedApplication && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 text-sm leading-relaxed text-gray-700"
                >
                  {question.application}
                </motion.p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
