import { createClient } from '@/lib/supabase/server'
import type { Task, TaskFrequency } from '@/lib/db/schema'
import { requireHouseId } from './house-utils'

export async function getAllTasks(userId: string): Promise<Task[]> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('house_id', houseId)
    .order('name')

  if (error) throw error
  return data || []
}

export async function getTaskById(id: string): Promise<Task | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createTask(
  name: string,
  points: number,
  userId: string,
  frequency: TaskFrequency = 'weekly',
  weeklyMinimum?: number | null
): Promise<Task> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  const payload: Record<string, unknown> = { name, points, house_id: houseId, frequency }
  if (frequency === 'weekly' && weeklyMinimum !== undefined) payload.weekly_minimum = weeklyMinimum
  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTask(
  id: string,
  name: string,
  points: number,
  frequency?: TaskFrequency,
  weeklyMinimum?: number | null
): Promise<Task> {
  const supabase = await createClient()
  const updates: Record<string, unknown> = { name, points }
  if (frequency !== undefined) updates.frequency = frequency
  if (weeklyMinimum !== undefined) updates.weekly_minimum = weeklyMinimum
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) throw error
}
