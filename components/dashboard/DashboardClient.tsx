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
import { createTaskCompletion } from '@/app/actions'

type DashboardClientProps = {
  assignment: WeeklyAssignmentWithGroup | null
  pointsTarget: number
  pointsEarned: number
  completions: TaskCompletionWithTask[]
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
  userId,
  weekStartDate,
  pendingSwaps,
  swaps,
  users,
}: DashboardClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showSwapRequest, setShowSwapRequest] = useState(false)
  const [selectedTask, setSelectedTask] = useState<{ id: string; name: string } | null>(null)

  const tasks = assignment?.task_group?.tasks || []
  const completionsMap = new Map(
    completions.map((c) => [
      c.task_id,
      {
        completed: true,
        completedAt: c.completed_at,
      },
    ])
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

  const daysRemaining = getDaysRemainingInWeek()
  const progressPercentage = pointsTarget > 0 ? (pointsEarned / pointsTarget) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
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

        {assignment?.task_group ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Grupo: {assignment.task_group.name}
            </h2>
            <TaskList
              tasks={tasks}
              completions={completionsMap}
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
