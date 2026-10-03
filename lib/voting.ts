import 'server-only'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createAdminSupabase } from './supabase/admin'
import { accessTokenSchema } from './ticketing-validation'
import { voteReferenceSchema } from './voting-validation'
import { paymentContacts } from './manual-payment'
import { currentEdition } from '../data/current-edition'

export const votingEnabled = () => process.env.VOTING_MODE === 'manual' || process.env.TICKETING_MODE === 'manual'
export const voteCookie = (reference: string) => 'cm_vote_' + reference.replace(/^C[MVT]-/, '')
export async function rememberVote(reference: string, token: string) {
  (await cookies()).set(voteCookie(reference), token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/vote', maxAge: 60 * 60 * 24 * 30 })
}
export async function ownedVote(reference: string) {
  if (!voteReferenceSchema.safeParse(reference).success) notFound()
  const token = (await cookies()).get(voteCookie(reference))?.value
  if (!accessTokenSchema.safeParse(token).success) notFound()
  const { createHash } = await import('node:crypto')
  const { data, error } = await createAdminSupabase().from('vote_orders').select('id,reference,quantity,voter_name,total_xaf,status,contact,expires_at,candidate_id,category_id').eq('reference', reference).eq('access_hash', createHash('sha256').update(token!).digest('hex')).eq('edition_id', currentEdition.id).maybeSingle()
  if (error) throw new Error('Commande indisponible. Réessayez.')
  if (!data) notFound()
  return data
}
export async function openCategories() {
  if (!votingEnabled()) return []
  const db = createAdminSupabase()
  const [cats, cands] = await Promise.all([
    db.from('vote_categories').select('id,name,price_xaf,sort_order').eq('edition_id', currentEdition.id).eq('status', 'open').order('sort_order'),
    db.from('vote_candidates').select('id,category_id,name,subtitle,sort_order').order('sort_order'),
  ])
  if (cats.error || cands.error) { console.error('vote catalog unavailable', cats.error?.code ?? cands.error?.code); return [] }
  return cats.data.map(c => ({ ...c, candidates: cands.data.filter(k => k.category_id === c.id) }))
}
export function voteWhatsAppUrl(contact: keyof typeof paymentContacts, order: { reference: string; quantity: number; total_xaf: number; voter_name: string }) {
  const recipient = paymentContacts[contact]
  const text = `Bonjour ${recipient.name}, je souhaite payer par ${recipient.provider} mes votes Classico Mboa.\nRéférence : ${order.reference}\nNom : ${order.voter_name}\nVotes : ${order.quantity}\nMontant : ${order.total_xaf} XAF`
  return `https://wa.me/${recipient.contactNumber}?text=${encodeURIComponent(text)}`
}
