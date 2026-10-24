-- ==============================================================================
-- AgriOrbit — Farmer Profile & Multi-Field Production Schema
-- Designed for Supabase PostgreSQL with Row Level Security (RLS)
-- Team: Bay of Orbits (NASA Space Apps Challenge 2026)
-- ==============================================================================

-- 1. Create farmer_profiles table linked to Supabase Auth users
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
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create farmer_fields table supporting multiple agricultural plots per farmer
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
  notes TEXT,
  priority TEXT DEFAULT 'save_water',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_fields ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for farmer_profiles (Only authenticated owner can access/mutate)
CREATE POLICY "Users can view own farmer profile"
  ON public.farmer_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own farmer profile"
  ON public.farmer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own farmer profile"
  ON public.farmer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own farmer profile"
  ON public.farmer_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- 5. RLS Policies for farmer_fields (Only authenticated owner can access/mutate)
CREATE POLICY "Users can view own farm fields"
  ON public.farmer_fields FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own farm fields"
  ON public.farmer_fields FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own farm fields"
  ON public.farmer_fields FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own farm fields"
  ON public.farmer_fields FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_farmer_profiles_updated_at
  BEFORE UPDATE ON public.farmer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_farmer_fields_updated_at
  BEFORE UPDATE ON public.farmer_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. Supabase Storage: avatars bucket creation & public read policy
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload own avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);


-- 8. Create public.notifications table & alert notification preferences
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  field_id UUID NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'danger')),
  title_en TEXT NOT NULL,
  title_bn TEXT NOT NULL,
  body_en TEXT NOT NULL,
  body_bn TEXT NOT NULL,
  data_source TEXT NOT NULL,
  data_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  read_at TIMESTAMPTZ NULL,
  emailed_at TIMESTAMPTZ NULL,
  sms_sent_at TIMESTAMPTZ NULL,
  -- Note: UNIQUE NULLS NOT DISTINCT requires PostgreSQL 15+ (standard in Supabase)
  CONSTRAINT uq_notifications_user_field_alert_date UNIQUE NULLS NOT DISTINCT (user_id, field_id, alert_type, data_date)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update read_at on own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

REVOKE ALL ON public.notifications FROM anon;
REVOKE ALL ON public.notifications FROM authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;

ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS sms_alerts BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS public.farmer_profiles 
  ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS public.farmer_profiles 
  ADD COLUMN IF NOT EXISTS sms_alerts BOOLEAN DEFAULT FALSE;
