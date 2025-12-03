'use client';

import { motion } from 'framer-motion';
import { BookOpen, Rewind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getColorById } from '@/lib/colors';

interface FamilyMember {
  id: string;
  name: string;
  color: string;
}

interface GatheringPhaseProps {
  familyMembers: FamilyMember[];
  reference: string;
  previousReference?: string;
  previousSummary?: string;
  onReady: () => void;
}

export default function GatheringPhase({
  familyMembers,
  reference,
  previousReference,
  previousSummary,
  onReady,
}: GatheringPhaseProps) {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 text-center">
      {/* Family circle gathering */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <div className="flex justify-center items-center gap-3 flex-wrap mb-6">
          {familyMembers.map((member, index) => {
            const memberColor = getColorById(member.color);
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  delay: 0.1 + index * 0.15,
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shadow-lg"
                  style={{
                    backgroundColor: memberColor.value,
                    color: memberColor.textColor,
                  }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.15 }}
                  className="text-xs mt-2 text-muted-foreground"
                >
                  {member.name}
                </motion.p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Today's reference reveal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 + familyMembers.length * 0.1 }}
        className="mb-8"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Today&apos;s Reading
        </h2>
        <p className="text-2xl font-bold text-foreground">{reference}</p>
      </motion.div>

      {/* Previously on... */}
      {previousSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 + familyMembers.length * 0.1 }}
          className="bg-muted/50 rounded-xl p-6 mb-8 text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <Rewind className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
              Previously{previousReference ? ` in ${previousReference}` : '...'}
            </h3>
          </div>
          <p className="text-base leading-relaxed text-foreground/80">
            {previousSummary}
          </p>
        </motion.div>
      )}

      {/* Ready button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 + familyMembers.length * 0.1 }}
      >
        <Button size="lg" onClick={onReady} className="min-w-[200px]">
          Get Started
        </Button>
      </motion.div>
    </div>
  );
}
