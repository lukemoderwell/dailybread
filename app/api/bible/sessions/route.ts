import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

interface SessionNavigationRequest {
  sessionId?: number; // If provided, get specific session; if not, get current reading
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId }: SessionNavigationRequest = await req.json();

    // If no sessionId, return current reading (today's reading)
    if (!sessionId) {
      // Get reading progress for current reading
      const { data: progress } = await supabase
        .from("reading_progress")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!progress) {
        return NextResponse.json(
          { error: "No reading progress found" },
          { status: 404 }
        );
      }

      // Check if there are any previous sessions (most recent)
      const { data: sessions, error: sessionsError } = await supabase
        .from("reading_sessions")
        .select("id")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(1);

      if (sessionsError) {
        console.error("Error fetching sessions:", sessionsError);
      }

      const hasPrevious = sessions && sessions.length > 0;
      const previousId = hasPrevious ? sessions[0].id : null;

      return NextResponse.json({
        isCurrent: true,
        book: progress.current_book,
        chapter: progress.current_chapter,
        verse: progress.current_verse || 1,
        navigation: {
          hasPrevious,
          hasNext: false, // Current reading never has next
          previousId,
          nextId: null,
        },
      });
    }

    // Get specific session by ID
    const { data: session, error: sessionError } = await supabase
      .from("reading_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Get navigation metadata using chronological order (completed_at)
    // Previous = session completed before this one
    const { data: previousSessions } = await supabase
      .from("reading_sessions")
      .select("id")
      .eq("user_id", user.id)
      .lt("completed_at", session.completed_at)
      .order("completed_at", { ascending: false })
      .limit(1);

    // Next = session completed after this one
    const { data: nextSessions } = await supabase
      .from("reading_sessions")
      .select("id")
      .eq("user_id", user.id)
      .gt("completed_at", session.completed_at)
      .order("completed_at", { ascending: true })
      .limit(1);

    const hasPrevious = previousSessions && previousSessions.length > 0;
    const hasNext = nextSessions && nextSessions.length > 0;
    const previousId = hasPrevious ? previousSessions[0].id : null;
    const nextId = hasNext ? nextSessions[0].id : null;

    // For historical sessions, also check if user can navigate to "current" (today's reading)
    // This is true if this is not the latest session
    const { data: latestSession } = await supabase
      .from("reading_sessions")
      .select("id")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(1);

    const isLatestSession = latestSession && latestSession[0].id === sessionId;

    return NextResponse.json({
      isCurrent: false,
      isLatestSession,
      session: {
        id: session.id,
        book: session.book,
        chapter: session.chapter,
        verses_read: session.verses_read,
        date: session.date,
        content: session.content,
        summary: session.summary || null, // Return cached summary if exists
      },
      navigation: {
        hasPrevious,
        hasNext: hasNext || isLatestSession, // Can navigate to next session OR to current if viewing latest
        previousId,
        nextId: hasNext ? nextId : null, // null means "navigate to current"
      },
    });
  } catch (error) {
    console.error("Session navigation error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
