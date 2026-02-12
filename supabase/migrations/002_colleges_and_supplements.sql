-- Colleges and supplements schema

-- Canonical colleges list
CREATE TABLE colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  common_app_id TEXT,
  admission_rate DECIMAL(5,2),
  sat_low INTEGER,
  sat_high INTEGER,
  act_low INTEGER,
  act_high INTEGER,
  major_offerings_count INTEGER,
  website TEXT,
  source_url TEXT,
  last_checked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE colleges ADD CONSTRAINT colleges_name_unique UNIQUE (name);

CREATE INDEX idx_colleges_name ON colleges(name);

-- Add college_id to user-selected schools
ALTER TABLE schools ADD COLUMN college_id UUID REFERENCES colleges(id) ON DELETE SET NULL;
CREATE INDEX idx_schools_college_id ON schools(college_id);

-- School-specific supplemental essays
CREATE TABLE college_supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  word_limit INTEGER,
  prompt_type TEXT,
  school_values TEXT[] DEFAULT '{}',
  strategic_focus TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_college_supplements_college_id ON college_supplements(college_id);

-- User submissions for missing colleges
CREATE TABLE college_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_name TEXT NOT NULL,
  website TEXT,
  status TEXT DEFAULT 'pending',
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User submissions for missing supplements
CREATE TABLE supplement_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
  college_name TEXT,
  prompt TEXT NOT NULL,
  word_limit INTEGER,
  prompt_type TEXT,
  source_url TEXT,
  status TEXT DEFAULT 'pending',
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_submissions ENABLE ROW LEVEL SECURITY;

-- Public read access for colleges and supplements
CREATE POLICY "Colleges are readable by everyone"
  ON colleges FOR SELECT
  USING (true);

CREATE POLICY "Supplements are readable by everyone"
  ON college_supplements FOR SELECT
  USING (true);

-- Submissions: authenticated users can insert
CREATE POLICY "Authenticated users can submit colleges"
  ON college_submissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can submit supplements"
  ON supplement_submissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure updated_at updates
CREATE TRIGGER update_colleges_updated_at BEFORE UPDATE ON colleges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_college_supplements_updated_at BEFORE UPDATE ON college_supplements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
