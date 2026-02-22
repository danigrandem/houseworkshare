'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createGroup as createGroupQuery,
  updateGroup as updateGroupQuery,
  deleteGroup as deleteGroupQuery,
  setGroupTasks,
} from '@/lib/db/queries/groups'

export async function createGroup(name: string, taskIds: string[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const group = await createGroupQuery(name, user.id)
  if (taskIds.length > 0) {
    await setGroupTasks(group.id, taskIds)
  }
  return group
}

export async function updateGroup(id: string, name: string, taskIds: string[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  await updateGroupQuery(id, name)
  await setGroupTasks(id, taskIds)
  return { id, name }
}

export async function deleteGroup(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return await deleteGroupQuery(id)
}
