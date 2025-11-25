# Daily Bread

Family Bible reading app with AI-powered discussion guides.

## Context Directory
See [context/README.md](context/README.md) for detailed documentation.

| Topic | File |
|-------|------|
| Tech stack | [context/architecture/stack.md](context/architecture/stack.md) |
| Design system | [context/design/principles.md](context/design/principles.md) |
| Reading experience | [context/features/reading-experience.md](context/features/reading-experience.md) |
| Discussion guide | [context/features/discussion-guide.md](context/features/discussion-guide.md) |
| Family members | [context/features/family-members.md](context/features/family-members.md) |
| API patterns | [context/patterns/api-routes.md](context/patterns/api-routes.md) |
| Protected pages | [context/patterns/protected-pages.md](context/patterns/protected-pages.md) |
| Database | [context/patterns/database.md](context/patterns/database.md) |
| Gotchas | [context/gotchas.md](context/gotchas.md) |

## Quick Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npx shadcn@latest add [component]  # Add UI component
```

## Key Locations
- **Main reading UI**: `components/reading/reading-experience.tsx`
- **Question prompts**: `lib/ai/prompts/question-generation.ts`
- **Bible APIs**: `app/api/bible/`
- **Protected pages**: `app/(protected)/`
