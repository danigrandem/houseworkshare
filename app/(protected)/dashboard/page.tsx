import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserHouse } from '@/lib/db/queries/houses'
import { getWeekStartString } from '@/lib/utils/date'
import {
  getWeeklyAssignment,
  getWeeklyScore,
  getWeeklyConfig,
  getAllUsers,
} from '@/lib/db/queries/weekly'
import { getCompletionsByUserAndWeek } from '@/lib/db/queries/completions'
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

  const weekStartDate = getWeekStartString()
  const [assignment, weeklyScore, weeklyConfig, completions, pendingSwaps, users] = await Promise.all([
    getWeeklyAssignment(user.id, weekStartDate),
    getWeeklyScore(user.id, weekStartDate),
    getWeeklyConfig(weekStartDate, user.id),
    getCompletionsByUserAndWeek(user.id, weekStartDate),
    getPendingSwapsForUser(user.id),
    getAllUsers(user.id),
  ])

  const pointsTarget = weeklyConfig?.points_target_per_person || 50
  const pointsEarned = weeklyScore?.points_earned || 0

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
      userId={user.id}
      weekStartDate={weekStartDate}
      pendingSwaps={pendingSwaps}
      swaps={swapsMap}
      users={users}
    />
  )
}
