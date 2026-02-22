import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserHouse } from '@/lib/db/queries/houses'
import SetupHouseClient from '@/components/houses/SetupHouseClient'

export default async function SetupHousePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const currentHouse = await getCurrentUserHouse(user.id)

  if (currentHouse) {
    redirect('/dashboard')
  }

  return <SetupHouseClient userId={user.id} userEmail={user.email!} />
}
