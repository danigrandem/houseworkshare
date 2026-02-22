import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    const { weekStartDate } = await request.json().catch(() => ({}))
    await rotateWeeklyAssignments(user.id, weekStartDate)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error rotating assignments:', error)
    return NextResponse.json(
      { error: 'Error rotating assignments' },
      { status: 500 }
    )
  }
}
