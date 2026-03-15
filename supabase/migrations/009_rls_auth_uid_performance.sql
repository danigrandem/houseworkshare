-- Wrap auth.uid() in (SELECT auth.uid()) across user-scoped RLS policies.
-- Without the SELECT wrapper, Postgres re-evaluates auth.uid() per row scanned
-- instead of once per query, multiplying cost on large tables.
-- "Only admins" policies are left untouched.

-- ============================================================
-- users
-- ============================================================
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- ============================================================
-- task_completions
-- ============================================================
DROP POLICY IF EXISTS "Users can create their own task completions" ON public.task_completions;
CREATE POLICY "Users can create their own task completions"
  ON public.task_completions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only update their own task completions" ON public.task_completions;
CREATE POLICY "Users can only update their own task completions"
  ON public.task_completions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only delete their own task completions" ON public.task_completions;
CREATE POLICY "Users can only delete their own task completions"
  ON public.task_completions FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- task_swaps
-- ============================================================
DROP POLICY IF EXISTS "Users can view swaps they are involved in" ON public.task_swaps;
CREATE POLICY "Users can view swaps they are involved in"
  ON public.task_swaps FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = from_user_id OR (SELECT auth.uid()) = to_user_id);

DROP POLICY IF EXISTS "Users can create swaps from themselves" ON public.task_swaps;
CREATE POLICY "Users can create swaps from themselves"
  ON public.task_swaps FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = from_user_id);

DROP POLICY IF EXISTS "Users can update swaps where they are the recipient" ON public.task_swaps;
CREATE POLICY "Users can update swaps where they are the recipient"
  ON public.task_swaps FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = to_user_id);

DROP POLICY IF EXISTS "Users can delete swaps they created" ON public.task_swaps;
CREATE POLICY "Users can delete swaps they created"
  ON public.task_swaps FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = from_user_id AND status = 'pending');

-- ============================================================
-- extra_completions (migration 006)
-- ============================================================
DROP POLICY IF EXISTS "House members can view extra completions" ON public.extra_completions;
CREATE POLICY "House members can view extra completions"
  ON public.extra_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.house_members
      WHERE house_id = extra_completions.house_id
        AND user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own extra completions" ON public.extra_completions;
CREATE POLICY "Users can insert own extra completions"
  ON public.extra_completions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "House members can update extra completions (validate)" ON public.extra_completions;
CREATE POLICY "House members can update extra completions (validate)"
  ON public.extra_completions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.house_members
      WHERE house_id = extra_completions.house_id
        AND user_id = (SELECT auth.uid())
    )
  );
