'use client'

import type { Task } from '@/lib/db/schema'
import { formatDateTime } from '@/lib/utils/date'
import TaskFrequencyTag from './TaskFrequencyTag'

type TaskCardProps = {
  task: Task
  completed: boolean
  completedAt?: string
  completionStatus?: 'pending' | 'validated'
  /** For weekly tasks with weekly_minimum: number of completions this week (to show progress) */
  weeklyCompletionCount?: number
  onComplete?: () => void
  /** Deshacer última realización de esta tarea (solo semanales con realizaciones) */
  onUndoLast?: () => void
  onSwap?: () => void
  isSwapped?: boolean
  swapType?: 'temporary' | 'permanent'
  loading?: boolean
  undoing?: boolean
}

export default function TaskCard({
  task,
  completed,
  completedAt,
  completionStatus,
  weeklyCompletionCount,
  onComplete,
  onUndoLast,
  onSwap,
  isSwapped = false,
  swapType,
  loading = false,
  undoing = false,
}: TaskCardProps) {
  const min = task.frequency === 'weekly' ? (task.weekly_minimum ?? 1) : 0
  const showProgress = task.frequency === 'weekly' && min > 0 && weeklyCompletionCount !== undefined
  const progressReached = showProgress && weeklyCompletionCount >= min
  /** Con objetivo mínimo: permitir marcar otra realización hasta alcanzar el mínimo */
  const canCompleteAgain = task.frequency === 'weekly' && min > 1 && (weeklyCompletionCount ?? 0) < min
  const showCompleteButton = onComplete && (!completed || canCompleteAgain)

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex items-start justify-between flex-col xl:flex-row gap-4">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900">{task.name}</h3>
            <TaskFrequencyTag frequency={task.frequency} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {task.points} puntos
            {showProgress && (
              <span className="ml-2">
                — <strong>{weeklyCompletionCount}/{min}</strong> realizaciones
                {progressReached && <span className="text-green-600 ml-1">✓</span>}
              </span>
            )}
          </p>
          {min > 1 && (
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <div className="w-full bg-gray-200 rounded-full h-1.5 xl:max-w-[120px]">
                <div
                  className={`h-1.5 rounded-full ${progressReached ? 'bg-green-600' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, (weeklyCompletionCount ?? 0) / min * 100)}%` }}
                />
              </div>
              {weeklyCompletionCount != null && weeklyCompletionCount > 0 && onUndoLast && (
                <button
                  type="button"
                  onClick={onUndoLast}
                  disabled={undoing}
                  className="text-xs text-gray-500 hover:text-red-600 underline disabled:opacity-50"
                >
                  {undoing ? 'Quitando...' : 'Deshacer última'}
                </button>
              )}
            </div>
          )}
          {task.frequency === 'weekly' && (weeklyCompletionCount ?? 0) > 0 && onUndoLast && min === 1 && (
            <p className="mt-1">
              <button
                type="button"
                onClick={onUndoLast}
                disabled={undoing}
                className="text-xs text-gray-500 hover:text-red-600 underline disabled:opacity-50"
              >
                {undoing ? 'Quitando...' : 'Deshacer última'}
              </button>
            </p>
          )}
          {completed && completedAt && (
            <p className={`text-xs mt-2 ${completionStatus === 'validated' ? 'text-green-600' : 'text-amber-600'}`}>
              {completionStatus === 'validated'
                ? `Completada: ${formatDateTime(completedAt)}`
                : 'Pendiente de validación'}
            </p>
          )}
          {isSwapped && (
            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
              {swapType === 'temporary' ? 'Intercambio temporal' : 'Intercambio permanente'}
            </span>
          )}
        </div>
        {(showCompleteButton || (onSwap && !progressReached)) && (
          <div className="flex gap-2">
            {onSwap && !progressReached && (
              <button
                onClick={onSwap}
                className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Intercambiar
              </button>
            )}
            {showCompleteButton && (
              <button
                onClick={onComplete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Completando...' : canCompleteAgain ? 'Marcar otra realización' : 'Completar'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
