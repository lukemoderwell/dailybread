# Quick Setup Guide

This guide will help you get App Kit running in under 10 minutes.

## Prerequisites

Before starting, create accounts and get API keys for:

1. **Supabase** - https://supabase.com (free tier available)
2. **Stripe** - https://stripe.com (test mode is free)
3. **OpenAI** - https://platform.openai.com (pay-as-you-go)

## Setup Steps

### 1. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local` with:

**Supabase Keys** (from https://supabase.com/dashboard/project/_/settings/api):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Stripe Keys** (from https://dashboard.stripe.com/test/apikeys):
- `STRIPE_SECRET_KEY` (starts with `sk_test_`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)

**OpenAI Key** (from https://platform.openai.com/api-keys):
- `OPENAI_API_KEY`

### 2. Supabase Database Setup

1. Go to your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run it in the SQL Editor
4. Verify tables were created in the Table Editor

### 3. Stripe Products Setup

1. Go to https://dashboard.stripe.com/test/products
2. Create 3 products (Starter, Pro, Enterprise)
3. Add recurring prices to each
4. Copy the price IDs (start with `price_`)
5. Update them in `app/(marketing)/pricing/page.tsx`

### 4. Stripe Webhook (for local development)

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

Login and forward webhooks:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook secret (starts with `whsec_`) to `STRIPE_WEBHOOK_SECRET` in `.env.local`

### 5. Supabase Auth Configuration

1. Go to Authentication > URL Configuration
2. Add redirect URL: `http://localhost:3000/auth/callback`
3. For production, add: `https://yourdomain.com/auth/callback`

### 6. Run the App

```bash
npm run dev
```

Open http://localhost:3000

## Test the Features

### Test Auth
1. Go to `/login`
2. Enter your email
3. Check your inbox for magic link
4. Click link, should redirect to `/dashboard`

### Test Payments
1. Go to `/pricing`
2. Click "Get Started" on any plan
3. Use test card: `4242 4242 4242 4242`
4. Any future expiry, any CVC
5. Should redirect to dashboard

### Test AI Chat
1. Go to `/dashboard`
2. The chat API is ready at `/api/chat`
3. UI component needs updating for AI SDK v5 (see TODO in code)

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add all environment variables
4. Update `NEXT_PUBLIC_APP_URL` to your production URL
5. Deploy!

### Post-Deployment

1. Update Stripe webhook URL to `https://yourdomain.com/api/webhooks/stripe`
2. Add production redirect URL in Supabase: `https://yourdomain.com/auth/callback`
3. Test the full flow!

## Troubleshooting

**Build fails?**
- Make sure all environment variables are set (use placeholders if needed for build)

**Magic link not working?**
- Check Supabase email settings
- Verify redirect URLs are configured
- Check spam folder

**Stripe checkout not working?**
- Verify you're using test mode keys
- Check webhook is listening
- Use test card `4242 4242 4242 4242`

**Database errors?**
- Verify SQL migration ran successfully
- Check RLS policies are enabled
- Verify Supabase URL and keys

## What's Next?

- Add your own features to the dashboard
- Customize the design system in `app/globals.css`
- Add more pages in `app/(protected)/`
- Update pricing plans with real Stripe price IDs
- Complete the AI chat interface for SDK v5
- Add email templates in Supabase
- Configure custom domain

## Need Help?

- Check the main README.md for detailed documentation
- Visit https://docs.claude.com/claude-code for Claude Code docs
- Open an issue on GitHub

---

Happy building! 🚀
