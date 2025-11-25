import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  BookOpen,
  Headphones,
  MessageCircle,
  Heart,
  ArrowRight,
  ShieldCheck,
  Clock,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to today's reading
  if (user) {
    redirect('/today');
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-medium">
            <BookOpen className="h-5 w-5" />
            <span>dailybread</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Sign In
            </Link>
            <Button asChild size="sm">
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[length:14px_24px]" />
          <div className="absolute left-[50%] top-[20%] -z-10 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/5 blur-[100px]" />

          <div className="container mx-auto px-4">
            <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
              <Badge
                variant="secondary"
                className="mb-4 rounded-full px-4 py-1.5 text-sm font-normal"
              >
                <span className="mr-1.5 text-primary">✨</span>
                New: Family Reading Streaks
              </Badge>
              <h1 className="font-(family-name:--font-crimson) text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl">
                Lead your family in <br className="hidden sm:inline" />
                <span className="text-primary italic">
                  God&apos;s Word
                </span>{' '}
                every day.
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
                The simplest way to build a lasting family devotion habit.{' '}
                <br className="hidden sm:inline" />
                Scripture readings, questions for every age, and zero prep
                required.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-6">
                <Button asChild size="lg" className="h-12 px-8 text-base">
                  <Link href="/signup">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Theologically Sound</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>10 Minutes/Day</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="container mx-auto px-4 py-12 md:py-24 lg:py-32">
          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="border-none bg-muted/50 shadow-none transition-colors hover:bg-muted/80">
              <CardContent className="flex flex-col items-center p-8 text-center sm:p-10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Headphones className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Audio & Text Options</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Read aloud or listen together—whatever works for your family.
                  Flexible formats let you focus on what matters: the Word.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none bg-muted/50 shadow-none transition-colors hover:bg-muted/80">
              <CardContent className="flex flex-col items-center p-8 text-center sm:p-10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <MessageCircle className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-bold">
                  Age-Adapted Questions
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Engage everyone from toddlers to teens. We generate specific
                  questions tailored to different age groups to spark meaningful
                  conversation.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none bg-muted/50 shadow-none transition-colors hover:bg-muted/80">
              <CardContent className="flex flex-col items-center p-8 text-center sm:p-10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Habit Building</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track streaks, earn achievements, and see your family&apos;s
                  progress through the Bible. We help you make consistency the
                  default.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Social Proof / Dad Appeal */}
        <section className="border-t bg-zinc-900 text-zinc-50 py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-(family-name:--font-crimson) text-3xl md:text-4xl font-bold mb-8 italic">
              &ldquo;Fathers, do not provoke your children to anger, but bring
              them up in the discipline and instruction of the Lord.&rdquo;
            </h2>
            <p className="text-zinc-400 mb-12 font-medium">- Ephesians 6:4</p>

            <div className="mx-auto max-w-3xl">
              <p className="text-lg md:text-xl text-zinc-300 leading-relaxed">
                We know you want to lead your family well. But between work,
                school runs, and endless activities, consistency is hard.{' '}
                <span className="text-white font-semibold">Daily Bread</span>{' '}
                removes the friction so you can focus on the formation.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-2xl space-y-8 rounded-3xl bg-primary/5 p-8 lg:p-16">
            <div className="flex justify-center">
              <Users className="h-12 w-12 text-primary opacity-80" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to lead your family?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join other dads building a legacy of faith, one day at a time.
            </p>
            <div className="flex flex-col items-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="h-12 w-full max-w-sm px-8 text-base"
              >
                <Link href="/signup">Create Your Free Account</Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                No credit card required. Cancel anytime.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>
            &copy; {new Date().getFullYear()} dailybread. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
