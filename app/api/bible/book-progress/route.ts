import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BIBLE_BOOKS, getTotalChapters } from "@/lib/bible-metadata";

export const runtime = "edge";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all reading sessions for this user
    const { data: sessions, error } = await supabase
      .from("reading_sessions")
      .select("book, chapter, verses_read, content")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: true });

    if (error) throw error;

    // Calculate completion percentage for each book
    const bookProgress: Record<string, number> = {};

    // Initialize all books to 0%
    BIBLE_BOOKS.forEach((book) => {
      bookProgress[book] = 0;
    });

    if (sessions && sessions.length > 0) {
      // Track which chapters have been read for each book
      const chaptersRead: Record<string, Set<number>> = {};

      sessions.forEach((session) => {
        const book = session.book;
        if (!chaptersRead[book]) {
          chaptersRead[book] = new Set();
        }

        // Add the chapter that was read
        chaptersRead[book].add(session.chapter);

        // If the session has ending chapter info, mark all chapters in between as read
        if (session.content?.ending_chapter) {
          const startChapter = session.chapter;
          const endChapter = session.content.ending_chapter;

          for (let ch = startChapter; ch <= endChapter; ch++) {
            chaptersRead[book].add(ch);
          }
        }
      });

      // Calculate percentage for each book that has been started
      Object.entries(chaptersRead).forEach(([book, chapters]) => {
        const totalChapters = getTotalChapters(book);
        if (totalChapters) {
          const chaptersReadCount = chapters.size;
          const percentage = Math.round(
            (chaptersReadCount / totalChapters) * 100
          );
          bookProgress[book] = Math.min(percentage, 100); // Cap at 100%
        }
      });
    }

    return NextResponse.json({ bookProgress });
  } catch (error) {
    console.error("Book progress error:", error);
    return NextResponse.json(
      { error: "Failed to fetch book progress" },
      { status: 500 }
    );
  }
}
