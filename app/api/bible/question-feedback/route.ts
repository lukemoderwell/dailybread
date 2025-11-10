import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

interface FeedbackRequest {
  sessionId: string;
  familyMemberId: string;
  familyMemberName: string;
  familyMemberAge: number;
  questionText: string;
  rating: 1 | -1; // 1 = thumbs up, -1 = thumbs down
  bibleReference: string;
  feedbackText?: string; // Optional user explanation
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      sessionId,
      familyMemberId,
      familyMemberName,
      familyMemberAge,
      questionText,
      rating,
      bibleReference,
      feedbackText,
    }: FeedbackRequest = await req.json();

    // Validate rating
    if (rating !== 1 && rating !== -1) {
      return NextResponse.json(
        { error: "Rating must be 1 or -1" },
        { status: 400 }
      );
    }

    // Check if feedback already exists for this question
    const { data: existingFeedback } = await supabase
      .from("question_feedback")
      .select("id, rating")
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .eq("family_member_id", familyMemberId)
      .single();

    if (existingFeedback) {
      // If same rating, remove feedback (toggle off)
      if (existingFeedback.rating === rating) {
        const { error } = await supabase
          .from("question_feedback")
          .delete()
          .eq("id", existingFeedback.id);

        if (error) throw error;

        return NextResponse.json({ removed: true });
      }

      // Otherwise update to new rating
      const { error } = await supabase
        .from("question_feedback")
        .update({ rating })
        .eq("id", existingFeedback.id);

      if (error) throw error;

      return NextResponse.json({ updated: true, rating });
    }

    // Insert new feedback
    const { error } = await supabase.from("question_feedback").insert({
      user_id: user.id,
      session_id: sessionId,
      family_member_id: familyMemberId,
      family_member_name: familyMemberName,
      family_member_age: familyMemberAge,
      question_text: questionText,
      rating,
      bible_reference: bibleReference,
      feedback_text: feedbackText || null,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, rating });
  } catch (error) {
    console.error("Question feedback error:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}

// Get feedback for a session (optional - for displaying existing feedback)
export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId required" },
        { status: 400 }
      );
    }

    const { data: feedback, error } = await supabase
      .from("question_feedback")
      .select("*")
      .eq("user_id", user.id)
      .eq("session_id", sessionId);

    if (error) throw error;

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Get feedback error:", error);
    return NextResponse.json(
      { error: "Failed to get feedback" },
      { status: 500 }
    );
  }
}
