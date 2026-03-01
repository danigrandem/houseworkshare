'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createTaskCompletion as createCompletion,
  validateTaskCompletion as validateCompletionQuery,
} from '@/lib/db/queries/completions'
import { getTaskById } from '@/lib/db/queries/tasks'
import {
  updateWeeklyScorePoints,
  clearWeeklyAssignment,
} from '@/lib/db/queries/weekly'
import { calculateEffectivePointsForWeek } from '@/lib/utils/points'
import { getCurrentUserHouse } from '@/lib/db/queries/houses'
import { getWeekStartString } from '@/lib/utils/date'

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

  const totalPoints = await calculateEffectivePointsForWeek(userId, weekStartDate)
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

  const totalPoints = await calculateEffectivePointsForWeek(completion.user_id, completion.week_start_date)
  await updateWeeklyScorePoints(completion.user_id, completion.week_start_date, totalPoints)
}

export async function clearMyAssignment() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const house = await getCurrentUserHouse(user.id)
  if (!house) throw new Error('Casa no encontrada')

  const firstDayOfWeek = house.week_start_day ?? 1
  const weekStartDate = getWeekStartString(undefined, firstDayOfWeek)
  await clearWeeklyAssignment(user.id, weekStartDate)
}

export async function createExtraCompletionAction(
  weekStartDate: string,
  name: string,
  points: number
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { createExtraCompletion } = await import('@/lib/db/queries/extra-completions')
  await createExtraCompletion(user.id, weekStartDate, name, points)

  const totalPoints = await calculateEffectivePointsForWeek(user.id, weekStartDate)
  await updateWeeklyScorePoints(user.id, weekStartDate, totalPoints)
}

export async function validateExtraCompletionAction(completionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: row } = await supabase
    .from('extra_completions')
    .select('user_id, week_start_date')
    .eq('id', completionId)
    .single()
  if (!row) throw new Error('Completado extra no encontrado')

  const { validateExtraCompletion } = await import('@/lib/db/queries/extra-completions')
  await validateExtraCompletion(completionId, user.id)

  const totalPoints = await calculateEffectivePointsForWeek(row.user_id, row.week_start_date)
  await updateWeeklyScorePoints(row.user_id, row.week_start_date, totalPoints)
}
