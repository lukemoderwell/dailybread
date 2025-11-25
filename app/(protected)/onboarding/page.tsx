import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingForm from '@/components/onboarding/onboarding-form';
import { BookOpen } from 'lucide-react';

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user already has family members
  const { data: familyMembers } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', user.id);

  // Check if user has reading progress
  const { data: progress } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // If they have both, redirect to dashboard
  if (familyMembers && familyMembers.length > 0 && progress) {
    redirect('/today');
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Elements from Auth Layout */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[length:14px_24px] pointer-events-none" />
      <div className="absolute right-[10%] top-[10%] -z-10 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]" />
      
      <div className="container max-w-lg mx-auto min-h-screen py-8 px-4 flex flex-col relative z-0">
        {/* Header */}
        <header className="flex items-center justify-center mb-8 relative z-10">
          <div className="flex items-center gap-2 font-medium">
            <BookOpen className="h-5 w-5" />
            <span>dailybread</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-center pb-12 relative z-10">
          <OnboardingForm userId={user.id} />
        </main>
      </div>
    </div>
  );
}
