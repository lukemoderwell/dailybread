# Database Patterns

Supabase with Row Level Security.

## Conventions
- `snake_case` for column names
- Always add `created_at` timestamp
- UUIDs for primary keys
- Reference `auth.users` for `user_id`

## New Table Template
```sql
-- supabase/migrations/XXX_add_table.sql
CREATE TABLE public.your_table (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON public.your_table FOR SELECT
  USING (auth.uid() = user_id);
```

## After Schema Changes
Update `types/supabase.ts` with new table types.
