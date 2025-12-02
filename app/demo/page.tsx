import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpenText, Sparkles, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const passageVerses = [
  {
    verse: 1,
    text: 'Now there was a man of the Pharisees named Nicodemus, a ruler of the Jews.',
  },
  {
    verse: 2,
    text: 'This man came to Jesus by night and said to him, "Rabbi, we know that you are a teacher come from God, for no one can do these signs that you do unless God is with him."',
  },
  {
    verse: 3,
    text: 'Jesus answered him, "Truly, truly, I say to you, unless one is born again he cannot see the kingdom of God."',
  },
  {
    verse: 4,
    text: 'Nicodemus said to him, "How can a man be born when he is old? Can he enter a second time into his mother\'s womb and be born?"',
  },
  {
    verse: 5,
    text: 'Jesus answered, "Truly, truly, I say to you, unless one is born of water and the Spirit, he cannot enter the kingdom of God."',
  },
  {
    verse: 16,
    text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
  },
  {
    verse: 17,
    text: 'For God did not send his Son into the world to condemn the world, but in order that the world might be saved through him.',
  },
  {
    verse: 21,
    text: 'But whoever does what is true comes to the light, so that it may be clearly seen that his works have been carried out in God.',
  },
];

const discussionGuide = {
  bigIdea: 'Jesus invites us into a brand-new life with God—one that the Holy Spirit begins inside us and transforms us day by day.',
  aboutGod: 'God\'s love is proactive and sacrificial. He sent Jesus not to condemn us, but to rescue us and bring us into His family.',
  aboutPeople: 'We cannot fix ourselves or earn a place with God. We need to be born again through faith in Jesus and the work of the Spirit.',
  starterQuestion: 'Where have you seen God\'s love change someone\'s life? What does it look like when someone starts living in the light?',
};

const kidQuestions = [
  {
    age: 'Ages 4-7',
    prompt: 'Jesus says God loves the whole world. What are some ways God shows love to you every day?',
    action: 'Pray a short thank-you prayer together for three things you noticed today.',
  },
  {
    age: 'Ages 8-11',
    prompt: 'Being “born again” means starting fresh with Jesus. What might change in your words or actions if you lived as His child?',
    action: 'Pick one habit to practice this week that shows you belong to Jesus—like telling the truth or encouraging a friend.',
  },
  {
    age: 'Ages 12-15',
    prompt: 'Nicodemus was curious but cautious. What questions do you still have about following Jesus? What helps you trust Him?',
    action: 'Share one question with the family and look for an answer together in Scripture or by asking a leader you trust.',
  },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-medium">
            <BookOpenText className="h-5 w-5 text-primary" />
            <span>dailybread demo</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to home
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Start for free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-10">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <Badge variant="secondary" className="rounded-full px-3 py-1 w-fit">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Unauthenticated preview
              </div>
            </Badge>
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Try the Daily Bread experience
              </p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                See today&apos;s reading and discussion guide side by side.
              </h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Explore how families read Scripture together in Daily Bread. On desktop you can keep the passage and questions open at the same time so everyone can follow along—no account required.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start your own plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/login">Already have an account?</Link>
              </Button>
            </div>
          </div>
          <Card className="border-dashed bg-muted/40 lg:max-w-sm">
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Designed for families</p>
                  <p className="text-sm text-muted-foreground">Age-based prompts, streaks, and quick prep.</p>
                </div>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                This demo shows a sample passage (John 3) with the same split-screen layout families use every day.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm text-primary font-semibold">
                <Sparkles className="h-4 w-4" />
                Demo reading
              </div>
              <CardTitle className="text-2xl">John 3:1-21 (ESV)</CardTitle>
              <p className="text-sm text-muted-foreground">Nicodemus visits Jesus at night</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-card/60 p-4 shadow-inner">
                <div className="space-y-3 text-base leading-relaxed">
                  {passageVerses.map(({ verse, text }) => (
                    <p key={verse}>
                      <span className="mr-2 text-sm font-semibold text-primary">{verse}</span>
                      {text}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="rounded-full">5-7 minutes</Badge>
                <Badge variant="outline" className="rounded-full">Works offline on mobile</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="h-fit border-primary/20 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Discussion guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-base leading-relaxed">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Big idea</p>
                  <p>{discussionGuide.bigIdea}</p>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">About God</p>
                    <p>{discussionGuide.aboutGod}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">About people</p>
                    <p>{discussionGuide.aboutPeople}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Conversation starter</p>
                  <p>{discussionGuide.starterQuestion}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="h-fit border-dashed">
              <CardHeader>
                <CardTitle className="text-xl">Questions for kids</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Tailored prompts for every age so the whole family can participate.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {kidQuestions.map((question) => (
                  <div key={question.age} className="rounded-lg border bg-muted/40 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-primary">{question.age}</p>
                      <Badge variant="outline" className="rounded-full text-xs">Great for dinner time</Badge>
                    </div>
                    <p className="font-medium leading-relaxed">{question.prompt}</p>
                    <p className="text-sm text-muted-foreground">Try this: {question.action}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
