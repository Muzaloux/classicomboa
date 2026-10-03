'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getRoleAccess } from '../../../lib/auth'
import { voteReferenceSchema } from '../../../lib/voting-validation'
import { currentEdition } from '../../../data/current-edition'
import type { FormState } from '../../../lib/forms'

export async function confirmVotePayment(_state: FormState, form: FormData): Promise<FormState> {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) return { status: 'error', message: 'Accès refusé.' }
  const parsed = z.object({ reference: voteReferenceSchema, amount: z.coerce.number().int().nonnegative(), receipt: z.string().trim().min(6).max(100), confirmed: z.literal('on') }).safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Indiquez le montant reçu, la référence de transaction et confirmez la vérification du compte destinataire.' }
  const { data, error } = await identity.supabase.rpc('confirm_vote_payment', { p_edition: currentEdition.id, p_reference: parsed.data.reference, p_amount: parsed.data.amount, p_receipt: parsed.data.receipt })
  if (error || data !== 'paid') return { status: 'error', message: error?.message.includes('AMOUNT_MISMATCH') ? 'Le montant reçu ne correspond pas à la commande.' : error?.code === '23505' ? 'Ce reçu a déjà été utilisé pour une autre commande.' : 'Confirmation impossible. Vérifiez la commande et le reçu.' }
  revalidatePath('/admin/votes'); revalidatePath('/vote/results')
  return { status: 'success', message: 'Paiement confirmé. Les votes sont comptés.' }
}
export async function saveVoteCategory(_state: FormState, form: FormData): Promise<FormState> {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) return { status: 'error', message: 'Accès refusé.' }
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(['draft', 'open', 'closed']), results_public: z.string().optional() }).safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Statut invalide.' }
  const { error } = await identity.supabase.from('vote_categories').update({ status: parsed.data.status, results_public: parsed.data.results_public === 'on' }).eq('id', parsed.data.id).eq('edition_id', currentEdition.id)
  if (error) return { status: 'error', message: 'Modification impossible. Réessayez.' }
  revalidatePath('/admin/votes'); revalidatePath('/vote', 'layout')
  return { status: 'success', message: 'Catégorie enregistrée.' }
}
