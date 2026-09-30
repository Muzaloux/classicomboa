import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseConfig } from './config'
import type { Database } from '../../types/database'

export async function createServerSupabase() {
  const config = supabaseConfig()
  if (!config) throw new Error('Supabase is not configured')
  const store = await cookies()
  return createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)) }
        catch { /* Server Components are read-only; proxy refreshes their session. */ }
      },
    },
  })
}
