'use server'
import { randomUUID } from 'node:crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminSupabase } from '../../lib/supabase/admin'
import { accessHash, ownedOrder, processTestPayment, rememberOrder, testTicketingEnabled, manualTicketingEnabled, ticketingEnabled } from '../../lib/ticketing'
import { checkoutSchema, referenceSchema, accessTokenSchema } from '../../lib/ticketing-validation'
import { signPayment } from '../../lib/payment-signature'
import type { FormState } from '../../lib/forms'
import { currentEdition } from '../../data/current-edition'

export async function reserveOrder(_state: FormState, form: FormData): Promise<FormState> {
  if (!ticketingEnabled()) return { status: 'error', message: 'Les ventes ne sont pas ouvertes.' }
  const parsed = checkoutSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Vérifiez vos coordonnées, la quantité et votre accord.', errors: z.flattenError(parsed.error).fieldErrors }
  const v = parsed.data
  let reference: string
  try {
    const db = createAdminSupabase()
    const type = await db.from('ticket_types').select('id').eq('id', v.type).eq('edition_id', currentEdition.id).eq('is_test', testTicketingEnabled()).maybeSingle()
    if (type.error || !type.data) return { status: 'error', message: 'Cette catégorie n’est pas disponible pour cette édition.' }
    const common = { p_type: v.type, p_quantity: v.quantity, p_name: v.name, p_email: '', p_phone: v.phone, p_request: v.request, p_access_hash: accessHash(v.access) }
    const { data, error } = manualTicketingEnabled()
      ? await db.rpc('reserve_manual_ticket_order', { ...common, p_edition: currentEdition.id, p_contact: v.contact })
      : await db.rpc('reserve_ticket_order', { ...common, p_test: true })
    if (error || !data) {
      const message = error?.message.includes('SOLD_OUT') ? 'Cette quantité n’est plus disponible. Choisissez moins de billets.' : error?.message.includes('RATE_LIMITED') ? 'Trop de réservations. Réessayez plus tard.' : 'Réservation impossible. Actualisez la page et vérifiez les places disponibles.'
      return { status: 'error', message }
    }
    reference = data
    await rememberOrder(reference, v.access)
  } catch { return { status: 'error', message: 'Connexion interrompue. Réessayez avec ce formulaire : une même demande ne crée pas deux commandes.' } }
  redirect('/tickets/order/' + reference)
}
export async function simulatePayment(_state: FormState, form: FormData): Promise<FormState> {
  if (!testTicketingEnabled()) return { status: 'error', message: 'La simulation est désactivée.' }
  const reference = referenceSchema.safeParse(form.get('reference'))
  const outcome = z.enum(['successful', 'failed']).safeParse(form.get('outcome'))
  if (!reference.success || !outcome.success) return { status: 'error', message: 'Demande invalide.' }
  const { order } = await ownedOrder(reference.data)
  if (!order.is_test) return { status: 'error', message: 'Cette commande ne peut pas être simulée.' }
  const body = JSON.stringify({ reference: order.reference, event: randomUUID(), amount: order.total_xaf, currency: 'XAF', outcome: outcome.data })
  const timestamp = String(Math.floor(Date.now() / 1000))
  const result = await processTestPayment(body, timestamp, signPayment(body, timestamp, process.env.TEST_PAYMENT_WEBHOOK_SECRET!))
  revalidatePath('/tickets/order/' + order.reference)
  revalidatePath('/admin/tickets')
  if (!result.ok) return { status: 'error', message: 'Confirmation impossible. Actualisez la commande pour vérifier son état.' }
  return { status: 'success', message: result.result === 'paid' ? 'Paiement de test confirmé. Aucun montant débité.' : result.result === 'expired' ? 'La réservation a expiré. Aucune place n’a été délivrée.' : 'Paiement de test refusé. Vous pouvez créer une nouvelle commande.' }
}
export async function retrieveOrder(_state: FormState, form: FormData): Promise<FormState> {
  const reference = referenceSchema.safeParse(form.get('reference'))
  const access = accessTokenSchema.safeParse(form.get('access'))
  if (!reference.success || !access.success) return { status: 'error', message: 'Référence ou clé de récupération incorrecte.' }
  const { data, error } = await createAdminSupabase().from('ticket_orders').select('reference').eq('reference', reference.data).eq('access_hash', accessHash(access.data)).eq('edition_id', currentEdition.id).maybeSingle()
  if (error || !data) return { status: 'error', message: 'Référence ou clé de récupération incorrecte.' }
  await rememberOrder(reference.data, access.data)
  redirect('/tickets/order/' + reference.data)
}
