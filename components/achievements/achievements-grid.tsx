"use client";

import { AchievementBadge } from "./achievement-badge";
import {
  AchievementCategory,
  CATEGORY_LABELS,
} from "@/lib/achievements/achievement-definitions";

interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: string;
  isMajor: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
}

interface AchievementsGridProps {
  achievements: Achievement[];
  showCategories?: boolean;
}

export function AchievementsGrid({
  achievements,
  showCategories = true,
}: AchievementsGridProps) {
  const categories: AchievementCategory[] = ["streak", "book", "journey", "special"];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Group by category (order preserved from ACHIEVEMENTS array)
  const byCategory = achievements.reduce(
    (acc, achievement) => {
      if (!acc[achievement.category]) acc[achievement.category] = [];
      acc[achievement.category].push(achievement);
      return acc;
    },
    {} as Record<AchievementCategory, Achievement[]>
  );

  if (!showCategories) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {unlockedCount} / {achievements.length} unlocked
          </span>
        </div>
        <div className="flex flex-wrap gap-4">
          {achievements
            .sort((a, b) => (a.unlocked === b.unlocked ? 0 : a.unlocked ? -1 : 1))
            .map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                icon={achievement.icon}
                name={achievement.name}
                description={achievement.description}
                unlocked={achievement.unlocked}
                size="md"
                showLabel
              />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {unlockedCount} / {achievements.length} unlocked
        </span>
      </div>

      {categories.map((category) => {
        const categoryAchievements = byCategory[category];
        if (!categoryAchievements?.length) return null;

        const categoryUnlocked = categoryAchievements.filter((a) => a.unlocked).length;

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{CATEGORY_LABELS[category]}</h3>
              <span className="text-xs text-muted-foreground">
                {categoryUnlocked} / {categoryAchievements.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              {categoryAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  icon={achievement.icon}
                  name={achievement.name}
                  description={achievement.description}
                  unlocked={achievement.unlocked}
                  size="md"
                  showLabel
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
