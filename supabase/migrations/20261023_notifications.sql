-- ==============================================================================
-- AgriOrbit — Alert Notification System Schema Migration
-- Safe Migration: Idempotent, NO DROP, NO DELETE, NO UPDATE statements.
-- Configures public.notifications, user alerts preferences, and strict RLS.
-- Team: Bay of Orbits (NASA Space Apps Challenge 2026)
-- ==============================================================================

-- 1. Create public.notifications table
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
  sms_sent_at TIMESTAMPTZ NULL
);

-- 2. Unique constraint: Prevents duplicate alerts for the same user, field, type, and date.
-- Note: UNIQUE NULLS NOT DISTINCT requires PostgreSQL 15+ (standard in Supabase).
-- It ensures rows with NULL field_id are also protected against duplicates.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_notifications_user_field_alert_date'
  ) THEN
    ALTER TABLE public.notifications 
      ADD CONSTRAINT uq_notifications_user_field_alert_date 
      UNIQUE NULLS NOT DISTINCT (user_id, field_id, alert_type, data_date);
  END IF;
END $$;

-- 3. Query performance index for fetching user alerts ordered by created_at DESC
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON public.notifications (user_id, created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Authenticated users can view only their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications"
      ON public.notifications FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- 6. RLS Policy: Authenticated users can update only their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can update read_at on own notifications'
  ) THEN
    CREATE POLICY "Users can update read_at on own notifications"
      ON public.notifications FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END $$;

-- 7. Strict client permissions:
-- Revoke all table-level access from anon and authenticated,
-- Grant SELECT and UPDATE only on the read_at column to authenticated users.
-- Client cannot INSERT or DELETE notifications (reserved for serverless cron with service_role).
REVOKE ALL ON public.notifications FROM anon;
REVOKE ALL ON public.notifications FROM authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;

-- 8. Add email_alerts and sms_alerts preference columns to public.profiles
-- In PostgreSQL 11+, ADD COLUMN ... DEFAULT FALSE automatically applies to all existing rows.
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS sms_alerts BOOLEAN DEFAULT FALSE;

-- 9. Also update public.farmer_profiles for legacy compatibility
ALTER TABLE IF EXISTS public.farmer_profiles 
  ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS public.farmer_profiles 
  ADD COLUMN IF NOT EXISTS sms_alerts BOOLEAN DEFAULT FALSE;
