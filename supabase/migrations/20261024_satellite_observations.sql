-- ==============================================================================
-- AgriOrbit — Satellite Observations Table & RLS Policies
-- Stores daily automated feeds for SMAP (soil moisture), MODIS/VIIRS (NDVI), etc.
-- Safe Migration: Idempotent, safe on repeat runs.
-- Team: Bay of Orbits (NASA Space Apps Challenge 2026)
-- ==============================================================================

-- 1. Create public.satellite_observations table
CREATE TABLE IF NOT EXISTS public.satellite_observations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  district TEXT NOT NULL,
  source TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  observed_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT uq_sat_obs_district_source_date UNIQUE (district, source, observed_date)
);

-- 2. Indexes for efficient lookup by district and chronological queries
CREATE INDEX IF NOT EXISTS idx_sat_obs_district_source 
  ON public.satellite_observations (district, source, observed_date DESC);

CREATE INDEX IF NOT EXISTS idx_sat_obs_observed_date 
  ON public.satellite_observations (observed_date DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.satellite_observations ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Allow public read access (farmers and visitors can view observations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'satellite_observations' 
      AND policyname = 'Allow public read access to satellite_observations'
  ) THEN
    CREATE POLICY "Allow public read access to satellite_observations"
      ON public.satellite_observations FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- 5. Policy: Allow service role full access (for automated GitHub Actions sync job)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'satellite_observations' 
      AND policyname = 'Allow service_role full access to satellite_observations'
  ) THEN
    CREATE POLICY "Allow service_role full access to satellite_observations"
      ON public.satellite_observations FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 6. Grant SELECT to anon and authenticated roles
GRANT SELECT ON public.satellite_observations TO anon, authenticated;
GRANT ALL ON public.satellite_observations TO service_role;
