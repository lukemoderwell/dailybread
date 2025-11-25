# Reading Experience

Core component: `components/reading/reading-experience.tsx`

## Flow
1. Load today's passage based on reading plan
2. Display scripture with verse highlighting
3. Generate discussion questions per family member
4. Show discussion guide (Big Idea framework)
5. Track completion and streaks

## Key State
- `currentSessionId` - Active reading session
- `isHistoricalView` - Viewing past reading vs today
- `navigationMeta` - Previous/next session links
- `discussionGuide` - Generated guide content
- `questions` - Per-family-member questions

## Navigation
- Back button: Only shows when `hasPrevious` is true
- Forward button: Only shows in historical view
- Sessions stored in Supabase with navigation metadata
