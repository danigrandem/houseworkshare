import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'House Work Share',
    short_name: 'House Work Share',
    description: 'Sistema de gestión de tareas domésticas con puntos',
    start_url: '/',
    display: 'standalone',
    background_color: '#e6f4ff',
    theme_color: '#0095e6',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'es',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'House Work Share en escritorio',
      },
      {
        src: '/screenshots/narrow.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'House Work Share en móvil',
      },
    ],
  }
}
