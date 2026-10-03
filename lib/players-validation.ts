import { z } from 'zod'
import { normalizeCameroonPhone } from './validation'
import { accessTokenSchema } from './ticketing-validation'

export const playerReferenceSchema = z.string().regex(/^[A-HJ-NP-Z2-9]{6}$/)
export const playerClubs = { 'real-mboa': 'Real Mboa', 'barca-mboa': 'Barça Mboa' } as const
export const playerSchema = z.object({
  club: z.enum(['real-mboa', 'barca-mboa']),
  name: z.string().trim().min(2).max(100),
  phone: z.string().max(30).refine(v => normalizeCameroonPhone(v) !== null).transform(v => normalizeCameroonPhone(v)!),
  request: z.string().uuid(), access: accessTokenSchema,
  consent: z.literal('on'), website: z.string().max(0),
  contact: z.enum(['manuel', 'youana']).default('manuel'),
})
export const playerStatusLabels: Record<string, string> = { pending: 'En attente de paiement', paid: 'Inscription confirmée' }
