import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TaskForm from '@/components/tasks/TaskForm'

export default async function NewTaskPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Nueva Tarea</h1>
        <TaskForm />
      </div>
    </div>
  )
}
