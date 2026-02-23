'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tasks', label: 'Tareas' },
  { href: '/groups', label: 'Grupos' },
  { href: '/history', label: 'Historial' },
  { href: '/settings', label: 'Configuración' },
  { href: '/house', label: 'Mi Casa' },
] as const

export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(path)
  }

  const getLinkClassName = (path: string) => {
    const baseClasses = 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
    const activeClasses = 'border-gray-300 text-gray-700'
    const inactiveClasses = 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`
  }

  const getMobileLinkClassName = (path: string) => {
    const baseClasses = 'block px-4 py-3 text-base font-medium border-l-4'
    const activeClasses = 'border-celeste-500 bg-celeste-100 text-celeste-700'
    const inactiveClasses = 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300'
    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center" aria-label="House Work Share - Inicio">
                <svg
                  className="h-8 w-8 text-celeste-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.69Z" />
                  <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
                </svg>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className={getLinkClassName(href)}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-celeste-500"
              aria-expanded={mobileOpen}
              aria-label="Abrir menú"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span className="sr-only">Abrir menú</span>
              {mobileOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <div className="hidden sm:block">
              <LogoutButton />
            </div>
          </div>
        </div>
        {/* Menú móvil */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-gray-200 pb-4">
            <div className="pt-2 space-y-0">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={getMobileLinkClassName(href)}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 px-4">
              <LogoutButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
