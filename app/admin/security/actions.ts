'use server'
import { z } from 'zod'
import { getRoleAccess } from '../../../lib/auth'
import { currentEdition } from '../../../data/current-edition'
import type { FormState } from '../../../lib/forms'

const passwordSchema = z.object({
  password: z.string().min(12, 'Choisissez au moins 12 caractères.').max(128),
  confirmation: z.string().max(128),
}).refine((value) => value.password === value.confirmation, {
  path: ['confirmation'], message: 'Les deux mots de passe doivent être identiques.',
})

export async function savePassword(_previous: FormState, form: FormData): Promise<FormState> {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager', 'support', 'checkin', 'editor'])
  if (!identity) return { status: 'error', message: 'Cet accès est réservé aux organisateurs autorisés.' }
  const parsed = passwordSchema.safeParse({ password: form.get('password'), confirmation: form.get('confirmation') })
  if (!parsed.success) return { status: 'error', message: 'Vérifiez votre nouveau mot de passe.', errors: z.flattenError(parsed.error).fieldErrors }
  try {
    // Uses the current authenticated user, never a privileged admin password reset.
    const { error } = await identity.supabase.auth.updateUser({ password: parsed.data.password })
    if (error) {
      if (error.code === 'reauthentication_needed' || error.code === 'reauthentication_not_valid') return { status: 'error', message: 'Reconnectez-vous avec un nouveau code e-mail, puis revenez enregistrer votre mot de passe.' }
      if (error.code === 'same_password') return { status: 'error', message: 'Choisissez un mot de passe différent du précédent.' }
      if (error.code === 'weak_password') return { status: 'error', message: 'Ce mot de passe est trop faible. Choisissez une phrase plus longue et difficile à deviner.' }
      return { status: 'error', message: 'Le mot de passe n’a pas été modifié. Réessayez après une nouvelle connexion.' }
    }
    return { status: 'success', message: 'Votre mot de passe est enregistré. Vous pouvez désormais vous connecter avec votre adresse e-mail et ce mot de passe.' }
  } catch {
    return { status: 'error', message: 'Le service est momentanément indisponible. Réessayez plus tard.' }
  }
}
