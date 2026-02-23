'use client'

import type { Task } from '@/lib/db/schema'
import TaskCard from './TaskCard'

type TaskListProps = {
  tasks: Task[]
  completions: Map<string, { completed: boolean; completedAt?: string; status?: 'pending' | 'validated' }>
  today?: string
  onComplete: (taskId: string) => void
  onSwap?: (taskId: string) => void
  swaps?: Map<string, { isSwapped: boolean; swapType?: 'temporary' | 'permanent' }>
  loading?: string | null
}

export default function TaskList({
  tasks,
  completions,
  today = '',
  onComplete,
  onSwap,
  swaps,
  loading,
}: TaskListProps) {
  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay tareas asignadas</p>
      ) : (
        tasks.map((task) => {
          const key = task.frequency === 'daily' ? `${task.id}_${today}` : task.id
          const completion = completions.get(key) || { completed: false }
          const swap = swaps?.get(task.id) || { isSwapped: false }
          return (
            <TaskCard
              key={task.id}
              task={task}
              completed={completion.completed}
              completedAt={completion.completedAt}
              completionStatus={completion.status}
              onComplete={() => onComplete(task.id)}
              onSwap={onSwap ? () => onSwap(task.id) : undefined}
              isSwapped={swap.isSwapped}
              swapType={swap.swapType}
              loading={loading === task.id}
            />
          )
        })
      )}
    </div>
  )
}
