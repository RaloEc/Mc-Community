-- Create weapon_analysis_jobs table for async weapon analysis
CREATE TABLE IF NOT EXISTS public.weapon_analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  bucket TEXT NOT NULL DEFAULT 'weapon-analysis-temp',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_weapon_analysis_jobs_user_id ON public.weapon_analysis_jobs(user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_weapon_analysis_jobs_status ON public.weapon_analysis_jobs(status);

-- Enable RLS
ALTER TABLE public.weapon_analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert jobs only for themselves
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'weapon_analysis_jobs' 
    AND policyname = 'Users can insert their own jobs'
  ) THEN
    CREATE POLICY "Users can insert their own jobs"
      ON public.weapon_analysis_jobs
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can read only their own jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'weapon_analysis_jobs' 
    AND policyname = 'Users can read their own jobs'
  ) THEN
    CREATE POLICY "Users can read their own jobs"
      ON public.weapon_analysis_jobs
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can update only their own jobs (for Edge Function via service role)
-- Note: Service role bypasses RLS, so this is for future client-side updates if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'weapon_analysis_jobs' 
    AND policyname = 'Users can update their own jobs'
  ) THEN
    CREATE POLICY "Users can update their own jobs"
      ON public.weapon_analysis_jobs
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_weapon_analysis_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_weapon_analysis_jobs_updated_at
  BEFORE UPDATE ON public.weapon_analysis_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_weapon_analysis_jobs_updated_at();
