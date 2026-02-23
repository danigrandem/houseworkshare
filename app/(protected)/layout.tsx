export const dynamic = 'force-dynamic'
export const revalidate = 0
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserHouse } from '@/lib/db/queries/houses'
import { Header } from '@/components/layout/Header'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isSetupHousePage = pathname === '/setup-house'

  const currentHouse = await getCurrentUserHouse(user.id)
  if (!currentHouse && !isSetupHousePage) {
    redirect('/setup-house')
  }

  return (
    <div className="min-h-screen">
      <Header />
      {children}
    </div>
  )
}
