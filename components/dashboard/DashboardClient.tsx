'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  WeeklyAssignmentWithGroup,
  TaskCompletionWithTask,
  TaskSwapWithTask,
  User,
} from '@/lib/db/schema'
import type { ExtraCompletion } from '@/lib/db/schema'
import TaskList from '@/components/tasks/TaskList'
import SwapNotification from '@/components/tasks/SwapNotification'
import SwapRequest from '@/components/tasks/SwapRequest'
import { getDaysRemainingInWeek, formatDateForDisplay } from '@/lib/utils/date'
import { createTaskCompletion, deleteMyLastCompletion, deleteLastTaskCompletion, validateTaskCompletion, discardTaskCompletion, clearMyAssignment, createExtraCompletionAction, validateExtraCompletionAction } from '@/app/actions'
import type { CompletionStatus } from '@/lib/db/schema'

type MemberWithAssignment = {
  user: User
  assignment: WeeklyAssignmentWithGroup | null
}

type DashboardClientProps = {
  assignment: WeeklyAssignmentWithGroup | null
  pointsTarget: number
  pointsEarned: number
  completions: TaskCompletionWithTask[]
  pendingCompletionsToValidate: TaskCompletionWithTask[]
  today: string
  userId: string
  weekStartDate: string
  firstDayOfWeek: number
  pendingSwaps: TaskSwapWithTask[]
  swaps: Map<string, { isSwapped: boolean; swapType?: 'temporary' | 'permanent' }>
  users: User[]
  membersWithAssignments: MemberWithAssignment[]
  allCompletions: TaskCompletionWithTask[]
  extraCompletions: ExtraCompletion[]
  pendingExtraCompletions: ExtraCompletion[]
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
  firstDayOfWeek,
  pendingSwaps,
  swaps,
  users,
  membersWithAssignments,
  allCompletions,
  extraCompletions,
  pendingExtraCompletions,
}: DashboardClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const [discardingId, setDiscardingId] = useState<string | null>(null)
  const [validatingExtraId, setValidatingExtraId] = useState<string | null>(null)
  const [showSwapRequest, setShowSwapRequest] = useState(false)
  const [selectedTask, setSelectedTask] = useState<{ id: string; name: string } | null>(null)
  const [clearingAssignment, setClearingAssignment] = useState(false)
  const [extraForm, setExtraForm] = useState({ name: '', points: 10 })
  const [addingExtra, setAddingExtra] = useState(false)
  const [undoingLast, setUndoingLast] = useState(false)
  const [undoingTaskId, setUndoingTaskId] = useState<string | null>(null)

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
  const weeklyCompletionCounts = new Map<string, number>()
  completions.forEach((c) => {
    if (c.task?.frequency === 'weekly') {
      weeklyCompletionCounts.set(c.task_id, (weeklyCompletionCounts.get(c.task_id) || 0) + 1)
    }
  })

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
      //  setLoading(null)
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

  const handleUndoLastCompletion = async () => {
    setUndoingLast(true)
    try {
      await deleteMyLastCompletion(weekStartDate)
      router.refresh()
    } catch (err) {
      console.error('Error al quitar última realización:', err)
    } finally {
      setUndoingLast(false)
    }
  }

  const handleUndoLastForTask = async (taskId: string) => {
    setUndoingTaskId(taskId)
    try {
      await deleteLastTaskCompletion(taskId, weekStartDate)
      router.refresh()
    } catch (err) {
      console.error('Error al deshacer realización:', err)
    } finally {
      setUndoingTaskId(null)
    }
  }

  const handleClearAssignment = async () => {
    if (!confirm('¿Quitar tu grupo asignado esta semana? No podrás completar tareas hasta que te asignen de nuevo.')) return
    setClearingAssignment(true)
    try {
      await clearMyAssignment()
      router.refresh()
    } catch (err) {
      console.error('Error al quitar asignación:', err)
    } finally {
      setClearingAssignment(false)
    }
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

  const handleDiscard = async (completionId: string) => {
    if (!confirm('¿Descartar esta realización? Quedará eliminada y la persona podrá volver a marcarla.')) return
    setDiscardingId(completionId)
    try {
      await discardTaskCompletion(completionId)
      router.refresh()
    } catch (err) {
      console.error('Error descartando:', err)
    } finally {
      setDiscardingId(null)
    }
  }

  const handleValidateExtra = async (completionId: string) => {
    setValidatingExtraId(completionId)
    try {
      await validateExtraCompletionAction(completionId)
      router.refresh()
    } catch (err) {
      console.error('Error validando:', err)
    } finally {
      setValidatingExtraId(null)
    }
  }

  const handleAddExtra = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!extraForm.name.trim() || extraForm.points < 0) return
    setAddingExtra(true)
    try {
      await createExtraCompletionAction(weekStartDate, extraForm.name.trim(), extraForm.points)
      setExtraForm({ name: '', points: 10 })
      router.refresh()
    } catch (err) {
      console.error('Error añadiendo tarea extra:', err)
    } finally {
      setAddingExtra(false)
    }
  }

  const daysRemaining = getDaysRemainingInWeek(new Date(), firstDayOfWeek)
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
            {' · '}
            <button
              type="button"
              onClick={handleUndoLastCompletion}
              disabled={undoingLast || completions.length === 0}
              className="text-gray-500 hover:text-red-600 underline disabled:opacity-50 disabled:no-underline disabled:cursor-default"
            >
              {undoingLast ? 'Quitando...' : 'Quitar última realización'}
            </button>
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
                    <strong>{c.task?.name}</strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleValidate(c.id)}
                      disabled={validatingId === c.id || discardingId === c.id}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-celeste-600 rounded hover:bg-celeste-700 disabled:opacity-50"
                    >
                      {validatingId === c.id ? 'Validando...' : 'Validar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDiscard(c.id)}
                      disabled={validatingId === c.id || discardingId === c.id}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      {discardingId === c.id ? 'Descartando...' : 'Descartar'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {assignment?.task_group ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Mis tareas — Grupo: {assignment.task_group.name}
              </h2>
              <button
                type="button"
                onClick={handleClearAssignment}
                disabled={clearingAssignment}
                className="text-sm text-amber-700 hover:text-amber-800 underline disabled:opacity-50"
              >
                {clearingAssignment ? 'Quitando...' : 'Quitar mi grupo esta semana'}
              </button>
            </div>
            <TaskList
              tasks={tasks}
              completions={completionsMap}
              weeklyCompletionCounts={weeklyCompletionCounts}
              today={today}
              onComplete={handleComplete}
              onUndoLast={handleUndoLastForTask}
              onSwap={handleSwapClick}
              swaps={swaps}
              loading={loading}
              undoingTaskId={undoingTaskId}
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">
              No tienes un grupo asignado para esta semana.
            </p>
          </div>
        )}

        {membersWithAssignments.filter((m) => m.user.id !== userId).length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Tareas del resto del hogar
            </h2>
            <div className="space-y-6">
              {membersWithAssignments
                .filter((m) => m.user.id !== userId)
                .map(({ user: member, assignment: memberAssignment }) => {
                  const memberCompletions = allCompletions.filter((c) => c.user_id === member.id)
                  const memberCompletionsMap = new Map(
                    memberCompletions.map((c) => {
                      const key =
                        c.task?.frequency === 'daily'
                          ? `${c.task_id}_${c.completion_date || ''}`
                          : c.task_id
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
                  const memberWeeklyCounts = new Map<string, number>()
                  memberCompletions.forEach((c) => {
                    if (c.task?.frequency === 'weekly') {
                      memberWeeklyCounts.set(c.task_id, (memberWeeklyCounts.get(c.task_id) || 0) + 1)
                    }
                  })
                  const memberTasks = memberAssignment?.task_group?.tasks || []
                  const memberName = member.name || member.email || 'Miembro'
                  return (
                    <div
                      key={member.id}
                      className="bg-white rounded-lg shadow p-4 border border-gray-200"
                    >
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        {memberName}
                        {memberAssignment?.task_group && (
                          <span className="text-gray-500 font-normal">
                            {' '}
                            — {memberAssignment.task_group.name}
                          </span>
                        )}
                      </h3>
                      {memberTasks.length > 0 ? (
                        <TaskList
                          tasks={memberTasks}
                          completions={memberCompletionsMap}
                          weeklyCompletionCounts={memberWeeklyCounts}
                          today={today}
                          swaps={new Map()}
                        />
                      ) : (
                        <p className="text-gray-500 text-sm">Sin grupo asignado esta semana.</p>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {pendingExtraCompletions.length > 0 && (
          <div className="mt-8 mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Tareas unitarias extra pendientes de validar
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Otros han añadido estas tareas extra. Valida para que cuenten los puntos.
            </p>
            <ul className="space-y-2">
              {pendingExtraCompletions.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-4 py-2 border-b border-amber-100 last:border-0"
                >
                  <span className="text-gray-900">
                    <strong>{e.name}</strong> — {e.points_earned} pts
                  </span>
                  <button
                    type="button"
                    onClick={() => handleValidateExtra(e.id)}
                    disabled={validatingExtraId === e.id}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-celeste-600 rounded hover:bg-celeste-700 disabled:opacity-50"
                  >
                    {validatingExtraId === e.id ? 'Validando...' : 'Validar'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Tareas unitarias extra</h2>
          <p className="text-sm text-gray-600 mb-4">
            Añade tareas que hayas hecho por encima de lo asignado (ej. una tarea puntual). Otros miembros deben validarlas.
          </p>
          <form onSubmit={handleAddExtra} className="flex flex-wrap gap-3 mb-4">
            <input
              type="text"
              value={extraForm.name}
              onChange={(e) => setExtraForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nombre de la tarea"
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-celeste-500 focus:border-celeste-500 min-w-[180px]"
            />
            <input
              type="number"
              min="0"
              value={extraForm.points}
              onChange={(e) => setExtraForm((p) => ({ ...p, points: parseInt(e.target.value, 10) || 0 }))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-celeste-500"
            />
            <span className="flex items-center text-sm text-gray-500">puntos</span>
            <button
              type="submit"
              disabled={addingExtra || !extraForm.name.trim()}
              className="px-4 py-2 bg-celeste-600 text-white rounded hover:bg-celeste-700 disabled:opacity-50"
            >
              {addingExtra ? 'Añadiendo...' : 'Añadir'}
            </button>
          </form>
          {extraCompletions.length > 0 && (
            <ul className="space-y-2">
              {extraCompletions.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-sm"
                >
                  <span className="text-gray-900">{e.name}</span>
                  <span className="text-gray-500">
                    {e.points_earned} pts — {e.status === 'validated' ? 'Validado' : 'Pendiente de validación'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

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
