'use server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminSupabase } from '../../lib/supabase/admin'
import { accessHash } from '../../lib/ticketing'
import { rememberTombola, tombolaEnabled } from '../../lib/tombola'
import { tombolaSchema } from '../../lib/tombola-validation'
import type { FormState } from '../../lib/forms'
import { currentEdition } from '../../data/current-edition'

export async function joinTombola(_state: FormState, form: FormData): Promise<FormState> {
  if (!tombolaEnabled()) return { status: 'error', message: 'La tombola n’est pas ouverte.' }
  const parsed = tombolaSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Vérifiez le nombre de participations, vos coordonnées et votre accord.', errors: z.flattenError(parsed.error).fieldErrors }
  const v = parsed.data
  let reference: string
  try {
    const { data, error } = await createAdminSupabase().rpc('reserve_tombola_order', { p_edition: currentEdition.id, p_draw: v.draw, p_quantity: v.quantity, p_name: v.name, p_phone: v.phone, p_request: v.request, p_access_hash: accessHash(v.access), p_contact: v.contact })
    if (error || !data) return { status: 'error', message: error?.message.includes('TOMBOLA_CLOSED') ? 'Cette tombola n’est plus ouverte.' : error?.message.includes('RATE_LIMITED') ? 'Trop de demandes. Réessayez plus tard.' : 'Participation impossible. Actualisez la page et réessayez.' }
    reference = data
    await rememberTombola(reference, v.access)
  } catch { return { status: 'error', message: 'Connexion interrompue. Réessayez avec ce formulaire : une même demande ne crée pas deux commandes.' } }
  redirect('/tombola/order/' + reference)
}
