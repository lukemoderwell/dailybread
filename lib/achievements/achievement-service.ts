import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BIBLE_BOOKS, getTotalChapters } from "@/lib/bible-metadata";
import { ACHIEVEMENTS, UserMetrics, getAchievementById } from "./achievement-definitions";

// Calculate user metrics from reading data
export async function getMetrics(userId: string): Promise<UserMetrics> {
  const supabase = await createSupabaseServerClient();

  const [{ data: progress }, { data: sessions }] = await Promise.all([
    supabase.from("reading_progress").select("longest_streak").eq("user_id", userId).single(),
    supabase.from("reading_sessions").select("book, chapter, content").eq("user_id", userId),
  ]);

  // Track chapters read per book
  const chaptersRead: Record<string, Set<number>> = {};
  sessions?.forEach((s) => {
    if (!chaptersRead[s.book]) chaptersRead[s.book] = new Set();
    chaptersRead[s.book].add(s.chapter);
    // Handle multi-chapter sessions
    const end = s.content?.ending_chapter;
    if (end) for (let ch = s.chapter; ch <= end; ch++) chaptersRead[s.book].add(ch);
  });

  // Calculate completed books and bible percentage
  const completedBooks: string[] = [];
  let totalProgress = 0;
  BIBLE_BOOKS.forEach((book) => {
    const total = getTotalChapters(book) || 0;
    const read = chaptersRead[book]?.size || 0;
    const pct = total > 0 ? Math.min((read / total) * 100, 100) : 0;
    if (pct === 100) completedBooks.push(book);
    totalProgress += pct;
  });

  return {
    longestStreak: progress?.longest_streak || 0,
    totalSessions: sessions?.length || 0,
    completedBooks,
    biblePercent: Math.round(totalProgress / 66),
  };
}

// Check for new achievements and award them
export async function checkAchievements(userId: string) {
  const supabase = await createSupabaseServerClient();
  const metrics = await getMetrics(userId);

  const { data: existing } = await supabase
    .from("family_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const unlocked = new Set(existing?.map((a) => a.achievement_id) || []);
  const newlyEarned = ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && a.check(metrics));

  if (newlyEarned.length > 0) {
    await supabase.from("family_achievements").insert(
      newlyEarned.map((a) => ({ user_id: userId, achievement_id: a.id, seen: false }))
    );
  }

  return newlyEarned;
}

// Get all achievements with unlocked status
export async function getUserAchievements(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("family_achievements")
    .select("achievement_id, unlocked_at, seen")
    .eq("user_id", userId);

  const unlockedMap = new Map(data?.map((a) => [a.achievement_id, a]) || []);

  return ACHIEVEMENTS.map((a) => ({
    id: a.id,
    category: a.category,
    name: a.name,
    description: a.description,
    icon: a.icon,
    isMajor: a.isMajor,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id)?.unlocked_at || null,
  }));
}

// Get unseen achievements for celebration
export async function getUnseen(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("family_achievements")
    .select("achievement_id")
    .eq("user_id", userId)
    .eq("seen", false);

  return (data || []).map((row) => ({
    notificationId: row.achievement_id, // Use achievement_id for consistency with markSeen
    achievement: getAchievementById(row.achievement_id)!,
  }));
}

// Mark achievement as seen (accepts either row UUID or achievement_id)
export async function markSeen(userId: string, achievementId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("family_achievements")
    .update({ seen: true })
    .eq("user_id", userId)
    .eq("achievement_id", achievementId);
}

// Mark all as seen
export async function markAllSeen(userId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("family_achievements").update({ seen: true }).eq("user_id", userId).eq("seen", false);
}
