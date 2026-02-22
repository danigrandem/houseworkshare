'use client'

import type { TaskSwapWithTask } from '@/lib/db/schema'
import { formatDateTime } from '@/lib/utils/date'
import { acceptTaskSwap, rejectTaskSwap } from '@/app/actions/swaps'

type SwapNotificationProps = {
  swap: TaskSwapWithTask
  onResponse: () => void
}

export default function SwapNotification({ swap, onResponse }: SwapNotificationProps) {
  const handleAccept = async () => {
    try {
      await acceptTaskSwap(swap.id)
      onResponse()
    } catch (error) {
      console.error('Error accepting swap:', error)
      alert('Error al aceptar el intercambio')
    }
  }

  const handleReject = async () => {
    try {
      await rejectTaskSwap(swap.id)
      onResponse()
    } catch (error) {
      console.error('Error rejecting swap:', error)
      alert('Error al rechazar el intercambio')
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900">
            Solicitud de intercambio de {swap.task.name}
          </h3>
          <p className="text-xs text-blue-700 mt-1">
            De: {swap.from_user.name || swap.from_user.email}
          </p>
          <p className="text-xs text-blue-700">
            Tipo: {swap.swap_type === 'temporary' ? 'Temporal' : 'Permanente'}
            {swap.swap_date && ` - Fecha: ${swap.swap_date}`}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {formatDateTime(swap.requested_at)}
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={handleAccept}
            className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
          >
            Aceptar
          </button>
          <button
            onClick={handleReject}
            className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  )
}
