'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { currentEdition } from '../../data/current-edition'
import { getStaffAccess } from '../../lib/auth'
import type { FormState } from '../../lib/forms'

export async function updateInquiry(_previous: FormState, form: FormData): Promise<FormState> {
  const identity = await getStaffAccess(currentEdition.id)
  if (!identity) return { status: 'error', message: 'Vous n’avez pas accès à cette édition.' }
  const parsed = z.object({ id: z.uuid(), status: z.enum(['new', 'in_review', 'closed']) }).safeParse(Object.fromEntries(form))
  if (!parsed.success) return { status: 'error', message: 'Demande invalide.' }
  const { error } = await identity.supabase.rpc('set_inquiry_status', { p_id: parsed.data.id, p_edition: currentEdition.id, p_status: parsed.data.status })
  if (error) return { status: 'error', message: 'La demande n’a pas pu être modifiée.' }
  revalidatePath('/admin')
  return { status: 'success', message: 'Statut enregistré.' }
}
