import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTaskById } from '@/lib/db/queries/tasks'
import TaskForm from '@/components/tasks/TaskForm'

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const task = await getTaskById(id)

  if (!task) {
    redirect('/tasks')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Editar Tarea</h1>
        <TaskForm task={task} />
      </div>
    </div>
  )
}
