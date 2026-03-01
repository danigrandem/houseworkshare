'use client'

import { useState } from 'react'
import type { WeeklyScoreWithUser, TaskCompletionWithTask } from '@/lib/db/schema'
import { formatDateForDisplay, formatDateTime } from '@/lib/utils/date'
import TaskFrequencyTag from '@/components/tasks/TaskFrequencyTag'

type WeekData = {
  weekStart: string
  scores: WeeklyScoreWithUser[]
  completions: TaskCompletionWithTask[]
}

type HistoryClientProps = {
  weeksData: WeekData[]
}

export default function HistoryClient({ weeksData }: HistoryClientProps) {
  const [selectedWeek, setSelectedWeek] = useState<string | null>(
    weeksData[0]?.weekStart || null
  )
  const selectedWeekData = weeksData.find((w) => w.weekStart === selectedWeek)

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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Puntos Obtenidos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Objetivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transferidos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedWeekData.scores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No hay datos para esta semana
                        </td>
                      </tr>
                    ) : (
                      selectedWeekData.scores.map((score) => {
                        const deficit = score.points_target - score.points_earned
                        const status = deficit <= 0 ? 'Cumplido' : 'Pendiente'
                        return (
                          <tr key={score.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {score.user.name || score.user.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{score.points_earned}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{score.points_target}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {score.points_carried_over > 0 ? `+${score.points_carried_over}` : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status === 'Cumplido'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
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

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Tareas Completadas
              </h2>
              <div className="space-y-4">
                {selectedWeekData.completions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No hay tareas completadas en esta semana
                  </p>
                ) : (
                  selectedWeekData.completions.map((completion) => (
                    <div
                      key={completion.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-medium text-gray-900">
                              {completion.task.name}
                            </h3>
                            <TaskFrequencyTag frequency={completion.task.frequency} />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {completion.user_id} • {completion.points_earned} puntos
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(completion.completed_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
