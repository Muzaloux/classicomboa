'use server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminSupabase } from '../../lib/supabase/admin'
import { accessHash } from '../../lib/ticketing'
import { playerRegistrationEnabled, rememberPlayer } from '../../lib/players'
import { playerSchema } from '../../lib/players-validation'
import type { FormState } from '../../lib/forms'
import { currentEdition } from '../../data/current-edition'

export async function registerPlayer(_state: FormState, form: FormData): Promise<FormState> {
  if (!playerRegistrationEnabled()) return { status: 'error', message: 'Les inscriptions ne sont pas ouvertes.' }
  const parsed = playerSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Vérifiez votre club, votre nom, votre numéro de téléphone et votre accord.', errors: z.flattenError(parsed.error).fieldErrors }
  const v = parsed.data
  let reference: string
  try {
    const { data, error } = await createAdminSupabase().rpc('reserve_player_registration', { p_edition: currentEdition.id, p_club: v.club, p_name: v.name, p_phone: v.phone, p_request: v.request, p_access_hash: accessHash(v.access), p_contact: v.contact })
    const m = error?.message ?? ''
    if (error || !data) return { status: 'error', message: m.includes('REGISTRATION_CLOSED') ? 'Les inscriptions des joueurs sont closes.' : m.includes('ALREADY_REGISTERED') ? 'Ce numéro est déjà inscrit. Contactez l’organisation si vous avez perdu votre référence.' : m.includes('RATE_LIMITED') ? 'Trop de demandes. Réessayez plus tard.' : 'Inscription impossible. Actualisez la page et réessayez.' }
    reference = data
    await rememberPlayer(reference, v.access)
  } catch { return { status: 'error', message: 'Connexion interrompue. Réessayez avec ce formulaire : une même demande ne crée pas deux inscriptions.' } }
  redirect('/joueurs/order/' + reference)
}
