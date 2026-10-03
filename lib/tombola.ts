import 'server-only'
import { createHash } from 'node:crypto'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createAdminSupabase } from './supabase/admin'
import { accessTokenSchema } from './ticketing-validation'
import { tombolaReferenceSchema } from './tombola-validation'
import { paymentContacts } from './manual-payment'
import { currentEdition } from '../data/current-edition'

export const tombolaEnabled = () => process.env.TOMBOLA_MODE === 'manual' || process.env.TICKETING_MODE === 'manual'
export const tombolaCookie = (reference: string) => 'cm_tombola_' + reference.replace(/^C[MVT]-/, '')
export async function rememberTombola(reference: string, token: string) {
  (await cookies()).set(tombolaCookie(reference), token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/tombola', maxAge: 60 * 60 * 24 * 60 })
}
export async function ownedTombola(reference: string) {
  if (!tombolaReferenceSchema.safeParse(reference).success) notFound()
  const token = (await cookies()).get(tombolaCookie(reference))?.value
  if (!accessTokenSchema.safeParse(token).success) notFound()
  const { data, error } = await createAdminSupabase().from('tombola_orders').select('id,reference,quantity,buyer_name,total_xaf,status,contact,expires_at,draw_id').eq('reference', reference).eq('access_hash', createHash('sha256').update(token!).digest('hex')).eq('edition_id', currentEdition.id).maybeSingle()
  if (error) throw new Error('Commande indisponible. Réessayez.')
  if (!data) notFound()
  return data
}
export async function openDraws() {
  if (!tombolaEnabled()) return []
  const { data, error } = await createAdminSupabase().from('tombola_draws').select('id,name,prize,price_xaf').eq('edition_id', currentEdition.id).eq('status', 'open').order('sort_order')
  if (error) { console.error('tombola unavailable', error.code); return [] }
  return data
}
export function tombolaWhatsAppUrl(contact: keyof typeof paymentContacts, order: { reference: string; quantity: number; total_xaf: number; buyer_name: string }) {
  const recipient = paymentContacts[contact]
  const text = `Bonjour ${recipient.name}, je souhaite payer par ${recipient.provider} mes participations à la tombola Classico Mboa.\nRéférence : ${order.reference}\nNom : ${order.buyer_name}\nParticipations : ${order.quantity}\nMontant : ${order.total_xaf} XAF`
  return `https://wa.me/${recipient.contactNumber}?text=${encodeURIComponent(text)}`
}
