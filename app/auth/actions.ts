'use server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServerSupabase } from '../../lib/supabase/server'
import { supabaseConfig } from '../../lib/supabase/config'
import { emailSchema } from '../../lib/validation'
import type { FormState } from '../../lib/forms'
import { currentEdition } from '../../data/current-edition'

const authSchema = z.object({
  mode: z.enum(['password', 'send-code', 'verify-code']),
  email: emailSchema,
  password: z.string().max(128).optional(),
  token: z.string().trim().optional(),
}).superRefine((value, ctx) => {
  if (value.mode === 'password' && (!value.password || value.password.length < 1)) {
    ctx.addIssue({ code: 'custom', path: ['password'], message: 'Indiquez votre mot de passe.' })
  }
  if (value.mode === 'verify-code' && !/^\d{6,8}$/.test(value.token ?? '')) {
    ctx.addIssue({ code: 'custom', path: ['token'], message: 'Indiquez le code reçu par e-mail.' })
  }
})

export async function authenticate(_previous: FormState, form: FormData): Promise<FormState> {
  const parsed = authSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Vérifiez vos informations.', errors: z.flattenError(parsed.error).fieldErrors }
  if (!supabaseConfig()) return { status: 'error', message: 'La connexion aux comptes n’est pas encore disponible.' }
  const value = parsed.data
  let signedIn = false
  try {
    const supabase = await createServerSupabase()
    if (value.mode === 'send-code') {
      const { error } = await supabase.auth.signInWithOtp({ email: value.email, options: { shouldCreateUser: false } })
      // Identical response for unknown accounts and accepted requests prevents enumeration.
      if (error?.status === 429) return { status: 'error', message: 'Veuillez patienter avant de demander un autre code.' }
      return { status: 'success', message: 'Si un compte existe pour cette adresse, un code de connexion sera envoyé. Consultez aussi les courriers indésirables.' }
    }
    const { error } = value.mode === 'verify-code'
      ? await supabase.auth.verifyOtp({ email: value.email, token: value.token!, type: 'email' })
      : await supabase.auth.signInWithPassword({ email: value.email, password: value.password! })
    if (error) return { status: 'error', message: 'Connexion refusée. Vérifiez vos identifiants, la confirmation de votre e-mail ou la validité du code.' }
    const access = await supabase.rpc('has_edition_role', { p_edition: currentEdition.id, p_roles: ['admin', 'manager', 'support', 'checkin', 'editor'] })
    if (access.error || access.data !== true) {
      await supabase.auth.signOut({ scope: 'local' })
      return { status: 'error', message: 'Cet accès est réservé aux organisateurs autorisés pour cette édition.' }
    }
    signedIn = true
  } catch {
    return { status: 'error', message: 'Le service de connexion est momentanément indisponible.' }
  }
  if (signedIn) redirect('/admin')
  return { status: 'error', message: 'Connexion impossible pour le moment.' }
}

export async function signOut() {
  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) throw new Error('Déconnexion impossible. Réessayez.')
  redirect('/auth/sign-in')
}
