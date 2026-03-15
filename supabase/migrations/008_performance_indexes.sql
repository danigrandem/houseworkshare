-- Performance indexes: house_id on all frequently queried tables
-- These tables are filtered by house_id on every query but had no index.

CREATE INDEX IF NOT EXISTS idx_tasks_house_id
  ON public.tasks(house_id);

CREATE INDEX IF NOT EXISTS idx_task_groups_house_id
  ON public.task_groups(house_id);

CREATE INDEX IF NOT EXISTS idx_weekly_config_house_week
  ON public.weekly_config(house_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_weekly_assignments_house_week
  ON public.weekly_assignments(house_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_weekly_assignments_user_week
  ON public.weekly_assignments(user_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_task_completions_house_week
  ON public.task_completions(house_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_task_completions_user_week
  ON public.task_completions(user_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_weekly_scores_house_week
  ON public.weekly_scores(house_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_task_swaps_house_week
  ON public.task_swaps(house_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_task_swaps_task_week
  ON public.task_swaps(task_id, week_start_date);

-- house_invitations: queried by email+status on every login
CREATE INDEX IF NOT EXISTS idx_house_invitations_email_status
  ON public.house_invitations(invited_email, status);
