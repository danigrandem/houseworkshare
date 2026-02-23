'use client'

import type { Task } from '@/lib/db/schema'
import { formatDateTime } from '@/lib/utils/date'

type TaskCardProps = {
  task: Task
  completed: boolean
  completedAt?: string
  completionStatus?: 'pending' | 'validated'
  onComplete: () => void
  onSwap?: () => void
  isSwapped?: boolean
  swapType?: 'temporary' | 'permanent'
  loading?: boolean
}

export default function TaskCard({
  task,
  completed,
  completedAt,
  completionStatus,
  onComplete,
  onSwap,
  isSwapped = false,
  swapType,
  loading = false,
}: TaskCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{task.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {task.points} puntos {task.frequency === 'daily' ? '· Diaria' : '· Semanal'}
          </p>
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
        <div className="flex gap-2">
          {onSwap && !completed && (
            <button
              onClick={onSwap}
              className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Intercambiar
            </button>
          )}
          {!completed && (
            <button
              onClick={onComplete}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Completando...' : 'Completar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
