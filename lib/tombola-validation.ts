import { z } from 'zod'
import { normalizeCameroonPhone } from './validation'
import { accessTokenSchema } from './ticketing-validation'

export const tombolaReferenceSchema = z.string().regex(/^CT-[a-f0-9]{32}$/)
export const tombolaSchema = z.object({
  draw: z.string().uuid(), quantity: z.coerce.number().int().min(1).max(100),
  name: z.string().trim().min(2).max(100),
  phone: z.string().max(30).refine(v => normalizeCameroonPhone(v) !== null).transform(v => normalizeCameroonPhone(v)!),
  request: z.string().uuid(), access: accessTokenSchema,
  consent: z.literal('on'), website: z.string().max(0),
  contact: z.enum(['manuel', 'youana']).default('manuel'),
})
export const tombolaStatusLabels: Record<string, string> = { pending: 'En attente de paiement', paid: 'Participations confirmées', expired: 'Réservation expirée' }
export const drawStatusLabels: Record<string, string> = { draft: 'Brouillon', open: 'Ouverte', closed: 'Clôturée', drawn: 'Tirée' }
