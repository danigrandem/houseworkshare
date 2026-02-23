'use server'

import { createClient } from '@/lib/supabase/server'
import { createOrUpdateWeeklyConfig } from '@/lib/db/queries/weekly'

export async function updateWeeklyConfig(weekStartDate: string, pointsTargetPerPerson: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return await createOrUpdateWeeklyConfig(weekStartDate, pointsTargetPerPerson, user.id)
}
