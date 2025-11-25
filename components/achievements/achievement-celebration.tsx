"use client";

import { useEffect, useRef } from "react";
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
  // Track which notifications we've shown toasts for
  const toastedRef = useRef<Set<string>>(new Set());

  // Show toasts for minor achievements (fire-and-forget, no state)
  useEffect(() => {
    notifications.forEach((notification) => {
      if (
        !notification.achievement.isMajor &&
        !toastedRef.current.has(notification.notificationId)
      ) {
        toastedRef.current.add(notification.notificationId);
        toast.success(notification.achievement.name, {
          description: notification.achievement.description,
          duration: 4000,
        });
        // Immediately dismiss minor achievements
        onDismiss(notification.notificationId);
      }
    });
  }, [notifications, onDismiss]);

  // Find first major achievement to show
  const currentMajor = notifications.find((n) => n.achievement.isMajor);

  const handleDismiss = () => {
    if (currentMajor) {
      onDismiss(currentMajor.notificationId);
    }
  };

  if (!currentMajor) return null;

  const majorCount = notifications.filter((n) => n.achievement.isMajor).length;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="mb-4 animate-in zoom-in-50 duration-500">
            <AchievementBadge
              icon={currentMajor.achievement.icon}
              name={currentMajor.achievement.name}
              description={currentMajor.achievement.description}
              unlocked={true}
              size="lg"
            />
          </div>
          <DialogTitle className="text-xl">
            {currentMajor.achievement.name}
          </DialogTitle>
          <DialogDescription className="text-base">
            {currentMajor.achievement.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={handleDismiss} size="lg">
            Awesome!
          </Button>
        </div>

        {majorCount > 1 && (
          <p className="text-xs text-muted-foreground mt-2">
            1 of {majorCount} achievements
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
