-- Create table for translation validation results
-- This table stores missing/unapproved translations found by the daily validator

CREATE TABLE IF NOT EXISTS translation_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  point_id TEXT NOT NULL,
  point_title TEXT NOT NULL,
  language TEXT NOT NULL,
  missing_fields JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Index for faster queries
  CONSTRAINT unique_translation_issue UNIQUE (game_id, point_id, language)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_translation_validation_game_id 
  ON translation_validation_results(game_id);

CREATE INDEX IF NOT EXISTS idx_translation_validation_language 
  ON translation_validation_results(language);

CREATE INDEX IF NOT EXISTS idx_translation_validation_created_at 
  ON translation_validation_results(created_at DESC);

-- Enable Row Level Security
ALTER TABLE translation_validation_results ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins/instructors to view
CREATE POLICY "Allow admins to view translation validation results"
  ON translation_validation_results
  FOR SELECT
  USING (true);

-- Create policy to allow the service role to insert/update/delete
CREATE POLICY "Allow service role to manage translation validation results"
  ON translation_validation_results
  FOR ALL
  USING (true);

-- Grant permissions
GRANT SELECT ON translation_validation_results TO anon;
GRANT SELECT ON translation_validation_results TO authenticated;
GRANT ALL ON translation_validation_results TO service_role;

-- Comment on table
COMMENT ON TABLE translation_validation_results IS 
  'Stores results from daily translation validation checks. Updated by Edge Function.';
