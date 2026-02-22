import { createClient } from '@/lib/supabase/server'
import type { TaskSwap, TaskSwapWithTask, SwapType, SwapStatus, User, Task } from '@/lib/db/schema'
import { addDays, isSameDay } from '@/lib/utils/date'
import { requireHouseId } from './house-utils'

export async function createTaskSwap(
  taskId: string,
  fromUserId: string,
  toUserId: string,
  weekStartDate: string,
  swapType: SwapType,
  swapDate?: string
): Promise<TaskSwap> {
  const supabase = await createClient()
  const houseId = await requireHouseId(fromUserId)
  
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)
  
  const { data, error } = await supabase
    .from('task_swaps')
    .insert({
      task_id: taskId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      week_start_date: weekStartDate,
      swap_type: swapType,
      swap_date: swapDate || null,
      status: 'pending',
      house_id: houseId,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTaskSwapById(id: string): Promise<TaskSwapWithTask | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_swaps')
    .select(`
      *,
      task:tasks(*),
      from_user:users!task_swaps_from_user_id_fkey(*),
      to_user:users!task_swaps_to_user_id_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  if (!data) return null

  return {
    ...data,
    task: data.task as Task,
    from_user: data.from_user as User,
    to_user: data.to_user as User,
  }
}

export async function getPendingSwapsForUser(userId: string): Promise<TaskSwapWithTask[]> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('task_swaps')
    .select(`
      *,
      task:tasks(*),
      from_user:users!task_swaps_from_user_id_fkey(*),
      to_user:users!task_swaps_to_user_id_fkey(*)
    `)
    .eq('to_user_id', userId)
    .eq('house_id', houseId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('requested_at', { ascending: false })

  if (error) throw error
  return (data || []).map((item) => ({
    ...item,
    task: item.task as Task,
    from_user: item.from_user as User,
    to_user: item.to_user as User,
  }))
}

export async function getSentSwapsForUser(userId: string): Promise<TaskSwapWithTask[]> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('task_swaps')
    .select(`
      *,
      task:tasks(*),
      from_user:users!task_swaps_from_user_id_fkey(*),
      to_user:users!task_swaps_to_user_id_fkey(*)
    `)
    .eq('from_user_id', userId)
    .eq('house_id', houseId)
    .in('status', ['pending', 'accepted', 'rejected'])
    .order('requested_at', { ascending: false })

  if (error) throw error
  return (data || []).map((item) => ({
    ...item,
    task: item.task as Task,
    from_user: item.from_user as User,
    to_user: item.to_user as User,
  }))
}

export async function acceptTaskSwap(id: string): Promise<TaskSwap> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_swaps')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function rejectTaskSwap(id: string): Promise<TaskSwap> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_swaps')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getActiveSwapForTask(
  taskId: string,
  weekStartDate: string,
  userId: string,
  currentDate?: Date
): Promise<TaskSwap | null> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  const date = currentDate || new Date()
  const dateString = date.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('task_swaps')
    .select('*')
    .eq('task_id', taskId)
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)
    .eq('status', 'accepted')
    .or(`swap_date.is.null,swap_date.eq.${dateString}`)

  if (error) throw error
  
  if (!data || data.length === 0) return null

  const swap = data[0]

  if (swap.swap_type === 'temporary' && swap.swap_date) {
    const swapDate = new Date(swap.swap_date)
    if (!isSameDay(date, swapDate)) {
      return null
    }
  }

  return swap
}

export async function expireTemporarySwaps(): Promise<void> {
  const supabase = await createClient()
  const today = new Date()
  const todayString = today.toISOString().split('T')[0]
  const yesterday = addDays(today, -1)
  const yesterdayString = yesterday.toISOString().split('T')[0]

  const { error } = await supabase
    .from('task_swaps')
    .update({ status: 'expired' })
    .eq('swap_type', 'temporary')
    .eq('status', 'accepted')
    .lt('swap_date', todayString)
    .neq('swap_date', yesterdayString)

  if (error) throw error
}

export async function getSwapsByWeek(weekStartDate: string, userId: string): Promise<TaskSwapWithTask[]> {
  const supabase = await createClient()
  const houseId = await requireHouseId(userId)
  
  const { data, error } = await supabase
    .from('task_swaps')
    .select(`
      *,
      task:tasks(*),
      from_user:users!task_swaps_from_user_id_fkey(*),
      to_user:users!task_swaps_to_user_id_fkey(*)
    `)
    .eq('week_start_date', weekStartDate)
    .eq('house_id', houseId)
    .in('status', ['accepted', 'expired'])
    .order('requested_at', { ascending: false })

  if (error) throw error
  return (data || []).map((item) => ({
    ...item,
    task: item.task as Task,
    from_user: item.from_user as User,
    to_user: item.to_user as User,
  }))
}
