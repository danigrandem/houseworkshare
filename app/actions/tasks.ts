'use server'

import { createClient } from '@/lib/supabase/server'
import { createTask, updateTask, deleteTask as deleteTaskQuery } from '@/lib/db/queries/tasks'

export async function createTaskAction(name: string, points: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return await createTask(name, points, user.id)
}

export async function updateTaskAction(id: string, name: string, points: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return await updateTask(id, name, points)
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
