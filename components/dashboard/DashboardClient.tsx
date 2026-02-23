'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  WeeklyAssignmentWithGroup,
  TaskCompletionWithTask,
  TaskSwapWithTask,
} from '@/lib/db/schema'
import TaskList from '@/components/tasks/TaskList'
import SwapNotification from '@/components/tasks/SwapNotification'
import SwapRequest from '@/components/tasks/SwapRequest'
import { getDaysRemainingInWeek, formatDateForDisplay } from '@/lib/utils/date'
import { createTaskCompletion, validateTaskCompletion } from '@/app/actions'
import type { CompletionStatus } from '@/lib/db/schema'

type DashboardClientProps = {
  assignment: WeeklyAssignmentWithGroup | null
  pointsTarget: number
  pointsEarned: number
  completions: TaskCompletionWithTask[]
  pendingCompletionsToValidate: TaskCompletionWithTask[]
  today: string
  userId: string
  weekStartDate: string
  pendingSwaps: TaskSwapWithTask[]
  swaps: Map<string, { isSwapped: boolean; swapType?: 'temporary' | 'permanent' }>
  users: any[]
}

export default function DashboardClient({
  assignment,
  pointsTarget,
  pointsEarned,
  completions,
  pendingCompletionsToValidate,
  today,
  userId,
  weekStartDate,
  pendingSwaps,
  swaps,
  users,
}: DashboardClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const [showSwapRequest, setShowSwapRequest] = useState(false)
  const [selectedTask, setSelectedTask] = useState<{ id: string; name: string } | null>(null)

  const tasks = assignment?.task_group?.tasks || []
  const completionsMap = new Map(
    completions.map((c) => {
      const key = c.task?.frequency === 'daily' ? `${c.task_id}_${c.completion_date || ''}` : c.task_id
      return [
        key,
        {
          completed: true,
          completedAt: c.completed_at,
          status: c.status as CompletionStatus,
        },
      ]
    })
  )

  const handleComplete = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    setLoading(taskId)
    try {
      await createTaskCompletion(taskId, userId, weekStartDate, task.points)
      router.refresh()
    } catch (error) {
      console.error('Error completing task:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleSwapClick = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    setSelectedTask({ id: task.id, name: task.name })
    setShowSwapRequest(true)
  }

  const handleSwapSuccess = () => {
    router.refresh()
  }

  const handleValidate = async (completionId: string) => {
    setValidatingId(completionId)
    try {
      await validateTaskCompletion(completionId)
      router.refresh()
    } catch (err) {
      console.error('Error validando:', err)
    } finally {
      setValidatingId(null)
    }
  }

  const daysRemaining = getDaysRemainingInWeek()
  const progressPercentage = pointsTarget > 0 ? (pointsEarned / pointsTarget) * 100 : 0

  return (
    <div className="min-h-screen bg-celeste-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Semana del {formatDateForDisplay(weekStartDate)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Progreso Semanal</h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                {pointsEarned} / {pointsTarget} puntos
              </span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full transition-all"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {daysRemaining} días restantes en la semana
          </p>
        </div>

        {pendingSwaps.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Solicitudes de Intercambio Pendientes
            </h2>
            {pendingSwaps.map((swap) => (
              <SwapNotification
                key={swap.id}
                swap={swap}
                onResponse={handleSwapSuccess}
              />
            ))}
          </div>
        )}

        {pendingCompletionsToValidate.length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Pendientes de validar
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Otros han marcado estas tareas como hechas. Valida para que cuenten los puntos.
            </p>
            <ul className="space-y-2">
              {pendingCompletionsToValidate.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 py-2 border-b border-amber-100 last:border-0"
                >
                  <span className="text-gray-900">
                    <strong>{c.task?.name}</strong> — {c.points_earned} pts
                  </span>
                  <button
                    type="button"
                    onClick={() => handleValidate(c.id)}
                    disabled={validatingId === c.id}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-celeste-600 rounded hover:bg-celeste-700 disabled:opacity-50"
                  >
                    {validatingId === c.id ? 'Validando...' : 'Validar'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {assignment?.task_group ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Grupo: {assignment.task_group.name}
            </h2>
            <TaskList
              tasks={tasks}
              completions={completionsMap}
              today={today}
              onComplete={handleComplete}
              onSwap={handleSwapClick}
              swaps={swaps}
              loading={loading}
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">
              No tienes un grupo asignado para esta semana.
            </p>
          </div>
        )}

        {showSwapRequest && selectedTask && (
          <SwapRequest
            task={tasks.find((t) => t.id === selectedTask.id)!}
            currentUserId={userId}
            users={users}
            weekStartDate={weekStartDate}
            onClose={() => {
              setShowSwapRequest(false)
              setSelectedTask(null)
            }}
            onSuccess={handleSwapSuccess}
          />
        )}
      </div>
    </div>
  )
}
