'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { inviteUser } from '@/app/actions/houses'
import type { HouseWithMembers, HouseInvitation } from '@/lib/db/schema'

type HouseClientProps = {
  house: HouseWithMembers
  invitations: HouseInvitation[]
  currentUserId: string
}

export default function HouseClient({ house, invitations, currentUserId }: HouseClientProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isOwner = house.members.some(
    (m) => m.user_id === currentUserId && m.role === 'owner'
  )

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await inviteUser(house.id, email)
      setSuccess('Invitación enviada correctamente')
      setEmail('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la invitación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-celeste-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{house.name}</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Miembros</h2>
          <div className="space-y-2">
            {house.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {member.user.name || member.user.email}
                  </p>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded bg-celeste-100 text-celeste-800">
                  {member.role === 'owner' ? 'Dueño' : 'Miembro'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isOwner && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Invitar Usuario
              </h2>
              <form onSubmit={handleInvite}>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="email@ejemplo.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-celeste-500 focus:border-celeste-500"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-celeste-600 text-white rounded hover:bg-celeste-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enviando...' : 'Invitar'}
                  </button>
                </div>
              </form>
              {error && (
                <div className="mt-2 text-sm text-red-600">{error}</div>
              )}
              {success && (
                <div className="mt-2 text-sm text-green-600">{success}</div>
              )}
            </div>

            {invitations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Invitaciones Pendientes
                </h2>
                <div className="space-y-2">
                  {invitations
                    .filter((inv) => inv.status === 'pending')
                    .map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {inv.invited_email}
                          </p>
                          <p className="text-sm text-gray-500">
                            Enviada el {new Date(inv.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                          Pendiente
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
