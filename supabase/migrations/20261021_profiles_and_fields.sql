-- ==============================================================================
-- AgriOrbit — Profiles and Fields Production Schema Migration
-- Safe Migration: Idempotent, NO DROP, NO DELETE statements.
-- Configures public.profiles, public.fields, and RLS policies.
-- Existing rows for onboarding_completed default to FALSE.
-- ==============================================================================

-- 1. Create public.profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'bn' CHECK (preferred_language IN ('bn', 'en')),
  communication_method TEXT DEFAULT 'in_app' CHECK (communication_method IN ('in_app', 'sms', 'voice', 'whatsapp')),
  primary_priority TEXT DEFAULT 'save_water',
  priorities TEXT[] DEFAULT ARRAY['save_water'],
  past_damages TEXT[] DEFAULT ARRAY[]::TEXT[],
  past_damage_notes TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure onboarding_completed column exists if profiles already existed
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Ensure existing rows where onboarding_completed is NULL default to FALSE
UPDATE public.profiles 
  SET onboarding_completed = FALSE 
  WHERE onboarding_completed IS NULL;

-- Ensure NOT NULL constraint with DEFAULT FALSE
ALTER TABLE IF EXISTS public.profiles 
  ALTER COLUMN onboarding_completed SET DEFAULT FALSE;

-- 2. Create public.fields table (supporting multi-plot farm management)
CREATE TABLE IF NOT EXISTS public.fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT,
  village TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  area DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  unit TEXT NOT NULL DEFAULT 'bigha' CHECK (unit IN ('bigha', 'acre', 'decimal', 'hectare')),
  elevation TEXT DEFAULT 'medium_high',
  soil_type TEXT DEFAULT 'loam',
  irrigation TEXT DEFAULT 'deep_tubewell',
  water_source TEXT DEFAULT 'groundwater',
  current_crop TEXT DEFAULT 'aman',
  previous_crop TEXT DEFAULT 'jute',
  planned_next_crop TEXT DEFAULT 'mustard',
  growing_season TEXT DEFAULT 'rabi',
  is_primary BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'save_water',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure priority and is_primary columns exist if fields table already existed
ALTER TABLE IF EXISTS public.fields 
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'save_water';
ALTER TABLE IF EXISTS public.fields 
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;

-- 3. Also create public.farmer_profiles and public.farmer_fields for legacy compatibility
CREATE TABLE IF NOT EXISTS public.farmer_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'bn' CHECK (preferred_language IN ('bn', 'en')),
  communication_method TEXT DEFAULT 'in_app' CHECK (communication_method IN ('in_app', 'sms', 'voice', 'whatsapp')),
  primary_priority TEXT DEFAULT 'save_water',
  priorities TEXT[] DEFAULT ARRAY['save_water'],
  past_damages TEXT[] DEFAULT ARRAY[]::TEXT[],
  past_damage_notes TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE IF EXISTS public.farmer_profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

UPDATE public.farmer_profiles 
  SET onboarding_completed = FALSE 
  WHERE onboarding_completed IS NULL;

ALTER TABLE IF EXISTS public.farmer_profiles 
  ALTER COLUMN onboarding_completed SET DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.farmer_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT,
  village TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  area DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  unit TEXT NOT NULL DEFAULT 'bigha' CHECK (unit IN ('bigha', 'acre', 'decimal', 'hectare')),
  elevation TEXT DEFAULT 'medium_high',
  soil_type TEXT DEFAULT 'loam',
  irrigation TEXT DEFAULT 'deep_tubewell',
  water_source TEXT DEFAULT 'groundwater',
  current_crop TEXT DEFAULT 'aman',
  previous_crop TEXT DEFAULT 'jute',
  planned_next_crop TEXT DEFAULT 'mustard',
  growing_season TEXT DEFAULT 'rabi',
  is_primary BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'save_water',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE IF EXISTS public.farmer_fields 
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'save_water';

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_fields ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for public.profiles (Users can only view & mutate their own profile)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can delete own profile'
  ) THEN
    CREATE POLICY "Users can delete own profile"
      ON public.profiles FOR DELETE
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

-- 6. RLS Policies for public.fields (Users can only view & mutate their own farm plots)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'fields' AND policyname = 'Users can view own fields'
  ) THEN
    CREATE POLICY "Users can view own fields"
      ON public.fields FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'fields' AND policyname = 'Users can insert own fields'
  ) THEN
    CREATE POLICY "Users can insert own fields"
      ON public.fields FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'fields' AND policyname = 'Users can update own fields'
  ) THEN
    CREATE POLICY "Users can update own fields"
      ON public.fields FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'fields' AND policyname = 'Users can delete own fields'
  ) THEN
    CREATE POLICY "Users can delete own fields"
      ON public.fields FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 7. RLS Policies for public.farmer_profiles
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

-- 8. RLS Policies for public.farmer_fields
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
