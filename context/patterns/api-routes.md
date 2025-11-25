# API Routes Pattern

## Template
```tsx
// app/api/your-feature/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Your logic here

  return NextResponse.json({ success: true });
}
```

## Bible API Routes
All in `app/api/bible/`:
- `generate-questions/` - AI question generation
- `passage/` - Fetch scripture text
- `sessions/` - Reading session CRUD
- `summarize-session/` - AI summary generation
