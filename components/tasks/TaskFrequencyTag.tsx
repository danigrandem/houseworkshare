'use client'

import type { TaskFrequency } from '@/lib/db/schema'

type TaskFrequencyTagProps = {
  frequency: TaskFrequency
  className?: string
}

export default function TaskFrequencyTag({ frequency, className = '' }: TaskFrequencyTagProps) {
  const isDaily = frequency === 'daily'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isDaily
          ? 'bg-amber-100 text-amber-800'
          : 'bg-slate-100 text-slate-700'
      } ${className}`}
    >
      {isDaily ? 'Diario' : 'Semanal'}
    </span>
  )
}
