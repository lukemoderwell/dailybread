# Working with App Kit using Claude Code

This guide helps you (and Claude Code) work effectively with this boilerplate.

## Quick Context for Claude

When working with this codebase, here are the key things to know:

### Project Architecture

```
App Kit = Next.js 16 + Supabase Auth + Stripe Payments + OpenAI + shadcn/ui
├── App Router with route groups: (auth), (protected), (marketing)
├── Server/Client separation: lib/supabase/{server,client}.ts
├── Middleware handles auth protection automatically
└── All API routes follow RESTful patterns
```

### Key Files & Their Purpose

| File | Purpose | When to Edit |
|------|---------|--------------|
| `proxy.ts` | Auth protection, redirects | Add new protected routes |
| `app/globals.css` | Design system, CSS vars | Customize colors/theme |
| `lib/supabase/*` | Database clients | Never (unless debugging) |
| `lib/stripe/*` | Payment logic | Add new payment features |
| `types/supabase.ts` | DB types | After schema changes |
| `supabase/migrations/*` | Database DDL | Add tables/columns |

### Design System Principles

**Attio-Inspired Minimal Design:**
- Use color sparingly (black, white, gray, single blue accent)
- Hierarchy through weight/spacing, not color
- Dark mode is primary
- Mobile-first with 40px+ touch targets

**Component Usage:**
```tsx
// Good - minimal, clean
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Avoid - too colorful
<Card className="bg-gradient-to-r from-purple-500 to-pink-500">
```

### Common Patterns

#### Adding a New Protected Page

```bash
# 1. Create page in protected route group
touch app/(protected)/settings/page.tsx

# 2. Page will automatically be protected by middleware
# 3. Access user via server component:
```

```tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <div>Settings for {user.email}</div>;
}
```

#### Adding a New API Route

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

#### Adding a Database Table

```sql
-- supabase/migrations/002_add_your_table.sql
CREATE TABLE public.your_table (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON public.your_table FOR SELECT
  USING (auth.uid() = user_id);
```

Then update `types/supabase.ts` with the new table type.

#### Adding a Stripe Product/Feature

```tsx
// In your component
const handleCheckout = async () => {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      priceId: "price_xxx",
      mode: "subscription" // or "payment"
    }),
  });

  const { url } = await response.json();
  window.location.href = url;
};
```

## Prompt Templates for Claude Code

### Add a New Feature

```
I want to add [feature name] to App Kit. This should:
1. [Requirement 1]
2. [Requirement 2]

Please follow the existing patterns:
- Keep the minimal Attio-inspired design
- Use existing shadcn components
- Add proper auth checks
- Update types if needed
```

### Debug an Issue

```
I'm seeing [error/issue] when [action].

Context:
- I'm on [page/route]
- Environment: [development/production]
- Expected: [expected behavior]
- Actual: [actual behavior]

Please help debug following the codebase conventions.
```

### Refactor Code

```
Please refactor [file/component] to:
1. [Goal 1]
2. [Goal 2]

Keep:
- Existing functionality
- Type safety
- Design system consistency
- Mobile responsiveness
```

### Update Design System

```
I want to update the design system to [change].

Please update:
1. globals.css color variables
2. Any affected components
3. Maintain dark mode compatibility
4. Keep the minimal aesthetic
```

## Tips for Working with Claude Code

### What Works Well

✅ **Do:**
- Be specific about which files to modify
- Reference existing patterns (e.g., "like the dashboard page")
- Ask to follow the design system
- Request tests for new features
- Ask for TypeScript types
- Mention mobile responsiveness needs

✅ **Examples:**
- "Add a profile settings page following the dashboard pattern"
- "Create a new API route for X, following the Stripe checkout pattern"
- "Add a new table to Supabase with proper RLS policies"

### What to Watch Out For

❌ **Avoid:**
- Asking to change the entire design system at once
- Requesting features that break the minimal aesthetic
- Adding colors outside the defined palette
- Modifying middleware without understanding auth flow

