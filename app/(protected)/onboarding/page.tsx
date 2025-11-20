import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingForm from '@/components/onboarding/onboarding-form';

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
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <OnboardingForm userId={user.id} />
    </div>
  );
}
