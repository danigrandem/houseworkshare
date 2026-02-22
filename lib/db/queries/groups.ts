import { createClient } from '@/lib/supabase/server'
import type { TaskGroup, TaskGroupWithTasks, Task } from '@/lib/db/schema'
import { requireHouseId } from './house-utils'

export async function getAllGroups(userId: string): Promise<TaskGroup[]> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('task_groups')
    .select('*')
    .eq('house_id', houseId)
    .order('name')

  if (error) throw error
  return data || []
}

export async function getGroupById(id: string): Promise<TaskGroupWithTasks | null> {
  const supabase = await createClient()
  const { data: group, error: groupError } = await supabase
    .from('task_groups')
    .select('*')
    .eq('id', id)
    .single()

  if (groupError) throw groupError
  if (!group) return null

  const { data: items, error: itemsError } = await supabase
    .from('task_group_items')
    .select('task_id')
    .eq('task_group_id', id)

  if (itemsError) throw itemsError

  const taskIds = items.map((item) => item.task_id)
  let tasks: Task[] = []

  if (taskIds.length > 0) {
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .in('id', taskIds)

    if (tasksError) throw tasksError
    tasks = tasksData || []
  }

  return {
    ...group,
    tasks,
  }
}

export async function createGroup(name: string, userId: string): Promise<TaskGroup> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('task_groups')
    .insert({ name, house_id: houseId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateGroup(id: string, name: string): Promise<TaskGroup> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_groups')
    .update({ name })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteGroup(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('task_groups')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function addTasksToGroup(groupId: string, taskIds: string[]): Promise<void> {
  const supabase = await createClient()
  const items = taskIds.map((taskId) => ({
    task_group_id: groupId,
    task_id: taskId,
  }))

  const { error } = await supabase
    .from('task_group_items')
    .insert(items)

  if (error) throw error
}

export async function removeTasksFromGroup(groupId: string, taskIds: string[]): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('task_group_items')
    .delete()
    .eq('task_group_id', groupId)
    .in('task_id', taskIds)

  if (error) throw error
}

export async function setGroupTasks(groupId: string, taskIds: string[]): Promise<void> {
  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from('task_group_items')
    .delete()
    .eq('task_group_id', groupId)

  if (deleteError) throw deleteError

  if (taskIds.length > 0) {
    const items = taskIds.map((taskId) => ({
      task_group_id: groupId,
      task_id: taskId,
    }))

    const { error: insertError } = await supabase
      .from('task_group_items')
      .insert(items)

    if (insertError) throw insertError
  }
}
