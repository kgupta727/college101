-- Migration: 006_school_fits.sql
-- Persists AI-generated school-fit analysis results.
-- Acts as L2 cache: localStorage (L1) → this table (L2) → OpenAI (L3).
-- Keyed by (user_id, narrative_title, school_id).
--
-- Invalidation:
--   saveProfileAction deletes all rows for the user because scores are stale
--   when GPA / activities / school list changes.  narrative_title is used
--   as the key (more stable than narrative_id which resets to "narrative-1/2/3"
--   on every regeneration — old entries become unreachable without a delete).

CREATE TABLE IF NOT EXISTS school_fits (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  narrative_title text        NOT NULL,
  school_id       text        NOT NULL,
  school_name     text        NOT NULL,
  fit_data        jsonb       NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, narrative_title, school_id)
);

ALTER TABLE school_fits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own school fits"
  ON school_fits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own school fits"
  ON school_fits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own school fits"
  ON school_fits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own school fits"
  ON school_fits FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS school_fits_user_narrative_idx
  ON school_fits (user_id, narrative_title);
