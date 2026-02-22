import { createClient } from '@/lib/supabase/server'
import type { Task } from '@/lib/db/schema'
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

export async function createTask(name: string, points: number, userId: string): Promise<Task> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({ name, points, house_id: houseId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTask(id: string, name: string, points: number): Promise<Task> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .update({ name, points })
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
