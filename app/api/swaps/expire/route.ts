import { NextResponse } from 'next/server'
import { expireTemporarySwaps } from '@/lib/db/queries/swaps'

export async function POST() {
  try {
    await expireTemporarySwaps()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error expiring swaps:', error)
    return NextResponse.json(
      { error: 'Error expiring swaps' },
      { status: 500 }
    )
  }
}
