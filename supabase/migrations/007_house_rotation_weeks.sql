-- How many weeks before rotating to the next group (1 = every week, 2 = every 2 weeks, etc.)
ALTER TABLE public.houses
  ADD COLUMN IF NOT EXISTS rotation_weeks SMALLINT NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.houses.rotation_weeks IS 'Rotate task group every N weeks: 1=weekly, 2=every 2 weeks, etc.';
