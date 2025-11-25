# Push Notifications (Planned)

Daily reminder notifications at user's preferred time.

## Status: Not Implemented

## Requirements
- Vercel Pro (unlimited cron)
- iOS Safari support (requires PWA install)
- Single device per user

## Architecture

### Database
```sql
-- Add to user_preferences
reminder_hour INTEGER DEFAULT 18
timezone TEXT DEFAULT 'America/New_York'
notifications_enabled BOOLEAN DEFAULT false

-- New table
push_subscriptions (user_id PK, endpoint, p256dh, auth)
```

### Files to Create
| File | Purpose |
|------|---------|
| `supabase/migrations/014_push_notifications.sql` | Schema |
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service worker |
| `public/icons/*.png` | App icons |
| `lib/push-notifications.ts` | Client utils |
| `components/settings/notification-settings.tsx` | Settings UI |
| `app/api/push/subscribe/route.ts` | Subscription API |
| `app/api/cron/send-reminders/route.ts` | Hourly cron |
| `vercel.json` | Cron config |

### Files to Modify
- `app/layout.tsx` - PWA meta tags
- `components/onboarding/onboarding-form.tsx` - Enable reminder selector
- `components/settings/settings-form.tsx` - Add notifications section
- `app/api/preferences/route.ts` - Handle new fields
- `types/supabase.ts` - Add types

### Environment Variables
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:...
CRON_SECRET=
```

## iOS Considerations
- Push only works after "Add to Home Screen"
- Must guide user through PWA install flow
- Permission must be from user gesture

## Full Plan
See: `~/.claude/plans/curried-giggling-fog.md`
