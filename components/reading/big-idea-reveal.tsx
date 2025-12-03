'use client';

import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BigIdeaRevealProps {
  bigIdea: string;
  aboutGod?: string;
  aboutPeople?: string;
  onContinue: () => void;
}

export default function BigIdeaReveal({
  bigIdea,
  aboutGod,
  aboutPeople,
  onContinue,
}: BigIdeaRevealProps) {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Lightbulb className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          The Big Idea
        </h2>
      </motion.div>

      {/* Big Idea - Main reveal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        className="text-center mb-8"
      >
        <p className="text-2xl md:text-3xl font-bold leading-tight text-foreground">
          {bigIdea}
        </p>
      </motion.div>

      {/* About God & About People */}
      {(aboutGod || aboutPeople) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4 mb-8"
        >
          {aboutGod && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-semibold text-primary mb-1">About God</p>
              <p className="text-base leading-relaxed">{aboutGod}</p>
            </div>
          )}
          {aboutPeople && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-semibold text-primary mb-1">About People</p>
              <p className="text-base leading-relaxed">{aboutPeople}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Echo prompt */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="text-center"
      >
        <p className="text-sm text-muted-foreground mb-4">
          Say it together as a family!
        </p>
        <Button size="lg" onClick={onContinue} className="min-w-[200px]">
          We Got It!
        </Button>
      </motion.div>
    </div>
  );
}
