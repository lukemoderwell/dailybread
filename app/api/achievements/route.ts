import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  checkAchievements,
  getUserAchievements,
  getUnseen,
  markSeen,
  markAllSeen,
} from "@/lib/achievements/achievement-service";

export const runtime = "edge";

// GET - Get user's achievements and unseen notifications
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [achievements, notifications] = await Promise.all([
      getUserAchievements(user.id),
      getUnseen(user.id),
    ]);

    return NextResponse.json({ achievements, notifications });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }
}

// POST - Check for new achievements or mark as seen
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    if (body.action === "markSeen") {
      if (body.notificationId) {
        await markSeen(user.id, body.notificationId);
      } else {
        await markAllSeen(user.id);
      }
      return NextResponse.json({ success: true });
    }

    // Default: check for new achievements
    const newAchievements = await checkAchievements(user.id);
    return NextResponse.json({ newAchievements, hasNew: newAchievements.length > 0 });
  } catch (error) {
    console.error("Error checking achievements:", error);
    return NextResponse.json({ error: "Failed to check achievements" }, { status: 500 });
  }
}
