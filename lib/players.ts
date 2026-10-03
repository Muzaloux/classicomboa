import 'server-only'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createHash } from 'node:crypto'
import { createAdminSupabase } from './supabase/admin'
import { accessTokenSchema } from './ticketing-validation'
import { playerReferenceSchema } from './players-validation'
import { paymentContacts } from './manual-payment'
import { currentEdition } from '../data/current-edition'

export const playerRegistrationEnabled = () => process.env.PLAYER_REGISTRATION_MODE === 'manual' || process.env.TICKETING_MODE === 'manual'
export const playerCookie = (reference: string) => 'cm_player_' + reference
export async function rememberPlayer(reference: string, token: string) {
  (await cookies()).set(playerCookie(reference), token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/joueurs', maxAge: 60 * 60 * 24 * 60 })
}
export async function ownedPlayer(reference: string) {
  if (!playerReferenceSchema.safeParse(reference).success) notFound()
  const token = (await cookies()).get(playerCookie(reference))?.value
  if (!accessTokenSchema.safeParse(token).success) notFound()
  const { data, error } = await createAdminSupabase().from('player_registrations').select('reference,club,player_name,amount_xaf,status,contact').eq('reference', reference).eq('access_hash', createHash('sha256').update(token!).digest('hex')).eq('edition_id', currentEdition.id).maybeSingle()
  if (error) throw new Error('Inscription indisponible. Réessayez.')
  if (!data) notFound()
  return data
}
export async function registrationSettings() {
  const { data } = await createAdminSupabase().from('player_registration_settings').select('is_open,fee_xaf').eq('edition_id', currentEdition.id).maybeSingle()
  return data
}
export function playerWhatsAppUrl(contact: keyof typeof paymentContacts, order: { reference: string; amount_xaf: number; player_name: string; club: string }) {
  const recipient = paymentContacts[contact]
  const text = `Bonjour ${recipient.name}, je souhaite payer par ${recipient.provider} mon inscription joueur Classico Mboa.\nRéférence : ${order.reference}\nNom : ${order.player_name}\nClub : ${order.club}\nMontant : ${order.amount_xaf} XAF`
  return `https://wa.me/${recipient.contactNumber}?text=${encodeURIComponent(text)}`
}
