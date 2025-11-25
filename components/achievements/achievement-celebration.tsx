"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AchievementBadge } from "./achievement-badge";
import { toast } from "sonner";

interface AchievementNotification {
  notificationId: string;
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
    isMajor: boolean;
  };
}

interface AchievementCelebrationProps {
  notifications: AchievementNotification[];
  onDismiss: (notificationId: string) => void;
}

export function AchievementCelebration({
  notifications,
  onDismiss,
}: AchievementCelebrationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Process notifications - show modal for major, toast for minor
  useEffect(() => {
    if (notifications.length === 0) return;

    const current = notifications[currentIndex];
    if (!current) return;

    if (current.achievement.isMajor) {
      // Show modal for major achievements
      setIsOpen(true);
    } else {
      // Show toast for minor achievements
      toast.success(current.achievement.name, {
        description: current.achievement.description,
        duration: 4000,
      });
      // Mark as seen and move to next
      onDismiss(current.notificationId);
      if (currentIndex < notifications.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
    }
  }, [notifications, currentIndex, onDismiss]);

  const handleDismiss = () => {
    const current = notifications[currentIndex];
    if (current) {
      onDismiss(current.notificationId);
    }
    setIsOpen(false);

    // Move to next notification after a brief delay
    if (currentIndex < notifications.length - 1) {
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
      }, 300);
    }
  };

  const current = notifications[currentIndex];
  if (!current || !current.achievement.isMajor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="mb-4 animate-in zoom-in-50 duration-500">
            <AchievementBadge
              icon={current.achievement.icon}
              name={current.achievement.name}
              description={current.achievement.description}
              unlocked={true}
              size="lg"
            />
          </div>
          <DialogTitle className="text-xl">
            {current.achievement.name}
          </DialogTitle>
          <DialogDescription className="text-base">
            {current.achievement.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={handleDismiss} size="lg">
            Awesome!
          </Button>
        </div>

        {notifications.length > 1 && (
          <p className="text-xs text-muted-foreground mt-2">
            {currentIndex + 1} of {notifications.length} achievements
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
