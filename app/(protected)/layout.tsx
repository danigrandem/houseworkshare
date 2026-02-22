export const dynamic = 'force-dynamic'
export const revalidate = 0
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserHouse } from '@/lib/db/queries/houses'
import LogoutButton from '@/components/auth/LogoutButton'
import Link from 'next/link'

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

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(path)
  }

  const getLinkClassName = (path: string) => {
    const baseClasses = "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    const activeClasses = "border-gray-300 text-gray-700"
    const inactiveClasses = "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"

    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`
  }
  console.log("jooooder")
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">House Work Share</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className={getLinkClassName('/dashboard')}
                >
                  Dashboard
                </Link>
                <Link
                  href="/tasks"
                  className={getLinkClassName('/tasks')}
                >
                  Tareas
                </Link>
                <Link
                  href="/groups"
                  className={getLinkClassName('/groups')}
                >
                  Grupos
                </Link>
                <Link
                  href="/history"
                  className={getLinkClassName('/history')}
                >
                  Historial
                </Link>
                <Link
                  href="/settings"
                  className={getLinkClassName('/settings')}
                >
                  Configuración
                </Link>
                <Link
                  href="/house"
                  className={getLinkClassName('/house')}
                >
                  Mi Casa
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
