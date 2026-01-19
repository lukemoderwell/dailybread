'use client';

import { motion } from 'framer-motion';
import { Sparkles, Link2, BookOpen, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type DiscoveryType = 'connection' | 'wonder' | 'challenge';

interface Discovery {
  type: DiscoveryType;
  content: string;
}

interface DiscoveryRevealProps {
  discovery: Discovery;
  onContinue: () => void;
}

const discoveryConfig = {
  connection: {
    icon: Link2,
    label: 'Hidden Connection',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  wonder: {
    icon: BookOpen,
    label: 'Wonder Fact',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  challenge: {
    icon: Target,
    label: 'Family Challenge',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
};

export default function DiscoveryReveal({
  discovery,
  onContinue,
}: DiscoveryRevealProps) {
  const config = discoveryConfig[discovery.type];
  const Icon = config.icon;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Sparkle animation header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-4 text-primary/50" />
            <Sparkles className="absolute bottom-0 left-1/2 -translate-x-1/2 h-4 w-4 text-primary/50" />
            <Sparkles className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
            <Sparkles className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
          </motion.div>
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-bold text-foreground"
        >
          Today&apos;s Discovery
        </motion.h2>
      </motion.div>

      {/* Discovery type badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center mb-6"
      >
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bgColor}`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
          <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
        </div>
      </motion.div>

      {/* Discovery content */}
      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="bg-muted/50 rounded-xl p-6 mb-8"
      >
        <p className="text-lg leading-relaxed text-center">
          {discovery.content}
        </p>
      </motion.div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center"
      >
        <Button size="lg" onClick={onContinue} className="min-w-[200px]">
          Continue
        </Button>
      </motion.div>
    </div>
  );
}
