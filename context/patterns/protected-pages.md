# Protected Pages Pattern

Pages in `app/(protected)/` are automatically auth-protected by `proxy.ts`.

## Template
```tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function YourPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <div>Content for {user.email}</div>;
}
```

## Current Protected Routes
- `/today` - Main reading experience
- `/progress` - Bible reading progress/heatmap
- `/settings` - User preferences
- `/onboarding` - New user setup
