# Achievements

Gamification system to encourage consistent family Bible reading.

## Categories
- **Streaks**: 1, 7, 14, 30, 100, 365 days
- **Books**: First book, Gospels, NT, OT, full Bible
- **Journey**: 25%, 50%, 75%, 100% of Bible
- **Special**: Session milestones (50, 100 sessions)

## Key Files
- Definitions: `lib/achievements/achievement-definitions.ts`
- Service: `lib/achievements/achievement-service.ts`
- API: `app/api/achievements/route.ts`
- Components: `components/achievements/`
- DB Migration: `supabase/migrations/012_family_achievements.sql`

## Data Flow
1. User completes reading → `handleCompleteReading()`
2. API checks for newly unlocked achievements
3. Returns `newAchievements[]` to client
4. `AchievementCelebration` component displays celebration
5. User dismisses → notification marked as seen

## Achievement Definition
```typescript
interface AchievementDefinition {
  id: string;           // e.g., "streak_7"
  category: string;     // streak | book | journey | special
  name: string;         // "Week Warrior"
  description: string;
  icon: string;         // Lucide icon name
  isMajor: boolean;     // Bigger celebration
  requirementType: string;
  requirementValue: number | null;
}
```

## Integration Point
`components/reading/reading-experience.tsx` ~line 620-683 handles:
- Checking for achievements after reading completion
- Showing celebration modal
- Deferring page refresh until celebration dismissed
