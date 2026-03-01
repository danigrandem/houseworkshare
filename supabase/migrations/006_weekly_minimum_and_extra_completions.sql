-- Optional minimum completions for weekly tasks (only for frequency = 'weekly')
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS weekly_minimum INTEGER;

COMMENT ON COLUMN public.tasks.weekly_minimum IS 'For weekly tasks: minimum completions in the week to earn points. NULL = 1 completion counts.';

-- Extra completions: one-off unit tasks added during the week (no pre-defined task)
CREATE TABLE IF NOT EXISTS public.extra_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  name TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status completion_status NOT NULL DEFAULT 'pending',
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extra_completions_week_user ON public.extra_completions(week_start_date, user_id);
CREATE INDEX IF NOT EXISTS idx_extra_completions_house_week ON public.extra_completions(house_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_extra_completions_status ON public.extra_completions(status);

ALTER TABLE public.extra_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "House members can view extra completions"
  ON public.extra_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.house_members
      WHERE house_id = extra_completions.house_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own extra completions"
  ON public.extra_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "House members can update extra completions (validate)"
  ON public.extra_completions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.house_members
      WHERE house_id = extra_completions.house_id AND user_id = auth.uid()
    )
  );
