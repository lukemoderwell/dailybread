import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReadingExperience from "@/components/reading/reading-experience";

export default async function TodayPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get family members
  const { data: familyMembers } = await supabase
    .from("family_members")
    .select("*")
    .eq("user_id", user.id)
    .order("age", { ascending: false });

  // Get reading progress
  const { data: progress } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get user preferences
  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // If no family members or progress, redirect to onboarding
  if (!familyMembers || familyMembers.length === 0 || !progress) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen">
      <ReadingExperience
        userId={user.id}
        familyMembers={familyMembers}
        currentBook={progress.current_book}
        currentChapter={progress.current_chapter}
        currentStreak={progress.current_streak}
        longestStreak={progress.longest_streak}
        bibleTranslation={preferences?.bible_translation || "de4e12af7f28f599-02"}
        ttsVoice={preferences?.tts_voice || "onyx"}
      />
    </div>
  );
}
