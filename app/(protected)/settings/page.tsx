import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserHouse } from '@/lib/db/queries/houses'
import { getWeekStartString } from '@/lib/utils/date'
import { getWeeklyConfig, getAllWeeklyAssignments } from '@/lib/db/queries/weekly'
import { getAllGroups } from '@/lib/db/queries/groups'
import type { User } from '@/lib/db/schema'
import type { TaskGroup } from '@/lib/db/schema'
import SettingsClient from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const house = await getCurrentUserHouse(user.id)
  if (!house) redirect('/setup-house')

  const firstDayOfWeek = house.week_start_day ?? 1
  const weekStartDate = getWeekStartString(undefined, firstDayOfWeek)
  const isOwner = house.members.some((m) => m.user_id === user.id && m.role === 'owner')

  const [config, groups, currentAssignments] = await Promise.all([
    getWeeklyConfig(weekStartDate, user.id),
    getAllGroups(user.id),
    isOwner ? getAllWeeklyAssignments(weekStartDate, user.id) : Promise.resolve([]),
  ])

  const users: User[] = house.members.map((m) => m.user).filter(Boolean)
  const assignmentByUser = new Map(
    currentAssignments.map((a) => [a.user_id, a.task_group_id])
  )

  return (
    <SettingsClient
      houseId={house.id}
      weekStartDate={weekStartDate}
      currentPointsTarget={config?.points_target_per_person || 50}
      weekStartDay={firstDayOfWeek}
      rotationWeeks={house.rotation_weeks ?? 1}
      isOwner={isOwner}
      users={users}
      groups={groups as TaskGroup[]}
      initialAssignments={users.map((u) => ({
        userId: u.id,
        groupId: assignmentByUser.get(u.id) ?? null,
      }))}
    />
  )
}
