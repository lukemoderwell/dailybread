-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Stripe customers table
CREATE TABLE public.customers (
  id UUID REFERENCES auth.users PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "Users can view own customer data"
  ON public.customers FOR SELECT
  USING (auth.uid() = id);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id TEXT PRIMARY KEY, -- Stripe subscription ID
  user_id UUID REFERENCES auth.users NOT NULL,
  status TEXT NOT NULL,
  price_id TEXT NOT NULL,
  quantity INTEGER,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Payments table (for one-time purchases)
CREATE TABLE public.payments (
  id TEXT PRIMARY KEY, -- Stripe payment intent ID
  user_id UUID REFERENCES auth.users NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
