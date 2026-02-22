import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllTasks } from '@/lib/db/queries/tasks'
import TasksList from '@/components/tasks/TasksList'

export default async function TasksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const tasks = await getAllTasks(user.id)

  return <TasksList tasks={tasks} />
}
