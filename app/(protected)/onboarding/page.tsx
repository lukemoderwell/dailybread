import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingForm from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user already has family members
  const { data: familyMembers } = await supabase
    .from("family_members")
    .select("*")
    .eq("user_id", user.id);

  // Check if user has reading progress
  const { data: progress } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // If they have both, redirect to dashboard
  if (familyMembers && familyMembers.length > 0 && progress) {
    redirect("/today");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Daily Bread</h1>
          <p className="text-muted-foreground">
            Let's set up your family Bible study
          </p>
        </div>
        <OnboardingForm userId={user.id} />
      </div>
    </div>
  );
}
