import { createClient } from '@/lib/supabase/server'
import type {
  WeeklyConfig,
  WeeklyAssignment,
  WeeklyAssignmentWithGroup,
  WeeklyScore,
  WeeklyScoreWithUser,
  TaskGroupWithTasks,
  User,
} from '@/lib/db/schema'
import { requireHouseId } from './house-utils'

export async function getWeeklyConfig(weekStartDate: string, userId: string): Promise<WeeklyConfig | null> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('weekly_config')
    .select('*')
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createOrUpdateWeeklyConfig(
  weekStartDate: string,
  pointsTargetPerPerson: number,
  userId: string
): Promise<WeeklyConfig> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('weekly_config')
    .upsert(
      {
        week_start_date: weekStartDate,
        points_target_per_person: pointsTargetPerPerson,
        house_id: houseId,
      },
      {
        onConflict: 'house_id,week_start_date',
      }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getWeeklyAssignment(
  userId: string,
  weekStartDate: string
): Promise<WeeklyAssignmentWithGroup | null> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data: assignment, error: assignmentError } = await supabase
    .from('weekly_assignments')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)
    .single()

  if (assignmentError && assignmentError.code !== 'PGRST116') throw assignmentError
  if (!assignment || !assignment.task_group_id) return null

  const { data: group, error: groupError } = await supabase
    .from('task_groups')
    .select('*')
    .eq('id', assignment.task_group_id)
    .single()

  if (groupError) throw groupError

  const { data: items, error: itemsError } = await supabase
    .from('task_group_items')
    .select('task_id')
    .eq('task_group_id', assignment.task_group_id)

  if (itemsError) throw itemsError

  const taskIds = items.map((item) => item.task_id)
  let tasks = []

  if (taskIds.length > 0) {
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .in('id', taskIds)

    if (tasksError) throw tasksError
    tasks = tasksData || []
  }

  return {
    ...assignment,
    task_group: {
      ...group,
      tasks,
    } as TaskGroupWithTasks,
  }
}

export async function createWeeklyAssignment(
  userId: string,
  weekStartDate: string,
  taskGroupId: string | null
): Promise<WeeklyAssignment> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('weekly_assignments')
    .insert({
      user_id: userId,
      week_start_date: weekStartDate,
      task_group_id: taskGroupId,
      house_id: houseId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function clearWeeklyAssignment(
  userId: string,
  weekStartDate: string
): Promise<void> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)

  const { error } = await supabase
    .from('weekly_assignments')
    .update({ task_group_id: null })
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)

  if (error) throw error
}

/** Set or update assignment for one user. Use null to clear. */
export async function setWeeklyAssignment(
  userId: string,
  weekStartDate: string,
  taskGroupId: string | null
): Promise<void> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)

  if (taskGroupId === null) {
    await clearWeeklyAssignment(userId, weekStartDate)
    return
  }

  const { data: existing } = await supabase
    .from('weekly_assignments')
    .select('id')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('weekly_assignments')
      .update({ task_group_id: taskGroupId })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    await createWeeklyAssignment(userId, weekStartDate, taskGroupId)
  }
}

export async function getAllWeeklyAssignments(
  weekStartDate: string,
  userId: string
): Promise<WeeklyAssignment[]> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('weekly_assignments')
    .select('*')
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)

  if (error) throw error
  return data || []
}

export async function getWeeklyScore(
  userId: string,
  weekStartDate: string
): Promise<WeeklyScore | null> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('weekly_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createOrUpdateWeeklyScore(
  userId: string,
  weekStartDate: string,
  pointsTarget: number,
  pointsEarned: number = 0,
  pointsCarriedOver: number = 0
): Promise<WeeklyScore> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('weekly_scores')
    .upsert(
      {
        user_id: userId,
        week_start_date: weekStartDate,
        points_target: pointsTarget,
        points_earned: pointsEarned,
        points_carried_over: pointsCarriedOver,
        house_id: houseId,
      },
      {
        onConflict: 'house_id,user_id,week_start_date',
      }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateWeeklyScorePoints(
  userId: string,
  weekStartDate: string,
  pointsEarned: number
): Promise<WeeklyScore> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('weekly_scores')
    .update({ points_earned: pointsEarned })
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAllWeeklyScores(
  weekStartDate: string,
  userId: string
): Promise<WeeklyScoreWithUser[]> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('weekly_scores')
    .select(`
      *,
      user:users(*)
    `)
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)
    .order('points_earned', { ascending: false })

  if (error) throw error
  return (data || []).map((item) => {
    const row = item as unknown as { user: User | User[] }
    const user = Array.isArray(row.user) ? row.user[0] : row.user
    return { ...item, user }
  })
}

export async function getAllUsers(userId: string): Promise<User[]> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data: members, error: membersError } = await supabase
    .from('house_members')
    .select('user:users(*)')
    .eq('house_id', houseId)

  if (membersError) throw membersError
  return (members || []).map((m) => {
    const row = m as unknown as { user: User | User[] }
    const user = Array.isArray(row.user) ? row.user[0] : row.user
    return user
  })
}
