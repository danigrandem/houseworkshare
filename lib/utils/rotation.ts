import { getAllGroups } from '@/lib/db/queries/groups'
import { getAllUsers, getAllWeeklyAssignments, createWeeklyAssignment } from '@/lib/db/queries/weekly'
import { getWeekStartString } from './date'
import type { TaskGroup, User } from '@/lib/db/schema'
import { requireHouseId } from '@/lib/db/queries/house-utils'

export async function rotateWeeklyAssignments(
  userId: string,
  weekStartDate?: string,
  firstDayOfWeek: number = 1
) {
  const targetWeek = weekStartDate || getWeekStartString(undefined, firstDayOfWeek)
  const houseId = await requireHouseId(userId)
  
  const [groups, users, existingAssignments] = await Promise.all([
    getAllGroups(userId),
    getAllUsers(userId),
    getAllWeeklyAssignments(targetWeek, userId),
  ])

  if (groups.length === 0 || users.length === 0) {
    return
  }

  const sortedGroups = groups.sort((a, b) => a.created_at.localeCompare(b.created_at))
  const sortedUsers = users.sort((a, b) => a.created_at.localeCompare(b.created_at))

  const existingMap = new Map(
    existingAssignments.map((a) => [a.user_id, a.task_group_id])
  )

  const previousWeek = new Date(targetWeek)
  previousWeek.setDate(previousWeek.getDate() - 7)
  const previousWeekStart = getWeekStartString(previousWeek, firstDayOfWeek)
  const previousAssignments = await getAllWeeklyAssignments(previousWeekStart, userId)
  const previousMap = new Map(
    previousAssignments.map((a) => [a.user_id, a.task_group_id])
  )

  const assignments = []

  for (let i = 0; i < sortedUsers.length; i++) {
    const user = sortedUsers[i]
    
    if (existingMap.has(user.id)) {
      continue
    }

    let groupIndex = 0
    if (previousMap.has(user.id)) {
      const previousGroupId = previousMap.get(user.id)
      const previousIndex = sortedGroups.findIndex((g) => g.id === previousGroupId)
      if (previousIndex >= 0) {
        groupIndex = (previousIndex + 1) % sortedGroups.length
      }
    } else {
      groupIndex = i % sortedGroups.length
    }

    const assignedGroup = sortedGroups[groupIndex]
    assignments.push({
      userId: user.id,
      groupId: assignedGroup.id,
    })
  }

  for (const assignment of assignments) {
    await createWeeklyAssignment(assignment.userId, targetWeek, assignment.groupId)
  }
}
