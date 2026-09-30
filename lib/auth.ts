import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { supabaseConfig } from './supabase/config'
import { createServerSupabase } from './supabase/server'

export const getIdentity = cache(async () => {
  if (!supabaseConfig()) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return { supabase, user: data.user }
})

export async function requireIdentity() {
  const identity = await getIdentity()
  if (!identity) redirect('/auth/sign-in')
  return identity
}

export async function getStaffAccess(editionId: string) {
  const identity = await requireIdentity()
  const { data, error } = await identity.supabase.rpc('can_manage_inquiries', { target_edition: editionId })
  return !error && data === true ? identity : null
}

export async function getRoleAccess(editionId: string, roles: string[]) {
  const identity = await requireIdentity()
  const { data, error } = await identity.supabase.rpc('has_edition_role', { p_edition: editionId, p_roles: roles })
  return !error && data === true ? identity : null
}
