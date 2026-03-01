import type { WeeklyScore, Task } from '@/lib/db/schema'
import { getCompletionsByUserAndWeek } from '@/lib/db/queries/completions'
import { getExtraCompletionsByUserAndWeek } from '@/lib/db/queries/extra-completions'

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

/**
 * Computes effective points for a user in a week:
 * - Daily tasks: sum of each validated completion's points.
 * - Weekly tasks without weekly_minimum: add task.points once per completion (current behavior).
 * - Weekly tasks with weekly_minimum: add task.points only once when validated completions count >= weekly_minimum.
 * - Extra completions: sum of validated extra completions' points.
 */
export async function calculateEffectivePointsForWeek(
  userId: string,
  weekStartDate: string
): Promise<number> {
  const [completions, extraCompletions] = await Promise.all([
    getCompletionsByUserAndWeek(userId, weekStartDate),
    getExtraCompletionsByUserAndWeek(userId, weekStartDate),
  ])

  const validated = completions.filter((c) => c.status === 'validated')
  let total = 0

  const byTask = new Map<string, { task: Task; completions: typeof validated }>()
  for (const c of validated) {
    if (!c.task) continue
    if (!byTask.has(c.task_id)) byTask.set(c.task_id, { task: c.task, completions: [] })
    byTask.get(c.task_id)!.completions.push(c)
  }

  for (const { task, completions: taskCompletions } of byTask.values()) {
    if (task.frequency === 'daily') {
      total += taskCompletions.reduce((s, c) => s + c.points_earned, 0)
      continue
    }
    if (task.frequency === 'weekly') {
      const min = task.weekly_minimum ?? 1
      if (taskCompletions.length >= min) {
        total += task.points
      }
    }
  }

  const extraPoints = extraCompletions
    .filter((e) => e.status === 'validated')
    .reduce((s, e) => s + e.points_earned, 0)
  total += extraPoints

  return total
}
