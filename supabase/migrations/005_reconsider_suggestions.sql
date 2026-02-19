-- Migration: 005_reconsider_suggestions.sql
-- Stores AI-generated reconsider suggestions for activities that dilute a narrative.
-- Keyed by (user_id, narrative_title, activity_id) so results survive page reloads
-- and are invalidated naturally when the user regenerates narratives (new titles).

CREATE TABLE IF NOT EXISTS reconsider_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  -- narrative_title is used as the key (more stable than narrative_id which
  -- resets to "narrative-1/2/3" on every regeneration)
  narrative_title text NOT NULL,
  activity_id uuid NOT NULL REFERENCES activities (id) ON DELETE CASCADE,
  suggestion_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, narrative_title, activity_id)
);

-- RLS: users can only see and modify their own suggestions
ALTER TABLE reconsider_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reconsider suggestions"
  ON reconsider_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reconsider suggestions"
  ON reconsider_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reconsider suggestions"
  ON reconsider_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reconsider suggestions"
  ON reconsider_suggestions FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups by user + narrative
CREATE INDEX IF NOT EXISTS reconsider_suggestions_user_narrative_idx
  ON reconsider_suggestions (user_id, narrative_title);
