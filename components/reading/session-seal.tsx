'use client';

import { motion } from 'framer-motion';
import { Check, Flame, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getColorById } from '@/lib/colors';

interface FamilyMember {
  id: string;
  name: string;
  color: string;
}

interface SessionSealProps {
  familyMembers: FamilyMember[];
  currentStreak: number;
  versesRead: number;
  tomorrowPreview?: string;
  onComplete: () => void;
  onSkipPreview?: () => void;
  isCompleting: boolean;
}

export default function SessionSeal({
  familyMembers,
  currentStreak,
  versesRead,
  tomorrowPreview,
  onComplete,
  onSkipPreview,
  isCompleting,
}: SessionSealProps) {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Family circle celebration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center mb-8"
      >
        {/* Family avatars in a circle */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          {/* Central check */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-8 w-8 text-primary-foreground" />
            </div>
          </motion.div>

          {/* Family member avatars around the circle */}
          {familyMembers.slice(0, 6).map((member, index) => {
            const angle = (index * 360) / Math.min(familyMembers.length, 6) - 90;
            const x = Math.cos((angle * Math.PI) / 180) * 48;
            const y = Math.sin((angle * Math.PI) / 180) * 48;
            const memberColor = getColorById(member.color);

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, x, y }}
                transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-background"
                  style={{
                    backgroundColor: memberColor.value,
                    color: memberColor.textColor,
                  }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-2xl font-bold mb-2"
        >
          We Read Together!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-muted-foreground"
        >
          Another great day of reading as a family
        </motion.p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="grid grid-cols-2 gap-4 mb-8"
      >
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-orange-500 mb-1">
            <Flame className="h-5 w-5" />
            <span className="text-2xl font-bold">{currentStreak}</span>
          </div>
          <p className="text-sm text-muted-foreground">Day Streak</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-primary mb-1">
            <BookOpen className="h-5 w-5" />
            <span className="text-2xl font-bold">+{versesRead}</span>
          </div>
          <p className="text-sm text-muted-foreground">Verses Today</p>
        </div>
      </motion.div>

      {/* Tomorrow's preview */}
      {tomorrowPreview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 mb-8"
        >
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">
            Coming Tomorrow...
          </h3>
          <p className="text-base leading-relaxed text-foreground/80 italic">
            &ldquo;{tomorrowPreview}&rdquo;
          </p>
          {onSkipPreview && (
            <button
              onClick={onSkipPreview}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span>I&apos;ll see tomorrow</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </motion.div>
      )}

      {/* Complete button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <Button
          size="lg"
          onClick={onComplete}
          disabled={isCompleting}
          className="w-full h-14"
        >
          {isCompleting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-5 w-5 mr-2" />
              Complete Today&apos;s Reading
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
