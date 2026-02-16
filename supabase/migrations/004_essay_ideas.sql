-- Essay Ideas Table (Idea Vault)
-- Stores AI-generated essay ideas linked to a specific essay context

CREATE TABLE IF NOT EXISTS essay_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What essay is this for?
  essay_type TEXT NOT NULL CHECK (essay_type IN ('common_app', 'supplement')),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE, -- NULL for Common App
  supplement_id UUID REFERENCES college_supplements(id) ON DELETE CASCADE, -- NULL for Common App
  common_app_prompt_number INTEGER CHECK (common_app_prompt_number BETWEEN 1 AND 7),

  -- Idea content
  title TEXT NOT NULL,
  idea_text TEXT NOT NULL,
  angle_type TEXT,
  risk_level TEXT,
  difficulty TEXT,
  proof_points JSONB DEFAULT '[]'::jsonb,
  uniqueness_rationale TEXT,
  source_context TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS essay_ideas_user_id_idx ON essay_ideas(user_id);
CREATE INDEX IF NOT EXISTS essay_ideas_college_id_idx ON essay_ideas(college_id);
CREATE INDEX IF NOT EXISTS essay_ideas_supplement_id_idx ON essay_ideas(supplement_id);
CREATE INDEX IF NOT EXISTS essay_ideas_essay_type_idx ON essay_ideas(essay_type);

-- RLS Policies
ALTER TABLE essay_ideas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own ideas" ON essay_ideas;
DROP POLICY IF EXISTS "Users can insert own ideas" ON essay_ideas;
DROP POLICY IF EXISTS "Users can delete own ideas" ON essay_ideas;

-- Users can only see their own ideas
CREATE POLICY "Users can view own ideas"
  ON essay_ideas FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own ideas
CREATE POLICY "Users can insert own ideas"
  ON essay_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own ideas
CREATE POLICY "Users can delete own ideas"
  ON essay_ideas FOR DELETE
  USING (auth.uid() = user_id);
