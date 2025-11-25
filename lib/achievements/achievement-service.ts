import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BIBLE_BOOKS, getTotalChapters } from "@/lib/bible-metadata";
import {
  ACHIEVEMENT_DEFINITIONS,
  AchievementDefinition,
  GOSPELS,
  OLD_TESTAMENT_COUNT,
  NEW_TESTAMENT_COUNT,
} from "./achievement-definitions";

export interface UserMetrics {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  completedBooks: string[];
  biblePercent: number;
}

export interface UnlockedAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  isMajor: boolean;
  unlockedAt: string;
}

// Calculate user metrics from their reading data
export async function calculateUserMetrics(userId: string): Promise<UserMetrics> {
  const supabase = await createSupabaseServerClient();

  // Get reading progress for streak data
  const { data: progress } = await supabase
    .from("reading_progress")
    .select("current_streak, longest_streak")
    .eq("user_id", userId)
    .single();

  // Get all sessions for book/chapter calculations
  const { data: sessions } = await supabase
    .from("reading_sessions")
    .select("book, chapter, content")
    .eq("user_id", userId);

  const totalSessions = sessions?.length || 0;

  // Calculate book completion
  const chaptersRead: Record<string, Set<number>> = {};

  sessions?.forEach((session) => {
    const book = session.book;
    if (!chaptersRead[book]) {
      chaptersRead[book] = new Set();
    }

    chaptersRead[book].add(session.chapter);

    // Handle multi-chapter sessions
    if (session.content?.ending_chapter) {
      const startChapter = session.chapter;
      const endChapter = session.content.ending_chapter;
      for (let ch = startChapter; ch <= endChapter; ch++) {
        chaptersRead[book].add(ch);
      }
    }
  });

  // Calculate completed books and bible percentage
  const bookProgress: Record<string, number> = {};
  const completedBooks: string[] = [];
  let totalProgress = 0;

  BIBLE_BOOKS.forEach((book) => {
    const totalChapters = getTotalChapters(book) || 0;
    const readChapters = chaptersRead[book]?.size || 0;
    const percentage = totalChapters > 0 ? Math.round((readChapters / totalChapters) * 100) : 0;
    bookProgress[book] = Math.min(percentage, 100);

    if (bookProgress[book] === 100) {
      completedBooks.push(book);
    }
    totalProgress += bookProgress[book];
  });

  const biblePercent = Math.round(totalProgress / 66);

  return {
    currentStreak: progress?.current_streak || 0,
    longestStreak: progress?.longest_streak || 0,
    totalSessions,
    completedBooks,
    biblePercent,
  };
}

// Check if a specific achievement is earned based on metrics
function isAchievementEarned(achievement: AchievementDefinition, metrics: UserMetrics): boolean {
  const { requirementType, requirementValue, id } = achievement;

  switch (requirementType) {
    case "streak":
      // Use longest streak to prevent losing achievements when streak resets
      return metrics.longestStreak >= (requirementValue || 0);

    case "session_count":
      return metrics.totalSessions >= (requirementValue || 0);

    case "bible_percent":
      return metrics.biblePercent >= (requirementValue || 0);

    case "book_count":
      // For NT/OT specific achievements
      if (id === "book_nt") {
        const ntBooks = BIBLE_BOOKS.slice(OLD_TESTAMENT_COUNT) as readonly string[];
        const completedNT = metrics.completedBooks.filter((b) => ntBooks.includes(b));
        return completedNT.length >= NEW_TESTAMENT_COUNT;
      }
      if (id === "book_ot") {
        const otBooks = BIBLE_BOOKS.slice(0, OLD_TESTAMENT_COUNT) as readonly string[];
        const completedOT = metrics.completedBooks.filter((b) => otBooks.includes(b));
        return completedOT.length >= OLD_TESTAMENT_COUNT;
      }
      return metrics.completedBooks.length >= (requirementValue || 0);

    case "custom":
      // Handle special cases
      if (id === "book_gospel") {
        return GOSPELS.some((gospel) => metrics.completedBooks.includes(gospel));
      }
      return false;

    default:
      return false;
  }
}

// Check for new achievements and award them
export async function checkAndAwardAchievements(userId: string): Promise<UnlockedAchievement[]> {
  const supabase = await createSupabaseServerClient();

  // Get current metrics
  const metrics = await calculateUserMetrics(userId);

  // Get already unlocked achievements
  const { data: existingAchievements } = await supabase
    .from("family_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const existingIds = new Set(existingAchievements?.map((a) => a.achievement_id) || []);

  // Check each achievement
  const newAchievements: UnlockedAchievement[] = [];

  for (const achievement of ACHIEVEMENT_DEFINITIONS) {
    // Skip if already unlocked
    if (existingIds.has(achievement.id)) continue;

    // Check if earned
    if (isAchievementEarned(achievement, metrics)) {
      // Award the achievement
      const { error: insertError } = await supabase.from("family_achievements").insert({
        user_id: userId,
        achievement_id: achievement.id,
      });

      if (!insertError) {
        // Create notification for celebration
        await supabase.from("achievement_notifications").insert({
          user_id: userId,
          achievement_id: achievement.id,
        });

        newAchievements.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          isMajor: achievement.isMajor,
          unlockedAt: new Date().toISOString(),
        });
      }
    }
  }

  return newAchievements;
}

// Get all achievements for a user (with unlocked status)
export async function getUserAchievements(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: unlockedAchievements } = await supabase
    .from("family_achievements")
    .select("achievement_id, unlocked_at")
    .eq("user_id", userId);

  const unlockedMap = new Map(
    unlockedAchievements?.map((a) => [a.achievement_id, a.unlocked_at]) || []
  );

  return ACHIEVEMENT_DEFINITIONS.map((achievement) => ({
    ...achievement,
    unlocked: unlockedMap.has(achievement.id),
    unlockedAt: unlockedMap.get(achievement.id) || null,
  }));
}

// Get unseen achievement notifications
export async function getUnseenNotifications(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: notifications } = await supabase
    .from("achievement_notifications")
    .select("id, achievement_id, created_at")
    .eq("user_id", userId)
    .eq("seen", false)
    .order("created_at", { ascending: true });

  if (!notifications || notifications.length === 0) {
    return [];
  }

  return notifications.map((n) => {
    const achievement = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === n.achievement_id);
    return {
      notificationId: n.id,
      achievement: achievement!,
      createdAt: n.created_at,
    };
  });
}

// Mark notification as seen
export async function markNotificationSeen(notificationId: string) {
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("achievement_notifications")
    .update({ seen: true })
    .eq("id", notificationId);
}

// Mark all notifications as seen for a user
export async function markAllNotificationsSeen(userId: string) {
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("achievement_notifications")
    .update({ seen: true })
    .eq("user_id", userId)
    .eq("seen", false);
}
