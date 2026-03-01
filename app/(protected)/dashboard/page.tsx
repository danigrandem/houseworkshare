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
} from '@/lib/db/queries/weekly'
import { processWeekEnd } from '@/lib/utils/weekly-scores'
import { getCompletionsByUserAndWeek, getCompletionsByWeek, getPendingCompletionsToValidate } from '@/lib/db/queries/completions'
import { getExtraCompletionsByUserAndWeek, getPendingExtraCompletionsToValidate } from '@/lib/db/queries/extra-completions'
import { getPendingSwapsForUser, getActiveSwapForTask } from '@/lib/db/queries/swaps'
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
  const membersAssignments = await Promise.all(
    users.map((u) => getWeeklyAssignment(u.id, weekStartDate))
  )
  const membersWithAssignments = users.map((u, i) => ({
    user: u,
    assignment: membersAssignments[i],
  }))

  const pointsTarget = weeklyConfig?.points_target_per_person || 50
  const pointsEarned = weeklyScore?.points_earned || 0
  const today = new Date().toISOString().slice(0, 10)

  const tasks = assignment?.task_group?.tasks || []
  const activeSwaps = await Promise.all(
    tasks.map(async (task) => {
      const swap = await getActiveSwapForTask(task.id, weekStartDate, user.id)
      return { taskId: task.id, swap }
    })
  )

  const swapsMap = new Map(
    activeSwaps
      .filter((item) => item.swap)
      .map((item) => [
        item.taskId,
        {
          isSwapped: true,
          swapType: item.swap?.swap_type,
        },
      ])
  )

  return (
    <DashboardClient
      assignment={assignment}
      pointsTarget={pointsTarget}
      pointsEarned={pointsEarned}
      completions={completions}
      pendingCompletionsToValidate={pendingCompletionsToValidate}
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
