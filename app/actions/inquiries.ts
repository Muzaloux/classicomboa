'use server'
import { z } from 'zod'
import { currentEdition } from '../../data/current-edition'
import { inquirySchema } from '../../lib/validation'
import type { FormState } from '../../lib/forms'
import { createAdminSupabase, inquiriesConfigured } from '../../lib/supabase/admin'

export async function submitInquiry(_previous: FormState, form: FormData): Promise<FormState> {
  const result = inquirySchema.safeParse(Object.fromEntries(form))
  if (!result.success) return { status: 'error', message: 'Vérifiez les champs du formulaire.', errors: z.flattenError(result.error).fieldErrors }
  if (result.data.kind === 'exhibitor') return { status: 'error', message: 'Utilisez le formulaire de réservation des stands.' }
  if (!inquiriesConfigured()) return { status: 'error', message: 'Le formulaire est temporairement indisponible. Votre demande n’a pas été envoyée.' }
  const value = result.data
  try {
    const { data, error } = await createAdminSupabase().rpc('submit_inquiry', {
      p_edition: currentEdition.id, p_kind: value.kind, p_name: value.name, p_email: value.email,
      p_phone: value.phone, p_organization: value.organization, p_message: value.message,
    })
    if (error || !data) return { status: 'error', message: error?.message.includes('RATE_LIMITED') ? 'Trop de demandes pour cette adresse. Réessayez dans une heure.' : 'Enregistrement impossible pour le moment. Votre demande n’a pas été envoyée.' }
    return { status: 'success', message: `Demande enregistrée dans l’espace organisateur. Référence : ${data}. Aucun e-mail de confirmation n’est envoyé pour le moment.` }
  } catch {
    return { status: 'error', message: 'Connexion indisponible. Votre demande n’a pas été envoyée. Réessayez plus tard.' }
  }
}

export async function submitStandReservation(_previous: FormState, form: FormData): Promise<FormState> {
  const result = inquirySchema.safeParse({ ...Object.fromEntries(form), kind: 'exhibitor' })
  if (!result.success) return { status: 'error', message: 'Vérifiez les champs du formulaire.', errors: z.flattenError(result.error).fieldErrors }
  if (!inquiriesConfigured()) return { status: 'error', message: 'Le formulaire de réservation est temporairement indisponible. Votre demande n’a pas été envoyée.' }
  const value = result.data
  try {
    const { data, error } = await createAdminSupabase().rpc('submit_stand_reservation', {
      p_edition: currentEdition.id, p_name: value.name, p_email: value.email,
      p_phone: value.phone, p_organization: value.organization, p_message: value.message,
    })
    if (error || !data) {
      if (error?.message.includes('STANDS_FULL')) return { status: 'error', message: 'Les 10 stands sont actuellement demandés. Contactez l’organisation pour vérifier une éventuelle disponibilité.' }
      if (error?.message.includes('RATE_LIMITED')) return { status: 'error', message: 'Trop de demandes pour cette adresse. Réessayez dans une heure.' }
      return { status: 'error', message: 'Enregistrement impossible pour le moment. Votre demande n’a pas été envoyée.' }
    }
    return { status: 'success', message: `Demande de réservation enregistrée. L’organisation vous contactera pour confirmer le stand et le paiement de 10 000 XAF. Référence : ${data}.` }
  } catch {
    return { status: 'error', message: 'Connexion indisponible. Votre demande n’a pas été envoyée. Réessayez plus tard.' }
  }
}
