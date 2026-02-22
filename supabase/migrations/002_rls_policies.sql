-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_group_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_swaps ENABLE ROW LEVEL SECURITY;

-- Note: auth.uid() function is already provided by Supabase, no need to create it

-- Users policies
CREATE POLICY "Users can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Authenticated users can view all tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin%'
    )
  );

CREATE POLICY "Only admins can update tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin%'
    )
  );

CREATE POLICY "Only admins can delete tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin%'
    )
  );

-- Task groups policies
CREATE POLICY "Authenticated users can view all task groups"
  ON public.task_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create task groups"
  ON public.task_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin%'
    )
  );

CREATE POLICY "Only admins can update task groups"
  ON public.task_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin%'
    )
  );

CREATE POLICY "Only admins can delete task groups"
  ON public.task_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin%'
    )
  );

-- Task group items policies
CREATE POLICY "Authenticated users can view all task group items"
  ON public.task_group_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage task group items"
  ON public.task_group_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin%'
    )
  );

-- Weekly config policies
CREATE POLICY "Authenticated users can view weekly config"
  ON public.weekly_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage weekly config"
  ON public.weekly_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin%'
    )
  );

-- Weekly assignments policies
CREATE POLICY "Authenticated users can view all weekly assignments"
  ON public.weekly_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage weekly assignments"
  ON public.weekly_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin%'
    )
  );

-- Task completions policies
CREATE POLICY "Authenticated users can view all task completions"
  ON public.task_completions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own task completions"
  ON public.task_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own task completions"
  ON public.task_completions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own task completions"
  ON public.task_completions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Weekly scores policies
CREATE POLICY "Authenticated users can view all weekly scores"
  ON public.weekly_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage weekly scores"
  ON public.weekly_scores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin%'
    )
  );

-- Task swaps policies
CREATE POLICY "Users can view swaps they are involved in"
  ON public.task_swaps FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create swaps from themselves"
  ON public.task_swaps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update swaps where they are the recipient"
  ON public.task_swaps FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id);

CREATE POLICY "Users can delete swaps they created"
  ON public.task_swaps FOR DELETE
  TO authenticated
  USING (auth.uid() = from_user_id AND status = 'pending');
