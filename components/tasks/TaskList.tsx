'use client'

import type { Task } from '@/lib/db/schema'
import TaskCard from './TaskCard'

type TaskListProps = {
  tasks: Task[]
  completions: Map<string, { completed: boolean; completedAt?: string; status?: 'pending' | 'validated' }>
  /** For weekly tasks with weekly_minimum: taskId -> number of completions this week */
  weeklyCompletionCounts?: Map<string, number>
  today?: string
  onComplete?: (taskId: string) => void
  onSwap?: (taskId: string) => void
  swaps?: Map<string, { isSwapped: boolean; swapType?: 'temporary' | 'permanent' }>
  loading?: string | null
}

export default function TaskList({
  tasks,
  completions,
  weeklyCompletionCounts,
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
          const weeklyCount = weeklyCompletionCounts?.get(task.id)
          return (
            <TaskCard
              key={task.id}
              task={task}
              completed={completion.completed}
              completedAt={completion.completedAt}
              completionStatus={completion.status}
              weeklyCompletionCount={weeklyCount}
              onComplete={onComplete ? () => onComplete(task.id) : undefined}
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
