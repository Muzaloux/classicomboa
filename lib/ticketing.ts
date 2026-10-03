import 'server-only'
import { createHash } from 'node:crypto'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createAdminSupabase } from './supabase/admin'
import { referenceSchema, accessTokenSchema, paymentEventSchema } from './ticketing-validation'
import { verifyPayment } from './payment-signature'
import { currentEdition } from '../data/current-edition'

export const testTicketingEnabled = () => process.env.TICKETING_MODE === 'test' && (process.env.TEST_PAYMENT_WEBHOOK_SECRET?.length ?? 0) >= 32
// Manual Mobile Money checkout is the live sales path. Keep sales closed only
// when explicitly requested, so a missing deployment variable cannot hide it.
export const manualTicketingEnabled = () => (process.env.TICKETING_MODE ?? 'manual') === 'manual'
export const ticketingEnabled = () => manualTicketingEnabled() || testTicketingEnabled()
export const accessHash = (token: string) => createHash('sha256').update(token).digest('hex')
export const orderCookie = (reference: string) => 'cm_order_' + reference.slice(3)
export async function rememberOrder(reference: string, token: string) {
  (await cookies()).set(orderCookie(reference), token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/tickets', maxAge: 60 * 60 * 24 * 30 })
}
export async function ownedOrder(reference: string) {
  if (!referenceSchema.safeParse(reference).success) notFound()
  const token = (await cookies()).get(orderCookie(reference))?.value
  if (!accessTokenSchema.safeParse(token).success) notFound()
  const { data, error } = await createAdminSupabase().from('ticket_orders').select('id,reference,edition_id,ticket_type_id,quantity,customer_name,total_xaf,currency,status,is_test,expires_at,created_at').eq('reference', reference).eq('access_hash', accessHash(token!)).eq('edition_id', currentEdition.id).maybeSingle()
  if (error) throw new Error('Commande indisponible. Réessayez.')
  if (!data) notFound()
  return { order: data, token: token! }
}
export async function ticketCatalog() {
  if (!ticketingEnabled()) return []
  const { data, error } = await createAdminSupabase().rpc('ticket_catalog', { p_edition: currentEdition.id, p_test: testTicketingEnabled() })
  if (error) throw new Error('La billetterie est momentanément indisponible.')
  return data ?? []
}
export async function processTestPayment(body: string, timestamp: string | null, signature: string | null) {
  if (!testTicketingEnabled()) return { ok: false, status: 404, message: 'Unavailable' } as const
  if (!verifyPayment(body, timestamp, signature, process.env.TEST_PAYMENT_WEBHOOK_SECRET!)) return { ok: false, status: 401, message: 'Invalid signature' } as const
  let payload: unknown
  try { payload = JSON.parse(body) } catch { return { ok: false, status: 400, message: 'Invalid event' } as const }
  const parsed = paymentEventSchema.safeParse(payload)
  if (!parsed.success) return { ok: false, status: 400, message: 'Invalid event' } as const
  const e = parsed.data
  const { data, error } = await createAdminSupabase().rpc('settle_test_payment', { p_reference: e.reference, p_event: e.event, p_amount: e.amount, p_currency: e.currency, p_outcome: e.outcome })
  if (error) return { ok: false, status: 409, message: 'Payment rejected' } as const
  return { ok: true, status: 200, result: data } as const
}
