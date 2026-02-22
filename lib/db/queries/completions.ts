import { createClient } from '@/lib/supabase/server'
import type { TaskCompletion, TaskCompletionWithTask, Task } from '@/lib/db/schema'
import { requireHouseId } from './house-utils'

export async function createTaskCompletion(
  taskId: string,
  userId: string,
  weekStartDate: string,
  pointsEarned: number
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
    })
    .select()
    .single()

  if (error) throw error
  return data
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
