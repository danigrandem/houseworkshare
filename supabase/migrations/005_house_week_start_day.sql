-- 0 = Sunday, 1 = Monday (default), 2 = Tuesday, ... 6 = Saturday
ALTER TABLE public.houses
  ADD COLUMN IF NOT EXISTS week_start_day SMALLINT NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.houses.week_start_day IS 'First day of week: 0=Sunday, 1=Monday, ..., 6=Saturday';
