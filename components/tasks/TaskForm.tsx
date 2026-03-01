'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Task, TaskFrequency } from '@/lib/db/schema'
import { createTaskAction, updateTaskAction } from '@/app/actions/tasks'

type TaskFormProps = {
  task?: Task
}

export default function TaskForm({ task }: TaskFormProps) {
  const router = useRouter()
  const [name, setName] = useState(task?.name || '')
  const [points, setPoints] = useState(task?.points || 0)
  const [frequency, setFrequency] = useState<TaskFrequency>(task?.frequency || 'weekly')
  const [weeklyMinimum, setWeeklyMinimum] = useState<number | ''>(task?.weekly_minimum ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const raw = weeklyMinimum === '' ? null : (typeof weeklyMinimum === 'number' ? weeklyMinimum : parseInt(String(weeklyMinimum), 10))
    const minVal = raw !== null && !Number.isNaN(raw) ? raw : null

    try {
      if (task) {
        await updateTaskAction(task.id, name, points, frequency, minVal ?? null)
      } else {
        await createTaskAction(name, points, frequency, minVal ?? null)
      }
      router.push('/tasks')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la tarea')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Nombre de la tarea
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-celeste-500 focus:border-celeste-500"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
          Puntos
        </label>
        <input
          type="number"
          id="points"
          value={points}
          onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
          required
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-celeste-500 focus:border-celeste-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Frecuencia
        </label>
        <div className="flex gap-4">
          <label className="inline-flex items-center text-gray-900">
            <input
              type="radio"
              name="frequency"
              value="weekly"
              checked={frequency === 'weekly'}
              onChange={() => setFrequency('weekly')}
              className="mr-2 text-celeste-600"
            />
            Semanal
          </label>
          <label className="inline-flex items-center text-gray-900">
            <input
              type="radio"
              name="frequency"
              value="daily"
              checked={frequency === 'daily'}
              onChange={() => setFrequency('daily')}
              className="mr-2 text-celeste-600"
            />
            Unitaria
          </label>
        </div>
      </div>

      {frequency === 'weekly' && (
        <div className="mb-4">
          <label htmlFor="weekly_minimum" className="block text-sm font-medium text-gray-700 mb-2">
            Objetivo mínimo (veces en la semana)
          </label>
          <input
            type="number"
            id="weekly_minimum"
            min="1"
            placeholder="Vacío = 1 vez cuenta"
            value={weeklyMinimum}
            onChange={(e) => {
              const v = e.target.value
              setWeeklyMinimum(v === '' ? '' : parseInt(v, 10) || 1)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-celeste-500 focus:border-celeste-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Si se indica, los puntos solo se suman al alcanzar este número de realizaciones.
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-celeste-600 text-white rounded hover:bg-celeste-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : task ? 'Actualizar' : 'Crear'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
