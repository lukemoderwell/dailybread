# Tech Stack

```
Daily Bread = Next.js 16 + Supabase + Stripe + OpenAI + shadcn/ui
```

## Structure
- **App Router** with route groups: `(auth)`, `(protected)`, `(marketing)`
- **Server/Client separation**: `lib/supabase/{server,client}.ts`
- **Auth**: Handled by `proxy.ts` middleware
- **API**: RESTful routes in `app/api/`

## Key Directories
| Path | Purpose |
|------|---------|
| `app/(protected)/` | Authenticated pages |
| `app/api/bible/` | Bible reading APIs |
| `lib/ai/prompts/` | AI prompt templates |
| `components/` | React components |
| `supabase/migrations/` | Database DDL |
