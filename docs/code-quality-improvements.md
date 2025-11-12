# Code Quality Improvements

This document tracks code quality improvements made to the Daily Bread codebase following DHH-style code review principles.

## Session 2025-11-11: Quick Wins

### 1. Extracted Date Formatting to Named Function

**Problem**: Magic locale string `'en-CA'` was used directly in the code without explanation.

**Before** (`components/reading/reading-experience.tsx:652`):
```typescript
const localDate = new Date().toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
```

**After** (`lib/dates.ts`):
```typescript
/**
 * Get the user's local date in ISO 8601 format (YYYY-MM-DD)
 */
export function getLocalDateISO(): string {
  return new Date().toLocaleDateString('en-CA');
}
```

**Usage** (`components/reading/reading-experience.tsx:437`):
```typescript
const localDate = getLocalDateISO();
```

**Benefits**:
- Clear intent through naming
- Centralized documentation of why we use 'en-CA'
- Reusable across the codebase
- Easier to test and mock

---

### 2. Removed Unnecessary Controlled Tab State

**Problem**: Component used controlled tab state to switch to scripture tab after completion, but this was pointless because `router.refresh()` immediately unmounts the entire component.

**Lines Removed**:
- Line 102: `const [activeTab, setActiveTab] = useState('scripture');`
- Line 143: `setActiveTab('scripture');`
- Line 525: `setActiveTab('scripture');`
- Line 642: Changed from `value={activeTab} onValueChange={setActiveTab}` to `defaultValue="scripture"`

**Benefits**:
- Reduced unnecessary state (from 17 useState hooks to 16)
- Removed pointless state updates
- Clearer code - tabs are uncontrolled and manage themselves
- Component always starts on scripture tab by default anyway

**Why This Was Unnecessary**:
The `router.refresh()` call unmounts and remounts the entire component with fresh props from the server. Any client-side state changes (like switching tabs) are discarded. The tab will always be at its default value after refresh.

---

## Related Bug Fixes (Same Session)

### Streak Calculation Bug
- **File**: `supabase/migrations/011_fix_streak_calculation.sql`
- **Fix**: Changed trigger to compare `NEW.date` instead of `CURRENT_DATE` to avoid timezone issues
- **Impact**: Streaks now calculate correctly regardless of server timezone

### Previous Reading Navigation
- **File**: `app/api/bible/sessions/route.ts`
- **Fix**: Changed ordering from UUID `id` to `completed_at` timestamp
- **Impact**: Navigation now follows chronological order

### UX: Loading States
- **File**: `components/reading/reading-experience.tsx`
- **Fix**: Added loading spinner to "Mark as Complete" button
- **Impact**: Users see feedback while session saves

### TTS Feature Removal
- **Files**: Multiple
- **Fix**: Cleanly removed all TTS features from codebase
- **Impact**: Reduced complexity, removed unused API costs

---

## Future Refactoring Opportunities

Based on DHH code review, larger architectural improvements to consider:

1. **Component Extraction**: Split 980-line `ReadingExperience` into focused sub-components
   - `ScriptureView`
   - `QuestionsView`
   - `SessionHeader`
   - `SessionSummary`

2. **State Management**: Replace 16 useState hooks with reducer or extract to custom hooks
   - `useSession(sessionId)` - Manage session loading
   - `useQuestions(session)` - Manage questions
   - `useNavigation(session)` - Manage prev/next

3. **DRY Database Queries**: Extract repeated navigation queries into helper function
   - `getAdjacentSession(userId, timestamp, direction)`

4. **Loading State Consolidation**: Create unified loading state manager instead of 7+ individual boolean flags

See full DHH code review in git history for detailed recommendations.

---

## Guidelines for Future Changes

When making changes to this codebase:

1. **Avoid Magic Values**: Extract strings, numbers, and locale codes to named constants or functions
2. **Question State Management**: Before adding `useState`, ask if the state is truly needed
3. **Check for Unmounting**: State changes are pointless if the component unmounts immediately after
4. **DRY Principles**: If you write the same code twice, extract it to a function
5. **Single Responsibility**: If a function or component does more than one thing, split it up

**Remember**: Code is read far more than it's written. Optimize for clarity.
