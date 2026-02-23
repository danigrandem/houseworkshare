import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllTasks } from '@/lib/db/queries/tasks'
import GroupForm from '@/components/groups/GroupForm'

export default async function NewGroupPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const tasks = await getAllTasks(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Nuevo Grupo</h1>
        <GroupForm tasks={tasks} />
      </div>
    </div>
  )
}
