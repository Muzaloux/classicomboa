import { z } from 'zod'

export function normalizeCameroonPhone(value: string): string | null {
  const cleaned = value.replace(/[\s().-]/g, '')
  const local = cleaned.replace(/^(\+237|237)/, '')
  return /^6\d{8}$/.test(local) ? '+237' + local : null
}

const optionalPhone = z.string().trim().max(30).refine(
  (value) => !value || normalizeCameroonPhone(value) !== null,
  'Indiquez un numéro camerounais valide (ex. +237 6XX XXX XXX).',
).transform((value) => value ? normalizeCameroonPhone(value)! : '')
export const emailSchema = z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(254)
export const profileSchema = z.object({
  display_name: z.string().trim().min(2, 'Indiquez votre nom.').max(100),
  phone: optionalPhone,
  city: z.string().trim().max(100),
})
export const inquirySchema = z.object({
  kind: z.enum(['contact', 'partner', 'exhibitor']),
  name: z.string().trim().min(2, 'Indiquez votre nom.').max(100),
  email: emailSchema,
  phone: optionalPhone,
  organization: z.string().trim().max(150),
  message: z.string().trim().min(20, 'Votre message doit contenir au moins 20 caractères.').max(4000),
  consent: z.literal('on', { error: 'Votre accord est nécessaire pour traiter cette demande.' }),
  website: z.string().max(0, 'Envoi refusé.'),
}).superRefine((value, context) => {
  if (value.kind !== 'contact' && value.organization.length < 2) {
    context.addIssue({ code: 'custom', path: ['organization'], message: 'Indiquez votre organisation ou activité.' })
  }
})
