# App Kit 🚀

A production-ready Next.js SaaS boilerplate with authentication, payments, AI, and beautiful UI. Built for rapid development with Claude Code.

## Features

- ⚡ **Next.js 16** with App Router and React 19
- 🔐 **Supabase Authentication** - Magic link auth out of the box
- 💳 **Stripe Integration** - Subscriptions, one-time payments, and customer portal
- 🤖 **AI Ready** - Vercel AI SDK with OpenAI integration
- 🎨 **Beautiful UI** - shadcn/ui with Attio-inspired minimal design
- 📱 **Mobile First** - Airbnb-inspired UX patterns
- 🌙 **Dark Mode** - Built-in theme switching
- 📦 **TypeScript** - Fully typed for better DX
- 🛡️ **Production Ready** - Error handling, loading states, SEO

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui + Radix UI
- **Authentication:** Supabase
- **Payments:** Stripe
- **AI:** Vercel AI SDK + OpenAI
- **Database:** Supabase (PostgreSQL)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account ([supabase.com](https://supabase.com))
- A Stripe account ([stripe.com](https://stripe.com))
- An OpenAI API key ([platform.openai.com](https://platform.openai.com))

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/app-kit.git
cd app-kit
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your environment variables in `.env.local`:

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI
OPENAI_API_KEY=sk-...
```

4. **Set up Supabase**

Run the database migrations in your Supabase SQL editor:

```bash
# Copy the contents of supabase/migrations/001_initial_schema.sql
# and run it in your Supabase SQL editor
```

This will create:
- `profiles` table for user data
- `customers` table for Stripe customer mapping
- `subscriptions` table for managing subscriptions
- `payments` table for one-time purchases
- Row Level Security (RLS) policies
- Auto-trigger for profile creation

5. **Set up Stripe**

- Create products and prices in your Stripe dashboard
- Update the price IDs in `app/(marketing)/pricing/page.tsx`
- Set up a webhook endpoint pointing to `your-domain.com/api/webhooks/stripe`
- Add the webhook secret to your `.env.local`

6. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

## Project Structure

```
app-kit/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (login)
│   ├── (protected)/         # Protected routes (dashboard, settings)
│   ├── (marketing)/         # Public pages (pricing, features)
│   ├── api/                 # API routes
│   │   ├── auth/            # Auth callbacks
│   │   ├── chat/            # AI chat endpoint
│   │   ├── stripe/          # Stripe checkout & portal
│   │   └── webhooks/        # Stripe webhooks
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── auth/                # Auth components
│   ├── chat/                # AI chat interface
│   ├── ui/                  # shadcn/ui components
│   └── theme-provider.tsx   # Theme provider
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── stripe/              # Stripe utilities
│   ├── contexts/            # React contexts
│   └── utils.ts             # Utility functions
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript types
├── supabase/
│   └── migrations/          # Database migrations
└── proxy.ts                 # Auth proxy (Next.js 16+)
```

## Key Features Explained

### Authentication

Magic link authentication is set up by default. Users receive an email with a secure link to sign in.

**Login flow:**
1. User enters email on `/login`
2. Supabase sends magic link
3. User clicks link
4. Redirected to `/auth/callback`
5. Session created, redirected to `/dashboard`

### Payments

Stripe integration includes:
- **Subscriptions** - Recurring billing
- **One-time payments** - Single purchases
- **Customer portal** - Self-service billing management
- **Webhooks** - Automatic sync with database

### AI Chat

Built with Vercel AI SDK featuring:
- Streaming responses
- Function calling/tool use
- OpenAI GPT-4 integration
- Extensible tool system

### Mobile Optimization

Following Airbnb's UX patterns:
- 40px+ touch targets
- Responsive layouts
- Mobile-first design
- Safe area insets support

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repo in Vercel
3. Add environment variables
4. Deploy!

### Post-Deployment

1. Update `NEXT_PUBLIC_APP_URL` to your production URL
2. Update Stripe webhook URL to production endpoint
3. Configure Supabase redirect URLs
4. Test the full authentication flow

## Customization

### Design System

The color palette is inspired by Attio's minimal design. Customize in `app/globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --accent: 217 91% 60%;  /* Change this for your brand */
  /* ... */
}
```

### Adding Components

Add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

### Database Schema

Add new tables or modify existing ones in `supabase/migrations/`. Always create new migration files for changes.

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | Your app URL | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |

## Troubleshooting

### Supabase Connection Issues

- Verify your Supabase URL and keys
- Check if your IP is allowed in Supabase settings
- Ensure RLS policies are set up correctly

### Stripe Webhooks Not Working

- Verify webhook secret is correct
- Check webhook endpoint URL
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### AI Chat Not Streaming

- Verify OpenAI API key is valid
- Check browser console for errors
- Ensure `maxDuration` is set in route config

## License

MIT License - feel free to use this for your projects!

## Support

For issues and questions:
- Open an issue on GitHub
- Check the [Next.js docs](https://nextjs.org/docs)
- Check the [Supabase docs](https://supabase.com/docs)
- Check the [Stripe docs](https://stripe.com/docs)

---

Built with ❤️ for rapid SaaS development
