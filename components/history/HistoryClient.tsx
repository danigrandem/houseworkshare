'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WeeklyScoreWithUser, TaskCompletionWithTask } from '@/lib/db/schema'
import type { WeeklyAssignmentWithGroup } from '@/lib/db/schema'
import { formatDateForDisplay, formatDateTime } from '@/lib/utils/date'
import TaskFrequencyTag from '@/components/tasks/TaskFrequencyTag'
import { createTaskCompletion, validateTaskCompletion, validateOwnTaskCompletion, discardTaskCompletion } from '@/app/actions'

type ScoreWithAssignment = WeeklyScoreWithUser & {
  assignment: WeeklyAssignmentWithGroup | null
}

type WeekData = {
  weekStart: string
  scores: ScoreWithAssignment[]
  completions: TaskCompletionWithTask[]
}

type HistoryClientProps = {
  weeksData: WeekData[]
  userId: string
}

export default function HistoryClient({ weeksData, userId }: HistoryClientProps) {
  const router = useRouter()
  const [selectedWeek, setSelectedWeek] = useState<string | null>(
    weeksData[0]?.weekStart || null
  )
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const [discardingId, setDiscardingId] = useState<string | null>(null)
  const [markingTaskId, setMarkingTaskId] = useState<string | null>(null)
  const selectedWeekData = weeksData.find((w) => w.weekStart === selectedWeek)

  const myScoreAndAssignment = selectedWeekData?.scores.find((s) => s.user_id === userId)
  const myTasks = myScoreAndAssignment?.assignment?.task_group?.tasks ?? []
  const completions = selectedWeekData?.completions ?? []
  const weekStart = selectedWeek ?? ''
  console.log("myTasks", myTasks)
  const usersById = new Map(
    selectedWeekData?.scores?.map((s) => [s.user_id, s.user]) ?? []
  )
  const userName = (uid: string) =>
    usersById.get(uid)?.name || usersById.get(uid)?.email || uid

  const handleValidate = async (completionId: string) => {
    setValidatingId(completionId)
    try {
      await validateTaskCompletion(completionId)
      router.refresh()
    } catch (err) {
      console.error('Error validando:', err)
    } finally {
      setValidatingId(null)
      router.refresh()
    }
  }

  const handleValidateOwn = async (completionId: string) => {
    setValidatingId(completionId)
    try {
      await validateOwnTaskCompletion(completionId)
      router.refresh()
    } catch (err) {
      console.error('Error validando:', err)
    } finally {
      setValidatingId(null)
      router.refresh()
    }
  }

  const handleDiscard = async (completionId: string) => {
    if (!confirm('¿Descartar esta realización?')) return
    setDiscardingId(completionId)
    try {
      await discardTaskCompletion(completionId)
      router.refresh()
    } catch (err) {
      console.error('Error descartando:', err)
    } finally {
      setDiscardingId(null)
      router.refresh()
    }
  }

  const handleMarkAsDone = async (taskId: string, points: number) => {
    setMarkingTaskId(taskId)
    try {
      await createTaskCompletion(taskId, userId, weekStart, points)
      router.refresh()
    } catch (err) {
      console.error('Error marcando como hecha:', err)
    } finally {
      setMarkingTaskId(null)
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-celeste-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Historial</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar semana
          </label>
          <select
            value={selectedWeek || ''}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-celeste-500 focus:border-celeste-500"
          >
            {weeksData.map((week) => (
              <option key={week.weekStart} value={week.weekStart}>
                Semana del {formatDateForDisplay(week.weekStart)}
              </option>
            ))}
          </select>
        </div>

        {selectedWeekData && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Puntuaciones - Semana del {formatDateForDisplay(selectedWeekData.weekStart)}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puntos Obtenidos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objetivo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transferidos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedWeekData.scores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No hay datos para esta semana</td>
                      </tr>
                    ) : (
                      selectedWeekData.scores.map((score) => {
                        const deficit = score.points_target - score.points_earned
                        const status = deficit <= 0 ? 'Cumplido' : 'Pendiente'
                        return (
                          <tr key={score.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {score.user.name || score.user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{score.points_earned}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{score.points_target}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {score.points_carried_over > 0 ? `+${score.points_carried_over}` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status === 'Cumplido' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mis tareas de esta semana (según asignación) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Mis tareas - Semana del {formatDateForDisplay(selectedWeekData.weekStart)}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Tareas que tenías asignadas. Marca como hechas las que hiciste y valida las pendientes para que sumen puntos.
              </p>
              {myTasks.length === 0 ? (
                <p className="text-gray-500 py-4">No tenías tareas asignadas esta semana.</p>
              ) : (
                <ul className="space-y-3">
                  {myTasks.map((task) => {
                    const myCompletions = completions.filter(
                      (c) => c.user_id === userId && c.task_id === task.id
                    )
                    const validated = myCompletions.filter((c) => c.status === 'validated')
                    const pending = myCompletions.filter((c) => c.status === 'pending')
                    const min = task.frequency === 'weekly' ? (task.weekly_minimum ?? 1) : 1
                    const totalCount = validated.length + pending.length
                    const isCompleted =
                      task.frequency === 'daily'
                        ? validated.length >= 1
                        : validated.length >= min
                    const hasPending = pending.length > 0
                    const noMarked = totalCount === 0

                    return (
                      <li
                        key={task.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{task.name}</span>
                          <TaskFrequencyTag frequency={task.frequency} />
                          {min > 1 && (
                            <span className="text-xs text-gray-500">
                              ({totalCount}/{min} realizaciones)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isCompleted && (
                            <span className="text-xs text-green-600 font-medium">Completada</span>
                          )}
                          {hasPending && !isCompleted && (
                            <>
                              <span className="text-xs text-amber-600">Pendiente de validar</span>
                              {validatingId === pending[0].id && <button
                                type="button"
                                onClick={() => handleValidateOwn(pending[0].id)}
                                disabled={validatingId === pending[0].id || discardingId !== null}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-celeste-600 rounded hover:bg-celeste-700 disabled:opacity-50"
                              >
                                {validatingId === pending[0].id ? 'Validando...' : 'Validar mi realización'}
                              </button>}
                            </>
                          )}
                          {noMarked && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsDone(task.id, task.points)}
                              disabled={markingTaskId === task.id}
                              className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              {markingTaskId === task.id ? 'Marcando...' : 'Marcar como hecha'}
                            </button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Pendientes de otros (para validar/descartar) */}
            {(() => {
              const othersPending = completions.filter(
                (c) => c.status === 'pending' && c.user_id !== userId
              )
              if (othersPending.length === 0) return null
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Pendientes de otros (para validar)
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Realizaciones que otros marcaron y aún no están validadas.
                  </p>
                  <ul className="space-y-2">
                    {othersPending.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-4 py-2 border-b border-amber-100 last:border-0"
                      >
                        <span className="text-gray-900">
                          <strong>{c.task?.name}</strong>
                          <span className="ml-2 text-xs text-gray-500">
                            — {userName(c.user_id)}
                          </span>
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
              )
            })()}

            {/* Tareas completadas (solo lectura) */}
            {(() => {
              const validatedCompletions = completions.filter((c) => c.status === 'validated')
              if (validatedCompletions.length === 0) return null
              return (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Tareas completadas</h2>
                  <ul className="space-y-2">
                    {validatedCompletions.map((c) => (
                      <li key={c.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                        <span className="text-gray-900">
                          <strong>{c.task?.name}</strong>
                          <span className="ml-2 text-gray-500">— {userName(c.user_id)}</span>
                        </span>
                        <span className="text-xs text-gray-500">{formatDateTime(c.completed_at)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
