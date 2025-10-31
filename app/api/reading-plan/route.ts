import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { action, new_book, book } = await req.json();

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "change_book") {
      if (!new_book) {
        return NextResponse.json(
          { error: "New book is required" },
          { status: 400 }
        );
      }

      // Update reading progress to new book, starting at chapter 1
      const { error } = await supabase
        .from("reading_progress")
        .update({
          current_book: new_book,
          current_chapter: 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Switched to ${new_book}`,
      });
    } else if (action === "restart_book") {
      if (!book) {
        return NextResponse.json(
          { error: "Book is required" },
          { status: 400 }
        );
      }

      // Reset current book to chapter 1
      const { error } = await supabase
        .from("reading_progress")
        .update({
          current_chapter: 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Restarted ${book}`,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Reading plan error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
