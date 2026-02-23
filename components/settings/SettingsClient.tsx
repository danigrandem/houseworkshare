'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateWeeklyConfig } from '@/app/actions/settings'
import { formatDateForDisplay } from '@/lib/utils/date'

type SettingsClientProps = {
  weekStartDate: string
  currentPointsTarget: number
}

export default function SettingsClient({
  weekStartDate,
  currentPointsTarget,
}: SettingsClientProps) {
  const router = useRouter()
  const [pointsTarget, setPointsTarget] = useState(currentPointsTarget)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-celeste-500 focus:border-celeste-500"
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
      </div>
    </div>
  )
}
