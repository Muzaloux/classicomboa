'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getRoleAccess } from '../../../lib/auth'
import { tombolaReferenceSchema } from '../../../lib/tombola-validation'
import { currentEdition } from '../../../data/current-edition'
import type { FormState } from '../../../lib/forms'

const refresh = () => { revalidatePath('/admin/tombola'); revalidatePath('/tombola', 'layout') }
export async function confirmTombolaPayment(_state: FormState, form: FormData): Promise<FormState> {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) return { status: 'error', message: 'Accès refusé.' }
  const parsed = z.object({ reference: tombolaReferenceSchema, amount: z.coerce.number().int().nonnegative(), receipt: z.string().trim().min(6).max(100), confirmed: z.literal('on') }).safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Indiquez le montant reçu, la référence de transaction et confirmez la vérification du compte destinataire.' }
  const { data, error } = await identity.supabase.rpc('confirm_tombola_payment', { p_edition: currentEdition.id, p_reference: parsed.data.reference, p_amount: parsed.data.amount, p_receipt: parsed.data.receipt })
  if (error || data !== 'paid') return { status: 'error', message: error?.message.includes('AMOUNT_MISMATCH') ? 'Le montant reçu ne correspond pas à la commande.' : error?.message.includes('DRAW_DONE') ? 'Le tirage a déjà eu lieu : ce paiement ne peut plus être validé. Contactez le client.' : error?.code === '23505' ? 'Ce reçu a déjà été utilisé pour une autre commande.' : 'Confirmation impossible. Vérifiez la commande et le reçu.' }
  refresh()
  return { status: 'success', message: 'Paiement confirmé. Les numéros sont attribués.' }
}
export async function saveDraw(_state: FormState, form: FormData): Promise<FormState> {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) return { status: 'error', message: 'Accès refusé.' }
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(['draft', 'open', 'closed']), prize: z.string().trim().min(2).max(300), winners_count: z.coerce.number().int().min(1).max(100), results_public: z.string().optional() }).safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Vérifiez le statut, les lots et le nombre de gagnants.' }
  const { data, error } = await identity.supabase.from('tombola_draws').update({ status: parsed.data.status, prize: parsed.data.prize, winners_count: parsed.data.winners_count, results_public: parsed.data.results_public === 'on' }).eq('id', parsed.data.id).eq('edition_id', currentEdition.id).select('id')
  if (error || !data?.length) return { status: 'error', message: 'Modification impossible. Un tirage déjà effectué ne peut plus être modifié.' }
  refresh()
  return { status: 'success', message: 'Tombola enregistrée.' }
}
export async function runDraw(_state: FormState, form: FormData): Promise<FormState> {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) return { status: 'error', message: 'Accès refusé.' }
  const parsed = z.object({ id: z.string().uuid(), confirmed: z.literal('on') }).safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Confirmez que vous souhaitez lancer le tirage définitif.' }
  const { data, error } = await identity.supabase.rpc('draw_tombola', { p_edition: currentEdition.id, p_draw: parsed.data.id })
  const m = error?.message ?? ''
  if (error) return { status: 'error', message: m.includes('CLOSE_FIRST') ? 'Clôturez d’abord la tombola (statut « Clôturée »).' : m.includes('PENDING_PAYMENTS') ? 'Des paiements sont encore en attente (moins de 2 h). Confirmez-les ou attendez leur expiration.' : m.includes('NO_ENTRIES') ? 'Aucune participation confirmée : tirage impossible.' : m.includes('ALREADY_DRAWN') ? 'Le tirage a déjà été effectué.' : 'Tirage impossible. Réessayez.' }
  refresh()
  return { status: 'success', message: `Tirage effectué : ${data} gagnant(s). Cochez « Publier les gagnants » pour les afficher.` }
}
