import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllGroups } from '@/lib/db/queries/groups'
import GroupsList from '@/components/groups/GroupsList'

export default async function GroupsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const groups = await getAllGroups(user.id)

  return <GroupsList groups={groups} />
}
