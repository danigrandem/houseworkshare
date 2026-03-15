import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserHouse } from '@/lib/db/queries/houses'
import { getWeekStartString, addDays } from '@/lib/utils/date'
import {
  getWeeklyAssignment,
  getWeeklyScore,
  getWeeklyConfig,
  getAllUsers,
  getAllWeeklyScores,
  getAllWeeklyAssignmentsWithGroups,
} from '@/lib/db/queries/weekly'
import { processWeekEnd } from '@/lib/utils/weekly-scores'
import { getCompletionsByUserAndWeek, getCompletionsByWeek, getPendingCompletionsToValidate } from '@/lib/db/queries/completions'
import { getExtraCompletionsByUserAndWeek, getPendingExtraCompletionsToValidate } from '@/lib/db/queries/extra-completions'
import { getPendingSwapsForUser, getActiveSwapsForTasks } from '@/lib/db/queries/swaps'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const currentHouse = await getCurrentUserHouse(user.id)
  if (!currentHouse) {
    redirect('/setup-house')
  }

  const firstDayOfWeek = currentHouse.week_start_day ?? 1
  const weekStartDate = getWeekStartString(undefined, firstDayOfWeek)
  const previousWeekStart = getWeekStartString(addDays(new Date(weekStartDate), -7), firstDayOfWeek)

  const [currentWeekScores, previousWeekScores, previousWeekConfig] = await Promise.all([
    getAllWeeklyScores(weekStartDate, user.id),
    getAllWeeklyScores(previousWeekStart, user.id),
    getWeeklyConfig(previousWeekStart, user.id),
  ])
  if (currentWeekScores.length === 0 && previousWeekScores.length > 0) {
    const baseTarget = previousWeekConfig?.points_target_per_person ?? 50
    await processWeekEnd(previousWeekStart, baseTarget, user.id)
  }

  const [assignment, weeklyScore, weeklyConfig, completions, pendingCompletionsToValidate, pendingSwaps, users, allCompletions, extraCompletions, pendingExtraCompletions] = await Promise.all([
    getWeeklyAssignment(user.id, weekStartDate),
    getWeeklyScore(user.id, weekStartDate),
    getWeeklyConfig(weekStartDate, user.id),
    getCompletionsByUserAndWeek(user.id, weekStartDate),
    getPendingCompletionsToValidate(weekStartDate, user.id),
    getPendingSwapsForUser(user.id),
    getAllUsers(user.id),
    getCompletionsByWeek(weekStartDate, user.id),
    getExtraCompletionsByUserAndWeek(user.id, weekStartDate),
    getPendingExtraCompletionsToValidate(weekStartDate, user.id),
  ])
  const tasks = assignment?.task_group?.tasks || []

  const [allMembersAssignments, swapsMap] = await Promise.all([
    getAllWeeklyAssignmentsWithGroups(weekStartDate, user.id),
    getActiveSwapsForTasks(tasks.map((t) => t.id), weekStartDate, user.id),
  ])

  const assignmentsByUser = new Map(allMembersAssignments.map((a) => [a.user_id, a]))
  const membersWithAssignments = users.map((u) => ({
    user: u,
    assignment: assignmentsByUser.get(u.id) ?? null,
  }))

  const pointsTarget = weeklyConfig?.points_target_per_person || 50
  const pointsEarned = weeklyScore?.points_earned || 0
  const today = new Date().toISOString().slice(0, 10)

  const distinctUserIds = [...new Set(pendingCompletionsToValidate.map((c) => c.user_id))]
  const pendingProgressByKey: Record<string, { count: number; min: number }> = {}
  distinctUserIds.forEach((uid) => {
    const comps = allCompletions.filter((c) => c.user_id === uid)
    const byTask = new Map<string, number>()
    comps.forEach((c) => byTask.set(c.task_id, (byTask.get(c.task_id) || 0) + 1))
    byTask.forEach((count, taskId) => {
      const pending = pendingCompletionsToValidate.find((p) => p.user_id === uid && p.task_id === taskId)
      const min = (pending?.task?.weekly_minimum ?? 1) as number
      if (pending?.task?.frequency === 'weekly' && min > 1) {
        pendingProgressByKey[`${uid}_${taskId}`] = { count, min }
      }
    })
  })

  return (
    <DashboardClient
      assignment={assignment}
      pointsTarget={pointsTarget}
      pointsEarned={pointsEarned}
      weeklyScores={currentWeekScores}
      completions={completions}
      pendingCompletionsToValidate={pendingCompletionsToValidate}
      pendingProgressByKey={pendingProgressByKey}
      today={today}
      userId={user.id}
      weekStartDate={weekStartDate}
      firstDayOfWeek={firstDayOfWeek}
      pendingSwaps={pendingSwaps}
      swaps={swapsMap}
      users={users}
      membersWithAssignments={membersWithAssignments}
      allCompletions={allCompletions}
      extraCompletions={extraCompletions}
      pendingExtraCompletions={pendingExtraCompletions}
    />
  )
}
