-- ==============================================================================
-- AgriOrbit — Add upazila_id and district_id to User Profiles and Farm Fields
-- Enables granular Upazila-level tracking across all 64 districts in Bangladesh.
-- Safe Migration: Idempotent, NO DROP, NO DELETE statements.
-- ==============================================================================

-- 1. Profiles Table
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS upazila_id TEXT,
  ADD COLUMN IF NOT EXISTS district_id TEXT;

-- 2. Farmer Profiles Table (compatibility)
ALTER TABLE IF EXISTS public.farmer_profiles
  ADD COLUMN IF NOT EXISTS upazila_id TEXT,
  ADD COLUMN IF NOT EXISTS district_id TEXT;

-- 3. Fields Table
ALTER TABLE IF EXISTS public.fields
  ADD COLUMN IF NOT EXISTS upazila_id TEXT,
  ADD COLUMN IF NOT EXISTS district_id TEXT;

-- 4. Farmer Fields Table (compatibility)
ALTER TABLE IF EXISTS public.farmer_fields
  ADD COLUMN IF NOT EXISTS upazila_id TEXT,
  ADD COLUMN IF NOT EXISTS district_id TEXT;

-- Create index on upazila_id for faster geographic queries and regional alert generation
CREATE INDEX IF NOT EXISTS idx_fields_upazila_id ON public.fields(upazila_id);
CREATE INDEX IF NOT EXISTS idx_farmer_fields_upazila_id ON public.farmer_fields(upazila_id);
CREATE INDEX IF NOT EXISTS idx_profiles_upazila_id ON public.profiles(upazila_id);
