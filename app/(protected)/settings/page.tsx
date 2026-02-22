import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  const weekStartDate = getWeekStartString()
  const config = await getWeeklyConfig(weekStartDate, user.id)

  return (
    <SettingsClient
      weekStartDate={weekStartDate}
      currentPointsTarget={config?.points_target_per_person || 50}
    />
  )
}
