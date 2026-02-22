'use client'

import { useState } from 'react'
import type { Task, User } from '@/lib/db/schema'
import { requestTaskSwap } from '@/app/actions/swaps'

type SwapRequestProps = {
  task: Task
  currentUserId: string
  users: User[]
  weekStartDate: string
  onClose: () => void
  onSuccess: () => void
}

export default function SwapRequest({
  task,
  currentUserId,
  users,
  weekStartDate,
  onClose,
  onSuccess,
}: SwapRequestProps) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [swapType, setSwapType] = useState<'temporary' | 'permanent'>('temporary')
  const [swapDate, setSwapDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableUsers = users.filter((u) => u.id !== currentUserId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedUserId) {
      setError('Debes seleccionar un usuario')
      return
    }

    if (swapType === 'temporary' && !swapDate) {
      setError('Debes seleccionar una fecha para el intercambio temporal')
      return
    }

    setLoading(true)

    try {
      await requestTaskSwap(
        task.id,
        currentUserId,
        selectedUserId,
        weekStartDate,
        swapType,
        swapType === 'temporary' ? swapDate : undefined
      )
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar el intercambio')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Solicitar Intercambio: {task.name}
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario destinatario
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Seleccionar usuario</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de intercambio
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="temporary"
                  checked={swapType === 'temporary'}
                  onChange={(e) => setSwapType(e.target.value as 'temporary' | 'permanent')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Temporal (solo un día)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="permanent"
                  checked={swapType === 'permanent'}
                  onChange={(e) => setSwapType(e.target.value as 'temporary' | 'permanent')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Permanente (resto de la semana)</span>
              </label>
            </div>
          </div>

          {swapType === 'temporary' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha del intercambio
              </label>
              <input
                type="date"
                value={swapDate}
                onChange={(e) => setSwapDate(e.target.value)}
                required={swapType === 'temporary'}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Solicitar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
