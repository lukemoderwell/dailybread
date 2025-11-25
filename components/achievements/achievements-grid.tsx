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
  sortOrder: number;
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
  // Group by category
  const byCategory = achievements.reduce(
    (acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    },
    {} as Record<AchievementCategory, Achievement[]>
  );

  // Sort each category by sortOrder
  Object.values(byCategory).forEach((categoryAchievements) => {
    categoryAchievements.sort((a, b) => a.sortOrder - b.sortOrder);
  });

  const categories: AchievementCategory[] = ["streak", "book", "journey", "special"];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  if (!showCategories) {
    // Simple flat grid
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {unlockedCount} / {achievements.length} unlocked
          </span>
        </div>
        <div className="flex flex-wrap gap-4">
          {achievements
            .sort((a, b) => {
              // Show unlocked first, then by category and sortOrder
              if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
              return a.sortOrder - b.sortOrder;
            })
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
        if (!categoryAchievements || categoryAchievements.length === 0) return null;

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
