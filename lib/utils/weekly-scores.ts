import {
  getAllWeeklyScores,
  createOrUpdateWeeklyScore,
  getWeeklyConfig,
  createOrUpdateWeeklyConfig,
} from '@/lib/db/queries/weekly'
import { calculateNextWeekTargets, calculateCarriedOverPoints } from './points'
import { getWeekStartString, addDays } from './date'
import type { WeeklyScore } from '@/lib/db/schema'
import { requireHouseId } from '@/lib/db/queries/house-utils'

export async function processWeekEnd(currentWeekStart: string, baseTarget: number, userId: string) {
  const houseId = await requireHouseId(userId)
  const currentScores = await getAllWeeklyScores(currentWeekStart, userId)
  
  if (currentScores.length === 0) {
    return
  }

  const nextWeekStart = getWeekStartString(addDays(new Date(currentWeekStart), 7))
  const nextWeekConfig = await getWeeklyConfig(nextWeekStart, userId)
  const nextWeekBaseTarget = nextWeekConfig?.points_target_per_person || baseTarget

  const nextWeekTargets = calculateNextWeekTargets(
    currentScores.map((s) => s as WeeklyScore),
    nextWeekBaseTarget
  )
  const carriedOver = calculateCarriedOverPoints(
    currentScores.map((s) => s as WeeklyScore)
  )

  await createOrUpdateWeeklyConfig(nextWeekStart, nextWeekBaseTarget, userId)

  for (const score of currentScores) {
    const nextTarget = nextWeekTargets.get(score.user_id) || nextWeekBaseTarget
    const carriedOverPoints = carriedOver.get(score.user_id) || 0

    await createOrUpdateWeeklyScore(
      score.user_id,
      nextWeekStart,
      nextTarget,
      0,
      carriedOverPoints
    )
  }
}
