import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserHouse } from '@/lib/db/queries/houses'
import { getWeekStartString } from '@/lib/utils/date'
import { getWeeklyConfig } from '@/lib/db/queries/weekly'
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
  const config = await getWeeklyConfig(weekStartDate, user.id)

  return (
    <SettingsClient
      houseId={house.id}
      weekStartDate={weekStartDate}
      currentPointsTarget={config?.points_target_per_person || 50}
      weekStartDay={firstDayOfWeek}
      rotationWeeks={house.rotation_weeks ?? 1}
      isOwner={house.members.some((m) => m.user_id === user.id && m.role === 'owner')}
    />
  )
}
