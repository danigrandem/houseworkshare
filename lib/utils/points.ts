import type { WeeklyScore } from '@/lib/db/schema'

export type PointsCalculation = {
  userId: string
  pointsEarned: number
  pointsTarget: number
  deficit: number
  surplus: number
}

export function calculatePointsForUsers(scores: WeeklyScore[]): PointsCalculation[] {
  return scores.map((score) => {
    const deficit = Math.max(0, score.points_target - score.points_earned)
    const surplus = Math.max(0, score.points_earned - score.points_target)
    return {
      userId: score.user_id,
      pointsEarned: score.points_earned,
      pointsTarget: score.points_target,
      deficit,
      surplus,
    }
  })
}

export function calculateNextWeekTargets(
  currentWeekScores: WeeklyScore[],
  baseTarget: number
): Map<string, number> {
  const calculations = calculatePointsForUsers(currentWeekScores)
  const totalDeficit = calculations.reduce((sum, calc) => sum + calc.deficit, 0)
  const totalSurplus = calculations.reduce((sum, calc) => sum + calc.surplus, 0)
  const totalUsers = calculations.length

  const nextWeekTargets = new Map<string, number>()

  calculations.forEach((calc) => {
    let nextTarget = baseTarget

    if (calc.deficit > 0) {
      nextTarget += calc.deficit
    }

    if (totalDeficit > 0 && calc.deficit === 0) {
      const penaltyPerUser = Math.floor(totalDeficit / (totalUsers - 1))
      nextTarget = Math.max(0, nextTarget - penaltyPerUser)
    }

    if (totalSurplus > 0 && calc.surplus === 0 && calc.deficit > 0) {
      const compensationPerUser = Math.floor(totalSurplus / calculations.filter((c) => c.deficit > 0).length)
      nextTarget = Math.max(0, nextTarget - compensationPerUser)
    }

    nextWeekTargets.set(calc.userId, nextTarget)
  })

  return nextWeekTargets
}

export function calculateCarriedOverPoints(
  currentWeekScores: WeeklyScore[]
): Map<string, number> {
  const calculations = calculatePointsForUsers(currentWeekScores)
  const carriedOver = new Map<string, number>()

  calculations.forEach((calc) => {
    if (calc.deficit > 0) {
      carriedOver.set(calc.userId, calc.deficit)
    } else {
      carriedOver.set(calc.userId, 0)
    }
  })

  return carriedOver
}
