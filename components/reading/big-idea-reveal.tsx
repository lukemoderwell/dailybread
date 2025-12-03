'use client';

import { motion } from 'framer-motion';
import { Lightbulb, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center min-h-[60vh]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-100 mb-6 shadow-sm rotate-3 transition-transform hover:rotate-0">
          <Lightbulb className="h-10 w-10 text-amber-600" strokeWidth={2.5} />
        </div>
        <h2 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-2">
          The Big Idea
        </h2>
      </motion.div>

      {/* Big Idea - Main reveal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', bounce: 0.4 }}
        className="text-center mb-12 max-w-xl"
      >
        <div className="relative">
          <span className="absolute -top-8 -left-4 text-6xl text-muted-foreground/10 font-serif leading-none select-none">
            &ldquo;
          </span>
          <p className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-foreground font-serif">
            {bigIdea}
          </p>
          <span className="absolute -bottom-8 -right-4 text-6xl text-muted-foreground/10 font-serif leading-none select-none">
            &rdquo;
          </span>
        </div>
      </motion.div>

      {/* Supporting Points Card */}
      {(aboutGod || aboutPeople) && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, type: 'spring', damping: 20 }}
          className="w-full max-w-lg mb-10"
        >
          <Card className="border-none bg-muted/30 shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
              {aboutGod && (
                <div className="p-6 text-center md:text-left">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    About God
                  </p>
                  <p className="text-sm md:text-base leading-relaxed text-foreground/90">
                    {aboutGod}
                  </p>
                </div>
              )}
              {aboutPeople && (
                <div className="p-6 text-center md:text-left">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    About People
                  </p>
                  <p className="text-sm md:text-base leading-relaxed text-foreground/90">
                    {aboutPeople}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Action Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="text-center w-full max-w-xs"
      >
        <p className="text-sm font-medium text-muted-foreground mb-4">
          Say it out loud together!
        </p>
        <Button
          size="lg"
          onClick={onContinue}
          className="w-full h-14 text-lg rounded-full shadow-md hover:shadow-lg transition-all"
        >
          We Said It!
          <ChevronRight className="ml-2 h-5 w-5 opacity-50" />
        </Button>
      </motion.div>
    </div>
  );
}
