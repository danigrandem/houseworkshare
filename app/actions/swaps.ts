'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createTaskSwap,
  acceptTaskSwap as acceptSwap,
  rejectTaskSwap as rejectSwap,
} from '@/lib/db/queries/swaps'

export async function requestTaskSwap(
  taskId: string,
  fromUserId: string,
  toUserId: string,
  weekStartDate: string,
  swapType: 'temporary' | 'permanent',
  swapDate?: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== fromUserId) {
    throw new Error('Unauthorized')
  }

  return await createTaskSwap(taskId, fromUserId, toUserId, weekStartDate, swapType, swapDate)
}

export async function acceptTaskSwap(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return await acceptSwap(id)
}

export async function rejectTaskSwap(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return await rejectSwap(id)
}
