'use server'

import { createClient } from '@/lib/supabase/server'
import { createOrUpdateWeeklyConfig } from '@/lib/db/queries/weekly'
import { getCurrentUserHouse } from '@/lib/db/queries/houses'
import { rotateWeeklyAssignments } from '@/lib/utils/rotation'
import { getWeekStartString } from '@/lib/utils/date'

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

/** Asigna un grupo a cada miembro de la casa para la semana actual (rotación). */
export async function assignGroupsThisWeek() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const house = await getCurrentUserHouse(user.id)
  if (!house) throw new Error('No tienes una casa asignada')
  const firstDay = house.week_start_day ?? 1
  const rotationWeeks = house.rotation_weeks ?? 1
  const weekStartDate = getWeekStartString(undefined, firstDay)
  await rotateWeeklyAssignments(user.id, weekStartDate, firstDay, rotationWeeks)
}
