import { z } from 'zod'
import { normalizeCameroonPhone } from './validation'

export const referenceSchema = z.string().regex(/^CM-[a-f0-9]{32}$/)
export const accessTokenSchema = z.string().regex(/^[a-f0-9]{64}$/)
export const checkoutSchema = z.object({
  type: z.string().uuid(), quantity: z.coerce.number().int().min(1).max(100),
  name: z.string().trim().min(2).max(100),
  phone: z.string().max(30).refine(v => normalizeCameroonPhone(v) !== null).transform(v => normalizeCameroonPhone(v)!),
  request: z.string().uuid(), access: accessTokenSchema,
  consent: z.literal('on'), website: z.string().max(0),
  contact: z.enum(['manuel', 'youana']).default('manuel'),
})
export const paymentEventSchema = z.object({
  reference: referenceSchema, event: z.string().uuid(), amount: z.number().int().nonnegative(),
  currency: z.literal('XAF'), outcome: z.enum(['successful', 'failed']),
})
export const orderStatusLabels: Record<string, string> = { pending: 'En attente', paid: 'Confirmée', failed: 'Paiement refusé', expired: 'Réservation expirée', cancelled: 'Annulée' }
export const ticketStatusLabels: Record<string, string> = { valid: 'Valide', used: 'Déjà utilisé', void: 'Annulé' }
