'use client'

import type { Task } from '@/lib/db/schema'
import TaskCard from './TaskCard'

type TaskListProps = {
  tasks: Task[]
  completions: Map<string, { completed: boolean; completedAt?: string }>
  onComplete: (taskId: string) => void
  onSwap?: (taskId: string) => void
  swaps?: Map<string, { isSwapped: boolean; swapType?: 'temporary' | 'permanent' }>
}

export default function TaskList({
  tasks,
  completions,
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
          const completion = completions.get(task.id) || { completed: false }
          const swap = swaps?.get(task.id) || { isSwapped: false }
          return (
            <TaskCard
              key={task.id}
              task={task}
              completed={completion.completed}
              completedAt={completion.completedAt}
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
