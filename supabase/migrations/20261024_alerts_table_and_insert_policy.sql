-- ==============================================================================
-- AgriOrbit — Alerts Table and Authenticated User Insert Policy
-- Safe Migration: Idempotent, NO DROP, NO DELETE, NO UPDATE.
-- Team: Bay of Orbits (NASA Space Apps Challenge 2026)
-- ==============================================================================

-- 1. Grant INSERT on public.notifications to authenticated users
GRANT INSERT ON public.notifications TO authenticated;

-- 2. Create RLS INSERT policy on public.notifications for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'notifications' 
      AND policyname = 'Users can insert own notifications'
  ) THEN
    CREATE POLICY "Users can insert own notifications"
      ON public.notifications FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END $$;

-- 3. Create public.alerts table (for environments querying alerts directly)
CREATE TABLE IF NOT EXISTS public.alerts (
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
  sms_sent_at TIMESTAMPTZ NULL
);

-- 4. Unique constraint on public.alerts
-- Note: UNIQUE NULLS NOT DISTINCT requires PostgreSQL 15+ (standard in Supabase).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_alerts_user_field_alert_date'
  ) THEN
    ALTER TABLE public.alerts 
      ADD CONSTRAINT uq_alerts_user_field_alert_date 
      UNIQUE NULLS NOT DISTINCT (user_id, field_id, alert_type, data_date);
  END IF;
END $$;

-- 5. Query index on public.alerts
CREATE INDEX IF NOT EXISTS idx_alerts_user_created 
  ON public.alerts (user_id, created_at DESC);

-- 6. Enable Row Level Security (RLS) on public.alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies on public.alerts for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'alerts' AND policyname = 'Users can view own alerts'
  ) THEN
    CREATE POLICY "Users can view own alerts"
      ON public.alerts FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'alerts' AND policyname = 'Users can insert own alerts'
  ) THEN
    CREATE POLICY "Users can insert own alerts"
      ON public.alerts FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'alerts' AND policyname = 'Users can update read_at on own alerts'
  ) THEN
    CREATE POLICY "Users can update read_at on own alerts"
      ON public.alerts FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END $$;

-- 8. Permissions on public.alerts
GRANT SELECT, INSERT ON public.alerts TO authenticated;
GRANT UPDATE (read_at) ON public.alerts TO authenticated;

-- 9. Ensure email_alerts and sms_alerts exist on public.profiles
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS sms_alerts BOOLEAN DEFAULT FALSE;
