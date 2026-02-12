-- Essay Drafts Table
-- Stores user essay drafts for Common App and college supplements

CREATE TABLE IF NOT EXISTS essay_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What essay is this for?
  essay_type TEXT NOT NULL CHECK (essay_type IN ('common_app', 'supplement')),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE, -- NULL for Common App
  supplement_id UUID REFERENCES college_supplements(id) ON DELETE CASCADE, -- NULL for Common App
  
  -- Draft details
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT, -- Optional user-given title like "Version 1" or "Authentic version"
  content TEXT NOT NULL DEFAULT '',
  word_count INTEGER GENERATED ALWAYS AS (
    array_length(regexp_split_to_array(trim(content), '\s+'), 1)
  ) STORED,
  common_app_prompt_number INTEGER CHECK (common_app_prompt_number BETWEEN 1 AND 7), -- Which Common App prompt (1-7)
  
  -- Metadata
  is_primary BOOLEAN DEFAULT false, -- Mark the main version they're using
  notes TEXT, -- User notes about this version
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure we can track versions properly
  UNIQUE(user_id, essay_type, college_id, supplement_id, version_number)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS essay_drafts_user_id_idx ON essay_drafts(user_id);
CREATE INDEX IF NOT EXISTS essay_drafts_college_id_idx ON essay_drafts(college_id);
CREATE INDEX IF NOT EXISTS essay_drafts_supplement_id_idx ON essay_drafts(supplement_id);

-- RLS Policies
ALTER TABLE essay_drafts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own drafts" ON essay_drafts;
DROP POLICY IF EXISTS "Users can insert own drafts" ON essay_drafts;
DROP POLICY IF EXISTS "Users can update own drafts" ON essay_drafts;
DROP POLICY IF EXISTS "Users can delete own drafts" ON essay_drafts;

-- Users can only see their own drafts
CREATE POLICY "Users can view own drafts"
  ON essay_drafts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own drafts
CREATE POLICY "Users can insert own drafts"
  ON essay_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own drafts
CREATE POLICY "Users can update own drafts"
  ON essay_drafts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own drafts
CREATE POLICY "Users can delete own drafts"
  ON essay_drafts FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_essay_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS essay_drafts_updated_at ON essay_drafts;
CREATE TRIGGER essay_drafts_updated_at
  BEFORE UPDATE ON essay_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_essay_drafts_updated_at();
