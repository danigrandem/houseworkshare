import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGroupById } from '@/lib/db/queries/groups'
import { getAllTasks } from '@/lib/db/queries/tasks'
import GroupForm from '@/components/groups/GroupForm'

export default async function EditGroupPage({
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
  const [group, tasks] = await Promise.all([getGroupById(id), getAllTasks(user.id)])

  if (!group) {
    redirect('/groups')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Editar Grupo</h1>
        <GroupForm group={group} tasks={tasks} />
      </div>
    </div>
  )
}
