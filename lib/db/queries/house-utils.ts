import { createClient } from '@/lib/supabase/server'
import { getCurrentUserHouse } from './houses'

export async function getCurrentUserHouseId(userId: string): Promise<string | null> {
  const house = await getCurrentUserHouse(userId)
  return house?.id || null
}

export async function requireHouseId(userId: string): Promise<string> {
  const houseId = await getCurrentUserHouseId(userId)
  if (!houseId) {
    throw new Error('User is not a member of any house')
  }
  return houseId
}
