import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserHouse, getHouseInvitations } from '@/lib/db/queries/houses'
import HouseClient from '@/components/houses/HouseClient'

export default async function HousePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const currentHouse = await getCurrentUserHouse(user.id)
  if (!currentHouse) {
    redirect('/setup-house')
  }

  const invitations = await getHouseInvitations(currentHouse.id)

  return (
    <HouseClient
      house={currentHouse}
      invitations={invitations}
      currentUserId={user.id}
    />
  )
}
