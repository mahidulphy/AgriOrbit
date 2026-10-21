-- ==============================================================================
-- AgriOrbit — Farmer Onboarding & Multi-Field RLS Migration
-- Team: Bay of Orbits (NASA Space Apps Challenge 2026)
-- SAFE MIGRATION: No DROP or DELETE statements
-- ==============================================================================

-- 1. Ensure onboarding_completed flag exists on public.farmer_profiles
ALTER TABLE IF EXISTS public.farmer_profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 2. Ensure priority column exists on public.farmer_fields
ALTER TABLE IF EXISTS public.farmer_fields 
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'save_water';

-- 3. Enable Row Level Security (RLS) on both tables (idempotent)
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_fields ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for farmer_profiles (Only authenticated owner can read/write own rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'farmer_profiles' AND policyname = 'Users can view own farmer profile'
  ) THEN
    CREATE POLICY "Users can view own farmer profile"
      ON public.farmer_profiles FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'farmer_profiles' AND policyname = 'Users can insert own farmer profile'
  ) THEN
    CREATE POLICY "Users can insert own farmer profile"
      ON public.farmer_profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'farmer_profiles' AND policyname = 'Users can update own farmer profile'
  ) THEN
    CREATE POLICY "Users can update own farmer profile"
      ON public.farmer_profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 5. RLS Policies for farmer_fields (Only authenticated owner can read/write own rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'farmer_fields' AND policyname = 'Users can view own farm fields'
  ) THEN
    CREATE POLICY "Users can view own farm fields"
      ON public.farmer_fields FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'farmer_fields' AND policyname = 'Users can insert own farm fields'
  ) THEN
    CREATE POLICY "Users can insert own farm fields"
      ON public.farmer_fields FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'farmer_fields' AND policyname = 'Users can update own farm fields'
  ) THEN
    CREATE POLICY "Users can update own farm fields"
      ON public.farmer_fields FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
