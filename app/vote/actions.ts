'use server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminSupabase } from '../../lib/supabase/admin'
import { accessHash } from '../../lib/ticketing'
import { rememberVote, votingEnabled } from '../../lib/voting'
import { voteSchema } from '../../lib/voting-validation'
import type { FormState } from '../../lib/forms'
import { currentEdition } from '../../data/current-edition'

export async function castVote(_state: FormState, form: FormData): Promise<FormState> {
  if (!votingEnabled()) return { status: 'error', message: 'Les votes ne sont pas ouverts.' }
  const parsed = voteSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Vérifiez le candidat, le nombre de votes, vos coordonnées et votre accord.', errors: z.flattenError(parsed.error).fieldErrors }
  const v = parsed.data
  let reference: string
  try {
    const { data, error } = await createAdminSupabase().rpc('reserve_vote_order', { p_edition: currentEdition.id, p_candidate: v.candidate, p_quantity: v.quantity, p_name: v.name, p_phone: v.phone, p_request: v.request, p_access_hash: accessHash(v.access), p_contact: v.contact })
    if (error || !data) return { status: 'error', message: error?.message.includes('VOTING_CLOSED') ? 'Cette catégorie n’est plus ouverte au vote.' : error?.message.includes('RATE_LIMITED') ? 'Trop de demandes. Réessayez plus tard.' : 'Vote impossible. Actualisez la page et réessayez.' }
    reference = data
    await rememberVote(reference, v.access)
  } catch { return { status: 'error', message: 'Connexion interrompue. Réessayez avec ce formulaire : une même demande ne crée pas deux commandes.' } }
  redirect('/vote/order/' + reference)
}
