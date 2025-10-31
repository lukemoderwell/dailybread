import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { bible_translation, tts_voice, daily_reading_minutes } = await req.json();

    const { error } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        bible_translation,
        tts_voice,
        daily_reading_minutes,
      });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Preferences save error:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
