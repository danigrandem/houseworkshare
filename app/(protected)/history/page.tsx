import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllWeeklyScores } from '@/lib/db/queries/weekly'
import { getCompletionsByWeek } from '@/lib/db/queries/completions'
import HistoryClient from '@/components/history/HistoryClient'
import { getWeekStartString, addDays } from '@/lib/utils/date'

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }
  console.log("amor2")
  const currentWeek = getWeekStartString()
  const weeks = []

  for (let i = 1; i <= 8; i++) {
    const weekDate = getWeekStartString(addDays(new Date(currentWeek), -7 * i))
    weeks.push(weekDate)
  }

  const weeksData = await Promise.all(
    weeks.map(async (weekStart) => {
      const [scores, completions] = await Promise.all([
        getAllWeeklyScores(weekStart, user.id),
        getCompletionsByWeek(weekStart, user.id),
      ])
      return { weekStart, scores, completions }
    })
  )

  return <HistoryClient weeksData={weeksData} />
}
