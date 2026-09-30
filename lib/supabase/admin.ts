import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

export function inquiriesConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// Only use for narrowly scoped backend operations; never for user-owned reads.
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase server credentials are not configured')
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
