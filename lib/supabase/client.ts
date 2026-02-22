import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseKey = publishableKey || anonKey

  if (!supabaseUrl || !supabaseKey) {
    const missing = []
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!publishableKey && !anonKey) {
      missing.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    console.error('Missing Supabase environment variables:', missing)
    throw new Error(
      `Missing Supabase environment variables: ${missing.join(', ')}. Please check your .env.local file.`
    )
  }

  if (!supabaseUrl.startsWith('http')) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}. It should start with https://`
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
