'use server'

import { createClient } from '@/lib/supabase/server'
import type { TaskFrequency } from '@/lib/db/schema'
import { createTask, updateTask, deleteTask as deleteTaskQuery } from '@/lib/db/queries/tasks'

export async function createTaskAction(name: string, points: number, frequency: TaskFrequency = 'weekly') {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return await createTask(name, points, user.id, frequency)
}

export async function updateTaskAction(id: string, name: string, points: number, frequency?: TaskFrequency) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return await updateTask(id, name, points, frequency)
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return await deleteTaskQuery(id)
}
