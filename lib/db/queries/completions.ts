import { createClient } from '@/lib/supabase/server'
import type { TaskCompletion, TaskCompletionWithTask, Task } from '@/lib/db/schema'
import { requireHouseId } from './house-utils'

export async function createTaskCompletion(
  taskId: string,
  userId: string,
  weekStartDate: string,
  pointsEarned: number,
  completionDate: string
): Promise<TaskCompletion> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('task_completions')
    .insert({
      task_id: taskId,
      user_id: userId,
      week_start_date: weekStartDate,
      points_earned: pointsEarned,
      house_id: houseId,
      completed_at: new Date().toISOString(),
      status: 'pending',
      completion_date: completionDate,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function validateTaskCompletion(completionId: string, validatorUserId: string): Promise<void> {
  const supabase = await createClient()
  const houseId = await requireHouseId(validatorUserId)
  
  const { data: completion, error: fetchError } = await supabase
    .from('task_completions')
    .select('id, user_id, house_id')
    .eq('id', completionId)
    .eq('house_id', houseId)
    .single()

  if (fetchError || !completion) throw new Error('Completado no encontrado')
  if (completion.user_id === validatorUserId) throw new Error('No puedes validar tu propio completado')

  const { error } = await supabase
    .from('task_completions')
    .update({
      status: 'validated',
      validated_at: new Date().toISOString(),
      validated_by: validatorUserId,
    })
    .eq('id', completionId)

  if (error) throw error
}

export async function getCompletionsByWeek(
  weekStartDate: string,
  userId: string
): Promise<TaskCompletionWithTask[]> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('task_completions')
    .select(`
      *,
      task:tasks(*)
    `)
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)
    .order('completed_at', { ascending: false })

  if (error) throw error
  return (data || []).map((item) => ({
    ...item,
    task: item.task as Task,
  }))
}

export async function getCompletionsByUserAndWeek(
  userId: string,
  weekStartDate: string
): Promise<TaskCompletionWithTask[]> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('task_completions')
    .select(`
      *,
      task:tasks(*)
    `)
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)
    .order('completed_at', { ascending: false })

  if (error) throw error
  return (data || []).map((item) => ({
    ...item,
    task: item.task as Task,
  }))
}

export async function deleteTaskCompletion(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('task_completions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getTaskCompletionsByTask(
  taskId: string,
  weekStartDate: string,
  userId: string
): Promise<TaskCompletion[]> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('task_completions')
    .select('*')
    .eq('task_id', taskId)
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)
    .order('completed_at', { ascending: false })

  if (error) throw error
  return data || []
}

/** Completions pending validation by other house members (for current user to validate) */
export async function getPendingCompletionsToValidate(
  weekStartDate: string,
  userId: string
): Promise<TaskCompletionWithTask[]> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('task_completions')
    .select(`
      *,
      task:tasks(*)
    `)
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)
    .eq('status', 'pending')
    .neq('user_id', userId)
    .order('completed_at', { ascending: false })

  if (error) throw error
  return (data || []).map((item) => {
    const row = item as unknown as { task: Task | Task[] }
    const task = Array.isArray(row.task) ? row.task[0] : row.task
    return { ...item, task }
  })
}
