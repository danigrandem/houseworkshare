'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { TaskGroupWithTasks, Task } from '@/lib/db/schema'
import { createGroup, updateGroup } from '@/app/actions/groups'

type GroupFormProps = {
  group?: TaskGroupWithTasks
  tasks: Task[]
}

export default function GroupForm({ group, tasks }: GroupFormProps) {
  const router = useRouter()
  const [name, setName] = useState(group?.name || '')
  const [selectedTasks, setSelectedTasks] = useState<string[]>(
    group?.tasks.map((t) => t.id) || []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (group) {
      setSelectedTasks(group.tasks.map((t) => t.id))
    }
  }, [group])

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (group) {
        await updateGroup(group.id, name, selectedTasks)
      } else {
        await createGroup(name, selectedTasks)
      }
      router.push('/groups')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el grupo')
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

      <div className="mb-6">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del grupo
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

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tareas del grupo
        </label>
        <div className="border border-gray-300 rounded-md p-4 max-h-96 overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay tareas disponibles</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <label
                  key={task.id}
                  className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.id)}
                    onChange={() => handleTaskToggle(task.id)}
                    className="mr-3 h-4 w-4 text-celeste-600 focus:ring-celeste-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{task.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{task.points} puntos</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {selectedTasks.length} tarea(s) seleccionada(s)
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-celeste-600 text-white rounded hover:bg-celeste-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : group ? 'Actualizar' : 'Crear'}
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
