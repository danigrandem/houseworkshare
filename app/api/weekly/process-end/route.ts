import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processWeekEnd } from '@/lib/utils/weekly-scores'
import { getWeeklyConfig } from '@/lib/db/queries/weekly'
import { getWeekStartString } from '@/lib/utils/date'

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
    const targetWeek = weekStartDate || getWeekStartString()
    
    const config = await getWeeklyConfig(targetWeek, user.id)
    const baseTarget = config?.points_target_per_person || 50

    await processWeekEnd(targetWeek, baseTarget, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing week end:', error)
    return NextResponse.json(
      { error: 'Error processing week end' },
      { status: 500 }
    )
  }
}
