'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createTaskCompletion as createCompletion,
  getCompletionsByUserAndWeek,
} from '@/lib/db/queries/completions'
import {
  getWeeklyScore,
  updateWeeklyScorePoints,
} from '@/lib/db/queries/weekly'

export async function createTaskCompletion(
  taskId: string,
  userId: string,
  weekStartDate: string,
  points: number
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    throw new Error('Unauthorized')
  }

  await createCompletion(taskId, userId, weekStartDate, points)

  const completions = await getCompletionsByUserAndWeek(userId, weekStartDate)
  const totalPoints = completions.reduce((sum, c) => sum + c.points_earned, 0)

  await updateWeeklyScorePoints(userId, weekStartDate, totalPoints)
}
