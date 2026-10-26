-- ==============================================================================
-- AgriOrbit — Fix Unique Constraint on Notifications Table & Add Email Channel
-- Allow multiple test alerts while keeping strict deduplication for daily alerts
-- Team: Bay of Orbits (NASA Space Apps Challenge 2026)
-- ==============================================================================

-- 1. Drop the legacy unique constraint that was blocking repeat test alerts on the same date
ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS uq_notifications_user_field_alert_date;

-- 2. Create partial unique index that only enforces uniqueness for operational/daily alerts,
-- explicitly excluding 'test' alerts so test alerts can be triggered freely without collision.
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_daily_alert 
  ON public.notifications (user_id, field_id, alert_type, data_date) 
  NULLS NOT DISTINCT 
  WHERE alert_type <> 'test';

-- 3. Allow 'email' as a valid communication_method on profiles & farmer_profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_communication_method_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_communication_method_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'communication_method'
  ) THEN
    ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_communication_method_check 
      CHECK (communication_method IN ('email', 'in_app', 'sms', 'voice', 'whatsapp'));
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'farmer_profiles_communication_method_check'
  ) THEN
    ALTER TABLE public.farmer_profiles DROP CONSTRAINT farmer_profiles_communication_method_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'farmer_profiles' AND column_name = 'communication_method'
  ) THEN
    ALTER TABLE public.farmer_profiles 
      ADD CONSTRAINT farmer_profiles_communication_method_check 
      CHECK (communication_method IN ('email', 'in_app', 'sms', 'voice', 'whatsapp'));
  END IF;
END $$;
