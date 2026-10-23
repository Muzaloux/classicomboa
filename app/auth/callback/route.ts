import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabase } from '../../../lib/supabase/server'
import { supabaseConfig } from '../../../lib/supabase/config'
import { currentEdition } from '../../../data/current-edition'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = request.nextUrl.searchParams.get('next')
  if (code && supabaseConfig()) {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const access = await supabase.rpc('has_edition_role', { p_edition: currentEdition.id, p_roles: ['admin', 'manager', 'support', 'checkin', 'editor'] })
      if (!access.error && access.data === true) {
        const destination = next === 'password-reset' ? '/admin/security?recovery=1' : '/admin'
        return NextResponse.redirect(new URL(destination, request.url), { headers: { 'Cache-Control': 'private, no-store' } })
      }
      await supabase.auth.signOut({ scope: 'local' })
      return NextResponse.redirect(new URL('/auth/sign-in?error=access', request.url), { headers: { 'Cache-Control': 'private, no-store' } })
    }
  }
  return NextResponse.redirect(new URL('/auth/sign-in?error=confirmation', request.url), { headers: { 'Cache-Control': 'private, no-store' } })
}
