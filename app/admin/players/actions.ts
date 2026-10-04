'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getRoleAccess } from '../../../lib/auth'
import { playerReferenceSchema } from '../../../lib/players-validation'
import { currentEdition } from '../../../data/current-edition'
import type { FormState } from '../../../lib/forms'

export async function confirmPlayerPayment(_state: FormState, form: FormData): Promise<FormState> {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) return { status: 'error', message: 'Accès refusé.' }
  const parsed = z.object({ reference: playerReferenceSchema, amount: z.coerce.number().int().nonnegative(), receipt: z.string().trim().min(6).max(100), confirmed: z.literal('on') }).safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Indiquez le montant reçu, la référence de transaction et confirmez la vérification du compte destinataire.' }
  const { data, error } = await identity.supabase.rpc('confirm_player_payment', { p_edition: currentEdition.id, p_reference: parsed.data.reference, p_amount: parsed.data.amount, p_receipt: parsed.data.receipt })
  if (error || data !== 'paid') return { status: 'error', message: error?.message.includes('AMOUNT_MISMATCH') ? 'Le montant reçu ne correspond pas aux frais d’inscription (paiement intégral requis).' : error?.code === '23505' ? 'Ce reçu a déjà été utilisé pour une autre inscription.' : 'Confirmation impossible. Vérifiez l’inscription et le reçu.' }
  revalidatePath('/admin/players'); revalidatePath('/joueurs', 'layout')
  return { status: 'success', message: 'Paiement confirmé. Le joueur est inscrit.' }
}
export async function approvePlayer(_state: FormState, form: FormData): Promise<FormState> {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) return { status: 'error', message: 'Accès refusé.' }
  const parsed = z.object({ reference: playerReferenceSchema, decision: z.enum(['approved', 'rejected']) }).safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Demande invalide.' }
  const { data, error } = await identity.supabase.rpc('review_player_registration', { p_edition: currentEdition.id, p_reference: parsed.data.reference, p_decision: parsed.data.decision })
  if (error || data !== parsed.data.decision) return { status: 'error', message: 'Cette demande ne peut plus être modifiée.' }
  revalidatePath('/admin/players'); revalidatePath('/joueurs/order/' + parsed.data.reference)
  return { status: 'success', message: parsed.data.decision === 'approved' ? 'Demande approuvée. Le joueur peut maintenant effectuer sa contribution.' : 'Demande refusée.' }
}
export async function savePlayerSettings(_state: FormState, form: FormData): Promise<FormState> {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) return { status: 'error', message: 'Accès refusé.' }
  const parsed = z.object({ is_open: z.string().optional() }).safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Réglage invalide.' }
  const { error } = await identity.supabase.from('player_registration_settings').update({ fee_xaf: 16000, is_open: parsed.data.is_open === 'on' }).eq('edition_id', currentEdition.id)
  if (error) return { status: 'error', message: 'Modification impossible.' }
  revalidatePath('/admin/players'); revalidatePath('/joueurs', 'layout')
  return { status: 'success', message: 'Ouverture des inscriptions mise à jour. Contribution fixe : 16 000 XAF.' }
}
