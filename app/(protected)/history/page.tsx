import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserHouse } from '@/lib/db/queries/houses'
import { getAllWeeklyScores, getWeeklyAssignment } from '@/lib/db/queries/weekly'
import { getCompletionsByWeek } from '@/lib/db/queries/completions'
import HistoryClient from '@/components/history/HistoryClient'
import { getWeekStartString, addDays } from '@/lib/utils/date'
import type { WeeklyAssignmentWithGroup } from '@/lib/db/schema'

export default async function HistoryPage() {
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
  const currentWeek = getWeekStartString(undefined, firstDayOfWeek)
  const weeks: string[] = []
  for (let i = 1; i <= 8; i++) {
    const weekDate = getWeekStartString(addDays(currentWeek, -7 * i), firstDayOfWeek)
    weeks.push(weekDate)
  }

  const weeksData = await Promise.all(
    weeks.map(async (weekStart) => {
      const [scores, completions] = await Promise.all([
        getAllWeeklyScores(weekStart, user.id),
        getCompletionsByWeek(weekStart, user.id),
      ])
      const assignments: (WeeklyAssignmentWithGroup | null)[] = await Promise.all(
        scores.map((s) => getWeeklyAssignment(s.user_id, weekStart))
      )
      console.log("assignments", assignments)
      const scoresWithAssignments = scores.map((s, i) => ({
        ...s,
        assignment: assignments[i],
      }))
      return { weekStart, scores: scoresWithAssignments, completions }
    })
  )

  //console.log("weeksData", weeksData)

  return <HistoryClient weeksData={weeksData} userId={user.id} />
}
