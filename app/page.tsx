import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('User', user);

  // If user is logged in, redirect to today's reading
  if (user) {
    redirect('/today');
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="container mx-auto flex flex-col items-center gap-8 px-4 py-24 text-center md:py-32">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Family Bible Study Made{' '}
            <span className="text-accent">Simple & Joyful</span>
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            Daily Bible readings with age-appropriate questions for each child.
            Audio-first experience so you can focus on your family, not your
            phone.
          </p>
        </div>

        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/login">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="mt-4 text-muted-foreground">
              Simple, audio-first Bible study for your family
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <div className="text-5xl mb-4">📖</div>
              <h3 className="text-xl font-semibold">Daily Reading</h3>
              <p className="text-sm text-muted-foreground">
                Short Bible passages read aloud, perfect for 5-10 minute family
                devotions
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold">
                Age-Appropriate Questions
              </h3>
              <p className="text-sm text-muted-foreground">
                Engaging questions tailored to each child&apos;s age and
                understanding
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="text-5xl mb-4">🔊</div>
              <h3 className="text-xl font-semibold">Audio-First</h3>
              <p className="text-sm text-muted-foreground">
                Everything read aloud so you can focus on your family, not your
                screen
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-2xl space-y-8">
          <h2 className="text-3xl font-bold">
            Start Your Family&apos;s Journey
          </h2>
          <p className="text-lg text-muted-foreground">
            Build consistent Bible reading habits your kids will look forward
            to.
          </p>
          <Button asChild size="lg">
            <Link href="/login">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
