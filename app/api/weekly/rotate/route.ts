import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserHouse } from '@/lib/db/queries/houses'
import { getWeekStartString } from '@/lib/utils/date'
import { rotateWeeklyAssignments } from '@/lib/utils/rotation'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const house = await getCurrentUserHouse(user.id)
    const firstDayOfWeek = house?.week_start_day ?? 1
    const rotationWeeks = house?.rotation_weeks ?? 1
    const { weekStartDate } = await request.json().catch(() => ({}))
    const targetWeek = weekStartDate || getWeekStartString(undefined, firstDayOfWeek)
    await rotateWeeklyAssignments(user.id, targetWeek, firstDayOfWeek, rotationWeeks)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error rotating assignments:', error)
    return NextResponse.json(
      { error: 'Error rotating assignments' },
      { status: 500 }
    )
  }
}
