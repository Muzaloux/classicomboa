'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getRoleAccess } from '../../../lib/auth'
import { currentEdition } from '../../../data/current-edition'
import type { FormState } from '../../../lib/forms'

const typeSchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(2).max(100), price: z.coerce.number().int().min(0).max(10000000), capacity: z.coerce.number().int().min(0).max(1000000), status: z.enum(['draft', 'active', 'paused', 'closed']) })
export async function confirmManualPayment(_state: FormState, form: FormData): Promise<FormState> {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) return { status: 'error', message: 'Accès refusé.' }
  const parsed = z.object({ reference: z.string().regex(/^(CM-[a-f0-9]{32}|[A-HJ-NP-Z2-9]{6})$/), amount: z.coerce.number().int().nonnegative(), receipt: z.string().trim().min(6).max(100), confirmed: z.literal('on') }).safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Indiquez le montant reçu, la référence de transaction et confirmez la vérification du compte destinataire.' }
  const { data, error } = await identity.supabase.rpc('confirm_manual_payment', { p_edition: currentEdition.id, p_reference: parsed.data.reference, p_amount: parsed.data.amount, p_receipt: parsed.data.receipt })
  if (error || data !== 'paid') return { status: 'error', message: error?.message.includes('AMOUNT_MISMATCH') ? 'Le montant reçu ne correspond pas à la commande.' : error?.message.includes('SOLD_OUT') ? 'Plus assez de places : ne délivrez pas de billet. Contactez le client pour résoudre ce paiement.' : error?.code === '23505' ? 'Ce reçu a déjà été utilisé pour une autre commande.' : 'Confirmation impossible. Vérifiez la commande et le reçu.' }
  revalidatePath('/admin/tickets', 'layout'); revalidatePath('/tickets', 'layout')
  return { status: 'success', message: 'Paiement confirmé et billets délivrés. Le client peut actualiser sa commande.' }
}
export async function saveTicketType(_state: FormState, form: FormData): Promise<FormState> {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) return { status: 'error', message: 'Accès refusé.' }
  const parsed = typeSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Vérifiez le nom, le tarif, la capacité et le statut.' }
  const v = parsed.data
  const { error } = await identity.supabase.rpc('configure_ticket_type', { p_id: v.id, p_edition: currentEdition.id, p_name: v.name, p_price: v.price, p_capacity: v.capacity, p_status: v.status })
  if (error) return { status: 'error', message: error.message.includes('CAPACITY_BELOW_ALLOCATED') ? 'La capacité ne peut pas être inférieure aux places déjà réservées ou vendues.' : 'Modification impossible. Réessayez.' }
  revalidatePath('/admin/tickets'); revalidatePath('/tickets')
  return { status: 'success', message: 'Catégorie mise à jour. Les commandes existantes conservent leur tarif.' }
}
export async function cancelTicket(_state: FormState, form: FormData): Promise<FormState> {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity || form.get('confirm') !== 'on') return { status: 'error', message: 'Confirmez l’annulation avec un compte autorisé.' }
  const code = z.string().regex(/^TKT-[A-F0-9]{16}$/).safeParse(form.get('code'))
  if (!code.success) return { status: 'error', message: 'Code incorrect.' }
  const { error } = await identity.supabase.rpc('void_ticket', { p_code: code.data, p_edition: currentEdition.id })
  if (error) return { status: 'error', message: error.message.includes('ALREADY_USED') ? 'Un billet déjà utilisé ne peut pas être annulé.' : 'Annulation impossible.' }
  revalidatePath('/admin/tickets', 'layout'); revalidatePath('/tickets', 'layout')
  return { status: 'success', message: 'Billet annulé. Aucun remboursement automatique ni remise en stock.' }
}
export async function scanTicket(_state: FormState, form: FormData): Promise<FormState> {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager', 'checkin'])
  if (!identity) return { status: 'error', message: 'Accès refusé.' }
  const parsed = z.object({ code: z.string().trim().min(1).max(100), gate: z.string().trim().min(1).max(60), mode: z.enum(['test', 'live']) }).safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Indiquez le code, la porte et le mode de contrôle.' }
  const { data, error } = await identity.supabase.rpc('check_in_ticket', { p_edition: currentEdition.id, p_input: parsed.data.code, p_gate: parsed.data.gate, p_test: parsed.data.mode === 'test' })
  if (error) return { status: 'error', message: error.message.includes('RATE_LIMITED') ? 'Trop de tentatives. Patientez une minute.' : 'Contrôle impossible. N’autorisez pas l’entrée sans validation ; réessayez.' }
  const result = data as { result: string; holder_name?: string; ticket_code?: string }
  const messages: Record<string, string> = { accepted: 'Billet validé', already_used: 'REFUSÉ — billet déjà utilisé', invalid: 'REFUSÉ — billet introuvable', void: 'REFUSÉ — billet annulé', wrong_mode: 'REFUSÉ — billet incompatible avec le mode choisi' }
  revalidatePath('/admin/tickets')
  return { status: result.result === 'accepted' ? 'success' : 'error', message: `${parsed.data.mode === 'test' ? '[TEST — aucune entrée réelle] ' : ''}${messages[result.result] ?? 'Contrôle refusé'}${result.ticket_code ? ' · ' + result.ticket_code : ''}${result.holder_name ? ' · ' + result.holder_name : ''}` }
}
