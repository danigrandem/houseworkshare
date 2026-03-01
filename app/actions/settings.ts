'use server'

import { createClient } from '@/lib/supabase/server'
import { createOrUpdateWeeklyConfig, setWeeklyAssignment } from '@/lib/db/queries/weekly'
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

/** Asigna un grupo a cada miembro de la casa para la semana actual (rotación automática). */
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

export type AssignmentInput = { userId: string; groupId: string | null }

/** Guarda las asignaciones elegidas para la semana (solo dueño). */
export async function saveAssignmentsThisWeek(assignments: AssignmentInput[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('No autorizado')

  const house = await getCurrentUserHouse(user.id)
  if (!house) throw new Error('No tienes una casa asignada')
  const isOwner = house.members.some((m) => m.user_id === user.id && m.role === 'owner')
  if (!isOwner) throw new Error('Solo el dueño puede asignar grupos')

  const firstDay = house.week_start_day ?? 1
  const weekStartDate = getWeekStartString(undefined, firstDay)
  const memberIds = new Set(house.members.map((m) => m.user_id))

  for (const { userId, groupId } of assignments) {
    if (!memberIds.has(userId)) continue
    await setWeeklyAssignment(userId, weekStartDate, groupId)
  }
}

/** Devuelve la asignación sugerida por rotación (sin guardar) para prellenar el modal. */
export async function getSuggestedAssignments(): Promise<AssignmentInput[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const house = await getCurrentUserHouse(user.id)
  if (!house) return []
  const firstDay = house.week_start_day ?? 1
  const rotationWeeks = house.rotation_weeks ?? 1
  const weekStartDate = getWeekStartString(undefined, firstDay)
  const { getAllGroups } = await import('@/lib/db/queries/groups')
  const { getAllUsers, getAllWeeklyAssignments } = await import('@/lib/db/queries/weekly')
  const { getWeekStartString, addDays } = await import('@/lib/utils/date')

  const [groups, users, existingAssignments] = await Promise.all([
    getAllGroups(user.id),
    getAllUsers(user.id),
    getAllWeeklyAssignments(weekStartDate, user.id),
  ])
  if (groups.length === 0 || users.length === 0) return []

  const sortedGroups = groups.sort((a, b) => a.created_at.localeCompare(b.created_at))
  const sortedUsers = users.sort((a, b) => a.created_at.localeCompare(b.created_at))
  const existingMap = new Map(existingAssignments.map((a) => [a.user_id, a.task_group_id]))
  const weeksBack = Math.max(1, rotationWeeks)
  const previousWeekStart = getWeekStartString(addDays(new Date(weekStartDate), -7 * weeksBack), firstDay)
  const previousAssignments = await getAllWeeklyAssignments(previousWeekStart, user.id)
  const previousMap = new Map(previousAssignments.map((a) => [a.user_id, a.task_group_id]))

  const result: AssignmentInput[] = []
  for (let i = 0; i < sortedUsers.length; i++) {
    const u = sortedUsers[i]
    if (existingMap.has(u.id)) {
      result.push({ userId: u.id, groupId: existingMap.get(u.id) ?? null })
      continue
    }
    let groupIndex = 0
    if (previousMap.has(u.id)) {
      const prevId = previousMap.get(u.id)
      const idx = sortedGroups.findIndex((g) => g.id === prevId)
      if (idx >= 0) groupIndex = (idx + 1) % sortedGroups.length
    } else {
      groupIndex = i % sortedGroups.length
    }
    result.push({ userId: u.id, groupId: sortedGroups[groupIndex].id })
  }
  return result
}
