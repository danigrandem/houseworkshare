'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { TaskGroup } from '@/lib/db/schema'
import { deleteGroup } from '@/app/actions/groups'

type GroupsListProps = {
  groups: TaskGroup[]
}

export default function GroupsList({ groups: initialGroups }: GroupsListProps) {
  const [groups, setGroups] = useState(initialGroups)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este grupo?')) return

    setDeleting(id)
    try {
      await deleteGroup(id)
      setGroups(groups.filter((g) => g.id !== id))
    } catch (error) {
      console.error('Error deleting group:', error)
      alert('Error al eliminar el grupo')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-celeste-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Grupos</h1>
          <Link
            href="/groups/new"
            className="px-4 py-2 bg-celeste-600 text-white rounded hover:bg-celeste-700"
          >
            Nuevo Grupo
          </Link>
        </div>

        <div className="grid gap-4">
          {groups.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No hay grupos. Crea un nuevo grupo para comenzar.
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{group.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Creado: {new Date(group.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/groups/${group.id}/edit`}
                      className="px-3 py-1 text-sm font-medium text-celeste-600 hover:text-celeste-800"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(group.id)}
                      disabled={deleting === group.id}
                      className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {deleting === group.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
