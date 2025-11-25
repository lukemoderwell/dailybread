# Gotchas

Project-specific quirks to know.

## Build
- Env vars need fallbacks for successful builds
- Use `process.env.VAR || "placeholder"` pattern

## Supabase
- Must use `@supabase/ssr`, not `auth-helpers`
- Server client: `createSupabaseServerClient()`
- Client: `createSupabaseClient()`

## Stripe
- Use `any` for subscription period types (SDK type issue)

## React/Next.js
- HTML `<details>` uses `open`, not `defaultOpen`
- Server components by default, add `"use client"` only when needed

## AI Prompts
- Question generation prompt: `lib/ai/prompts/question-generation.ts`
- Changes to prompt structure require matching interface updates in:
  - `app/api/bible/generate-questions/route.ts`
  - `components/reading/reading-experience.tsx`
