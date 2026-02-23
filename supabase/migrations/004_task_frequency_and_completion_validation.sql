-- Task frequency: daily or weekly
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_frequency') THEN
    CREATE TYPE task_frequency AS ENUM ('daily', 'weekly');
  END IF;
END $$;

-- Add frequency to tasks (skip if column already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'frequency'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN frequency task_frequency NOT NULL DEFAULT 'weekly';
  END IF;
END $$;

-- Completion validation: pending until other members validate
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'completion_status') THEN
    CREATE TYPE completion_status AS ENUM ('pending', 'validated');
  END IF;
END $$;

-- Add status to task_completions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'task_completions' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.task_completions ADD COLUMN status completion_status NOT NULL DEFAULT 'pending';
  END IF;
END $$;

ALTER TABLE public.task_completions ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;
ALTER TABLE public.task_completions ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.task_completions ADD COLUMN IF NOT EXISTS completion_date DATE;

-- Backfill: existing completions count as validated
UPDATE public.task_completions
SET status = 'validated',
    completion_date = COALESCE(completion_date, (completed_at AT TIME ZONE 'UTC')::date)
WHERE completion_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_task_completions_status ON public.task_completions(status);
CREATE INDEX IF NOT EXISTS idx_task_completions_completion_date ON public.task_completions(completion_date);
