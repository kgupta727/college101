-- College101 Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (main student profile)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  grade_level TEXT,
  gpa DECIMAL(3,2),
  sat_score INTEGER,
  act_score INTEGER,
  ap_count INTEGER DEFAULT 0,
  ib_count INTEGER DEFAULT 0,
  intended_majors TEXT[] DEFAULT '{}',
  academic_interests TEXT,
  constraints JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

-- Activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  hours_per_week INTEGER,
  weeks_per_year INTEGER,
  years_participated TEXT[],
  leadership_position TEXT,
  description TEXT,
  snapshot_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Schools table
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Narratives table (cache AI-generated narratives)
CREATE TABLE narratives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  theme TEXT,
  coherence_score INTEGER,
  narrative_data JSONB NOT NULL,
  selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for better performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_activities_profile_id ON activities(profile_id);
CREATE INDEX idx_schools_profile_id ON schools(profile_id);
CREATE INDEX idx_narratives_profile_id ON narratives(profile_id);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE narratives ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can view their own activities"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = activities.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own activities"
  ON activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = activities.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own activities"
  ON activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = activities.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own activities"
  ON activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = activities.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Schools policies
CREATE POLICY "Users can view their own schools"
  ON schools FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = schools.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own schools"
  ON schools FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = schools.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own schools"
  ON schools FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = schools.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own schools"
  ON schools FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = schools.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Narratives policies
CREATE POLICY "Users can view their own narratives"
  ON narratives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = narratives.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own narratives"
  ON narratives FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = narratives.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own narratives"
  ON narratives FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = narratives.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own narratives"
  ON narratives FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = narratives.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_narratives_updated_at BEFORE UPDATE ON narratives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
