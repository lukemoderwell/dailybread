import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BibleHeatmap from "@/components/bible-heatmap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, BookOpen, Flame, Trophy } from "lucide-react";

async function getBookProgress(userId: string) {
  const supabase = await createSupabaseServerClient();

  // Fetch from the API endpoint logic directly
  const { data: sessions } = await supabase
    .from("reading_sessions")
    .select("book, chapter, verses_read, content")
    .eq("user_id", userId)
    .order("completed_at", { ascending: true });

  return sessions || [];
}

export default async function ProgressPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get reading progress
  const { data: progress } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!progress) {
    redirect("/onboarding");
  }

  // Get book completion data
  const sessions = await getBookProgress(user.id);

  // Calculate book progress
  const { BIBLE_BOOKS, getTotalChapters } = await import("@/lib/bible-metadata");
  const bookProgress: Record<string, number> = {};

  // Initialize all books to 0%
  BIBLE_BOOKS.forEach((book) => {
    bookProgress[book] = 0;
  });

  if (sessions.length > 0) {
    const chaptersRead: Record<string, Set<number>> = {};

    sessions.forEach((session) => {
      const book = session.book;
      if (!chaptersRead[book]) {
        chaptersRead[book] = new Set();
      }

      chaptersRead[book].add(session.chapter);

      if (session.content?.ending_chapter) {
        const startChapter = session.chapter;
        const endChapter = session.content.ending_chapter;

        for (let ch = startChapter; ch <= endChapter; ch++) {
          chaptersRead[book].add(ch);
        }
      }
    });

    Object.entries(chaptersRead).forEach(([book, chapters]) => {
      const totalChapters = getTotalChapters(book);
      if (totalChapters) {
        const percentage = Math.round((chapters.size / totalChapters) * 100);
        bookProgress[book] = Math.min(percentage, 100);
      }
    });
  }

  const completedBooks = Object.values(bookProgress).filter(p => p === 100).length;
  const totalSessions = sessions.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/today">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Your Progress</h1>
              <p className="text-muted-foreground">Track your journey through the Bible</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress.current_streak} days</div>
              <p className="text-xs text-muted-foreground">
                Longest: {progress.longest_streak} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Books Completed</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedBooks} / 66</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((completedBooks / 66) * 100)}% of the Bible
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reading Sessions</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                Total readings completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Bible Completion Map</CardTitle>
            <CardDescription>
              Your progress through all 66 books of the Bible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BibleHeatmap
              completedBooks={bookProgress}
              currentBook={progress.current_book}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
