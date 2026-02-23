'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createTaskCompletion as createCompletion,
  getCompletionsByUserAndWeek,
  validateTaskCompletion as validateCompletionQuery,
} from '@/lib/db/queries/completions'
import { getTaskById } from '@/lib/db/queries/tasks'
import {
  updateWeeklyScorePoints,
} from '@/lib/db/queries/weekly'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

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

  const task = await getTaskById(taskId)
  if (!task) throw new Error('Tarea no encontrada')
  const completionDate = task.frequency === 'daily' ? todayISO() : weekStartDate

  await createCompletion(taskId, userId, weekStartDate, points, completionDate)

  const completions = await getCompletionsByUserAndWeek(userId, weekStartDate)
  const totalPoints = completions
    .filter((c) => c.status === 'validated')
    .reduce((sum, c) => sum + c.points_earned, 0)
  await updateWeeklyScorePoints(userId, weekStartDate, totalPoints)
}

export async function validateTaskCompletion(completionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: completion } = await supabase
    .from('task_completions')
    .select('user_id, week_start_date')
    .eq('id', completionId)
    .single()

  if (!completion) throw new Error('Completado no encontrado')

  await validateCompletionQuery(completionId, user.id)

  const completions = await getCompletionsByUserAndWeek(completion.user_id, completion.week_start_date)
  const totalPoints = completions
    .filter((c) => c.status === 'validated')
    .reduce((sum, c) => sum + c.points_earned, 0)
  await updateWeeklyScorePoints(completion.user_id, completion.week_start_date, totalPoints)
}
