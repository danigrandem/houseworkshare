'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateWeeklyConfig,
  saveAssignmentsThisWeek,
  getSuggestedAssignments,
  type AssignmentInput,
} from '@/app/actions/settings'
import { updateHouseWeekStartDay, updateHouseRotationWeeks } from '@/app/actions/houses'
import { formatDateForDisplay } from '@/lib/utils/date'
import type { User } from '@/lib/db/schema'
import type { TaskGroup } from '@/lib/db/schema'

const WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
]

const ROTATION_WEEKS_OPTIONS = [1, 2, 3, 4, 6, 8, 12] as const

type SettingsClientProps = {
  houseId: string
  weekStartDate: string
  currentPointsTarget: number
  weekStartDay: number
  rotationWeeks: number
  isOwner: boolean
  users: User[]
  groups: TaskGroup[]
  initialAssignments: AssignmentInput[]
}

export default function SettingsClient({
  houseId,
  weekStartDate,
  currentPointsTarget,
  weekStartDay,
  rotationWeeks,
  isOwner,
  users,
  groups,
  initialAssignments,
}: SettingsClientProps) {
  const router = useRouter()
  const [pointsTarget, setPointsTarget] = useState(currentPointsTarget)
  const [weekStartDayState, setWeekStartDayState] = useState(weekStartDay)
  const [rotationWeeksState, setRotationWeeksState] = useState(rotationWeeks)
  const [loading, setLoading] = useState(false)
  const [savingWeekDay, setSavingWeekDay] = useState(false)
  const [savingRotation, setSavingRotation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [assignSuccess, setAssignSuccess] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignments, setAssignments] = useState<AssignmentInput[]>(initialAssignments)
  const [savingAssignments, setSavingAssignments] = useState(false)
  const [loadingSuggested, setLoadingSuggested] = useState(false)

  const openAssignModal = useCallback(() => {
    setAssignments(initialAssignments)
    setError(null)
    setAssignSuccess(false)
    setShowAssignModal(true)
  }, [initialAssignments])

  const handleAssignmentChange = useCallback((userId: string, groupId: string | null) => {
    setAssignments((prev) =>
      prev.map((a) => (a.userId === userId ? { ...a, groupId } : a))
    )
  }, [])

  const handleApplySuggested = useCallback(async () => {
    setLoadingSuggested(true)
    setError(null)
    try {
      const suggested = await getSuggestedAssignments()
      setAssignments(suggested)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar sugerencia')
    } finally {
      setLoadingSuggested(false)
    }
  }, [])

  const handleSaveAssignments = useCallback(async () => {
    setSavingAssignments(true)
    setError(null)
    try {
      await saveAssignmentsThisWeek(assignments)
      setAssignSuccess(true)
      setShowAssignModal(false)
      setTimeout(() => router.refresh(), 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar asignaciones')
    } finally {
      setSavingAssignments(false)
    }
  }, [assignments, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      await updateWeeklyConfig(weekStartDate, pointsTarget)
      setSuccess(true)
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleWeekStartDayChange = async (day: number) => {
    setError(null)
    setSavingWeekDay(true)
    try {
      await updateHouseWeekStartDay(houseId, day)
      setWeekStartDayState(day)
      setTimeout(() => router.refresh(), 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSavingWeekDay(false)
    }
  }

  const handleRotationWeeksChange = async (weeks: number) => {
    setError(null)
    setSavingRotation(true)
    try {
      await updateHouseRotationWeeks(houseId, weeks)
      setRotationWeeksState(weeks)
      setTimeout(() => router.refresh(), 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSavingRotation(false)
    }
  }

  return (
    <div className="min-h-screen bg-celeste-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Configuración</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Puntos Objetivo por Semana
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Configuración para la semana del {formatDateForDisplay(weekStartDate)}
          </p>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              Configuración actualizada correctamente
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="pointsTarget"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Puntos objetivo por persona
              </label>
              <input
                type="number"
                id="pointsTarget"
                value={pointsTarget}
                onChange={(e) => setPointsTarget(parseInt(e.target.value) || 0)}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-celeste-500 focus:border-celeste-500"
              />
              <p className="mt-2 text-sm text-gray-500">
                Cada participante deberá completar esta cantidad de puntos durante la semana.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-celeste-600 text-white rounded hover:bg-celeste-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </form>
        </div>

        {isOwner && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Día de inicio de semana
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              El progreso semanal y las asignaciones de grupos se calculan por semana. Elige qué día considera tu casa como inicio de semana.
            </p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleWeekStartDayChange(opt.value)}
                  disabled={savingWeekDay}
                  className={`px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 ${
                    weekStartDayState === opt.value
                      ? 'bg-celeste-600 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isOwner && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Cambio de grupo cada...
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Cada cuántas semanas se rota al siguiente grupo de tareas. Por ejemplo: cada 2 = mismo grupo 2 semanas, luego al siguiente.
            </p>
            <div className="flex flex-wrap gap-2">
              {ROTATION_WEEKS_OPTIONS.map((weeks) => (
                <button
                  key={weeks}
                  type="button"
                  onClick={() => handleRotationWeeksChange(weeks)}
                  disabled={savingRotation}
                  className={`px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 ${
                    rotationWeeksState === weeks
                      ? 'bg-celeste-600 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {weeks} {weeks === 1 ? 'semana' : 'semanas'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Asignación de grupos
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {isOwner
              ? 'Elige qué grupo de tareas hace cada miembro esta semana. Puedes usar la sugerencia por rotación o elegir manualmente.'
              : 'Solo el dueño de la casa puede asignar grupos.'}
          </p>
          {assignSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              Grupos asignados correctamente. Actualiza el Dashboard para ver tu grupo.
            </div>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={openAssignModal}
              className="px-4 py-2 bg-celeste-600 text-white rounded hover:bg-celeste-700"
            >
              Asignar grupos esta semana
            </button>
          )}
        </div>

        {showAssignModal && isOwner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Asignar grupo a cada miembro
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Semana del {formatDateForDisplay(weekStartDate)}
                </p>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  {users.map((member) => {
                    const current = assignments.find((a) => a.userId === member.id)
                    const groupId = current?.groupId ?? null
                    return (
                      <div
                        key={member.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                      >
                        <label className="text-sm font-medium text-gray-900 min-w-[120px]">
                          {member.name || member.email || 'Miembro'}
                        </label>
                        <select
                          value={groupId ?? ''}
                          onChange={(e) =>
                            handleAssignmentChange(
                              member.id,
                              e.target.value === '' ? null : e.target.value
                            )
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-celeste-500 focus:border-celeste-500 text-sm"
                        >
                          <option value="">Sin grupo</option>
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
                {groups.length > 0 && (
                  <button
                    type="button"
                    onClick={handleApplySuggested}
                    disabled={loadingSuggested}
                    className="mt-4 text-sm text-celeste-600 hover:text-celeste-800 disabled:opacity-50"
                  >
                    {loadingSuggested ? 'Cargando...' : 'Sugerir por rotación'}
                  </button>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignments}
                  disabled={savingAssignments}
                  className="px-4 py-2 bg-celeste-600 text-white rounded hover:bg-celeste-700 disabled:opacity-50"
                >
                  {savingAssignments ? 'Guardando...' : 'Guardar asignaciones'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
