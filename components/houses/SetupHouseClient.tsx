'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createHouse, acceptInvitation, getPendingInvitations } from '@/app/actions/houses'

type SetupHouseClientProps = {
  userId: string
  userEmail: string
}

export default function SetupHouseClient({ userId, userEmail }: SetupHouseClientProps) {
  const router = useRouter()
  const [houseName, setHouseName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [invitations, setInvitations] = useState<any[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState(true)

  const loadInvitations = async () => {
    try {
      const pending = await getPendingInvitations(userEmail)
      setInvitations(pending)
    } catch (err) {
      console.error('Error loading invitations:', err)
    } finally {
      setLoadingInvitations(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [])

  const handleCreateHouse = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await createHouse(houseName, userId)
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la casa')
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    setLoading(true)
    try {
      await acceptInvitation(invitationId, userId)
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aceptar la invitación')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-celeste-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configura tu Casa
          </h1>
          <p className="text-gray-600">
            Crea una nueva casa o únete a una existente
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loadingInvitations ? (
          <div className="text-center text-gray-500">Cargando invitaciones...</div>
        ) : invitations.length > 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Invitaciones Pendientes
            </h2>
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <p className="text-sm text-gray-700 mb-2">
                    Invitado a: <strong>{inv.house?.name || 'Una casa'}</strong>
                  </p>
                  <button
                    onClick={() => handleAcceptInvitation(inv.id)}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-celeste-600 text-white rounded hover:bg-celeste-700 disabled:opacity-50"
                  >
                    Aceptar Invitación
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setMode('create')}
                className="text-sm text-celeste-600 hover:text-celeste-800"
              >
                O crear una nueva casa
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setMode('create')}
                className={`flex-1 px-4 py-2 rounded ${mode === 'create'
                  ? 'bg-celeste-600 text-white'
                  : 'bg-gray-100 text-gray-700'
                  }`}
              >
                Crear Casa
              </button>
              <button
                onClick={() => setMode('join')}
                className={`flex-1 px-4 py-2 rounded ${mode === 'join'
                  ? 'bg-celeste-600 text-white'
                  : 'bg-gray-100 text-gray-700'
                  }`}
              >
                Unirse
              </button>
            </div>

            {mode === 'create' ? (
              <form onSubmit={handleCreateHouse}>
                <div className="mb-4">
                  <label
                    htmlFor="houseName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nombre de la casa
                  </label>
                  <input
                    type="text"
                    id="houseName"
                    value={houseName}
                    onChange={(e) => setHouseName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-celeste-500 focus:border-celeste-500"
                    placeholder="Ej: Casa de los García"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-celeste-600 text-white rounded hover:bg-celeste-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creando...' : 'Crear Casa'}
                </button>
              </form>
            ) : (
              <div className="text-center text-gray-500">
                <p className="mb-4">
                  Para unirte a una casa, necesitas una invitación.
                </p>
                <p className="text-sm">
                  Pide al dueño de la casa que te invite usando tu email: <strong>{userEmail}</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
