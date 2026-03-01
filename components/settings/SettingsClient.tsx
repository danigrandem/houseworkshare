'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateWeeklyConfig, assignGroupsThisWeek } from '@/app/actions/settings'
import { updateHouseWeekStartDay, updateHouseRotationWeeks } from '@/app/actions/houses'
import { formatDateForDisplay } from '@/lib/utils/date'

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
}

export default function SettingsClient({
  houseId,
  weekStartDate,
  currentPointsTarget,
  weekStartDay,
  rotationWeeks,
  isOwner,
}: SettingsClientProps) {
  const router = useRouter()
  const [pointsTarget, setPointsTarget] = useState(currentPointsTarget)
  const [weekStartDayState, setWeekStartDayState] = useState(weekStartDay)
  const [rotationWeeksState, setRotationWeeksState] = useState(rotationWeeks)
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [savingWeekDay, setSavingWeekDay] = useState(false)
  const [savingRotation, setSavingRotation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [assignSuccess, setAssignSuccess] = useState(false)

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

  const handleAssignGroups = async () => {
    setError(null)
    setAssignSuccess(false)
    setAssigning(true)
    try {
      await assignGroupsThisWeek()
      setAssignSuccess(true)
      setTimeout(() => router.refresh(), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar grupos')
    } finally {
      setAssigning(false)
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
            Asigna un grupo de tareas a cada miembro de la casa para esta semana. Si ya había asignaciones, se mantienen; solo se asignan quienes aún no tenían grupo. La rotación al siguiente grupo depende de la opción &quot;Cambio de grupo cada...&quot;.
          </p>
          {assignSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              Grupos asignados correctamente. Actualiza el Dashboard para ver tu grupo.
            </div>
          )}
          <button
            type="button"
            onClick={handleAssignGroups}
            disabled={assigning}
            className="px-4 py-2 bg-celeste-600 text-white rounded hover:bg-celeste-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigning ? 'Asignando...' : 'Asignar grupos esta semana'}
          </button>
        </div>
      </div>
    </div>
  )
}
