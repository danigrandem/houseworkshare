-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE swap_type AS ENUM ('temporary', 'permanent');
CREATE TYPE swap_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task groups table
CREATE TABLE IF NOT EXISTS public.task_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task group items (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.task_group_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  task_group_id UUID NOT NULL REFERENCES public.task_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, task_group_id)
);

-- Weekly config table
CREATE TABLE IF NOT EXISTS public.weekly_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start_date DATE NOT NULL UNIQUE,
  points_target_per_person INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly assignments table
CREATE TABLE IF NOT EXISTS public.weekly_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start_date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_group_id UUID REFERENCES public.task_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_start_date, user_id)
);

-- Task completions table
CREATE TABLE IF NOT EXISTS public.task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  week_start_date DATE NOT NULL,
  points_earned INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly scores table
CREATE TABLE IF NOT EXISTS public.weekly_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  points_target INTEGER NOT NULL,
  points_carried_over INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

-- Task swaps table
CREATE TABLE IF NOT EXISTS public.task_swaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  swap_date DATE,
  swap_type swap_type NOT NULL,
  status swap_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_assignments_week_user ON public.weekly_assignments(week_start_date, user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_assignments_user ON public.weekly_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_week_user ON public.task_completions(week_start_date, user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON public.task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_task ON public.task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_completed_at ON public.task_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_weekly_scores_week_user ON public.weekly_scores(week_start_date, user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_scores_user ON public.weekly_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_task_swaps_status ON public.task_swaps(status);
CREATE INDEX IF NOT EXISTS idx_task_swaps_week ON public.task_swaps(week_start_date);
CREATE INDEX IF NOT EXISTS idx_task_swaps_to_user ON public.task_swaps(to_user_id);
CREATE INDEX IF NOT EXISTS idx_task_swaps_from_user ON public.task_swaps(from_user_id);
CREATE INDEX IF NOT EXISTS idx_task_swaps_swap_date ON public.task_swaps(swap_date);
CREATE INDEX IF NOT EXISTS idx_task_group_items_group ON public.task_group_items(task_group_id);
CREATE INDEX IF NOT EXISTS idx_task_group_items_task ON public.task_group_items(task_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_groups_updated_at BEFORE UPDATE ON public.task_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_config_updated_at BEFORE UPDATE ON public.weekly_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_scores_updated_at BEFORE UPDATE ON public.weekly_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_swaps_updated_at BEFORE UPDATE ON public.task_swaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
