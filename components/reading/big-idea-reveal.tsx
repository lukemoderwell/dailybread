'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BigIdeaRevealProps {
  // New format
  summary?: string;
  keyPoints?: string[];
  // Legacy format
  bigIdea?: string;
  // Common fields
  aboutGod?: string;
  aboutPeople?: string;
  onContinue: () => void;
}

export default function BigIdeaReveal({
  summary,
  keyPoints,
  bigIdea,
  aboutGod,
  aboutPeople,
  onContinue,
}: BigIdeaRevealProps) {
  const [showKeyPoints, setShowKeyPoints] = useState(false);

  // Use summary if available, otherwise fall back to bigIdea
  const displaySummary = summary || bigIdea || '';
  const hasKeyPoints = keyPoints && keyPoints.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <BookOpen className="h-8 w-8 text-primary" strokeWidth={2} />
        </div>
        <h2 className="text-sm font-bold text-primary uppercase tracking-widest">
          {summary ? 'Passage Summary' : 'The Big Idea'}
        </h2>
      </motion.div>

      {/* Summary/Big Idea */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <Card className="p-6 bg-muted/30 border-none shadow-sm">
          <p className="text-lg leading-relaxed text-foreground">
            {displaySummary}
          </p>
        </Card>
      </motion.div>

      {/* Key Points (expandable) */}
      {hasKeyPoints && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <button
            onClick={() => setShowKeyPoints(!showKeyPoints)}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3 mx-auto"
          >
            <Sparkles className="h-4 w-4" />
            <span>Key Takeaways</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showKeyPoints ? '-rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {showKeyPoints && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="p-4 bg-background border shadow-sm">
                  <ul className="space-y-3">
                    {keyPoints.map((point, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-sm leading-relaxed text-foreground/90">
                          {point}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* About God / About People Cards */}
      {(aboutGod || aboutPeople) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-10"
        >
          <Card className="border-none bg-muted/30 shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
              {aboutGod && (
                <div className="p-5 text-center md:text-left">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    About God
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {aboutGod}
                  </p>
                </div>
              )}
              {aboutPeople && (
                <div className="p-5 text-center md:text-left">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    About People
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {aboutPeople}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="text-center"
      >
        <Button
          size="lg"
          onClick={onContinue}
          className="min-w-[200px] h-12 rounded-full shadow-md hover:shadow-lg transition-all"
        >
          Continue to Questions
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
}