### Common Tasks

#### 1. Add a shadcn Component

```bash
# Claude Code can do this for you
npx shadcn@latest add [component-name]
```

Or just ask: "Add the dropdown-menu component from shadcn"

#### 2. Update Database Schema

```
I need to add [fields] to the [table] table in Supabase.
Please:
1. Create a new migration file
2. Add the columns with proper types
3. Update the TypeScript types
4. Update any RLS policies if needed
```

#### 3. Add Stripe Webhook Handler

```
I need to handle the [event-name] Stripe webhook.
Please add it to the webhook route following the existing pattern.
```

#### 4. Create a New Marketing Page

```
Create a new marketing page at /[route] with:
- [Content sections]
- Follow the landing page structure
- Keep the minimal design
- Make it mobile responsive
```

## Code Style Guide

### TypeScript

```tsx
// ✅ Good - explicit types
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export async function getProfile(userId: string): Promise<UserProfile> {
  // ...
}

// ❌ Avoid - implicit any
export async function getProfile(userId) {
  // ...
}
```

### Components

```tsx
// ✅ Good - server component by default
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// ✅ Good - client component when needed
"use client";
import { useState } from "react";

export default function InteractiveComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Error Handling

```tsx
// ✅ Good - proper error handling
try {
  const result = await riskyOperation();
  return NextResponse.json({ result });
} catch (error) {
  console.error("Operation failed:", error);
  return NextResponse.json(
    { error: "Operation failed" },
    { status: 500 }
  );
}

// ❌ Avoid - silent failures
const result = await riskyOperation();
return NextResponse.json({ result });
```

## Environment Variables

Always check for required env vars in new code:

```tsx
// ✅ Good - validate env vars
if (!process.env.REQUIRED_VAR) {
  throw new Error("REQUIRED_VAR is not set");
}

// For builds, provide fallbacks:
const apiKey = process.env.API_KEY || "placeholder_for_build";
```

## Testing Approach

When adding new features, test:

1. **Auth flow** - Does it respect protected routes?
2. **Mobile** - Does it work on small screens?
3. **Dark mode** - Does it look good in dark mode?
4. **Types** - Are all TypeScript errors resolved?
5. **Build** - Does `npm run build` succeed?

## Database Conventions

- Use `snake_case` for column names
- Always add `created_at` and `updated_at` timestamps
- Enable RLS on all user-facing tables
- Use UUIDs for primary keys
- Reference `auth.users` for user_id columns

## Git Commit Style

Follow this pattern:

```bash
git commit -m "Add feature: user profile settings

- Create profile settings page
- Add API route for profile updates
- Update database schema
- Add proper auth checks
"
```

## Deployment Checklist

Before deploying, ask Claude Code to verify:

- [ ] All environment variables documented
- [ ] Database migrations ready
- [ ] Stripe webhooks configured
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] Types are correct
- [ ] README updated if needed

## Getting Unstuck

If you're stuck, try these prompts:

```
"Explain how [feature] works in this codebase"
"Show me an example of [pattern] in the existing code"
"What's the best way to add [feature] following App Kit conventions?"
"Debug why [thing] isn't working - check all related files"
"Refactor this to follow the existing patterns better"
```

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Claude Code Docs**: https://docs.claude.com/claude-code

## Project-Specific Gotchas

1. **AI chat component** - Stubbed out, needs AI SDK v5 update
3. **Stripe types** - Use `any` for subscription periods (type issue with SDK)
4. **Supabase cookies** - Must use `@supabase/ssr`, not `auth-helpers`
5. **Build placeholders** - Env vars need fallbacks for successful builds

---

## Quick Reference

**Start dev server:**
```bash
npm run dev
```

**Add shadcn component:**
```bash
npx shadcn@latest add [component]
```

**Run Stripe webhook locally:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Build for production:**
```bash
npm run build
```

**Deploy to Vercel:**
```bash
git push origin main
# Then connect in Vercel dashboard
```

---

Built for rapid development with Claude Code 🚀
