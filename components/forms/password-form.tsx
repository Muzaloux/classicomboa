'use client'
import { useActionState } from 'react'
import { savePassword } from '../../app/admin/security/actions'
import { initialFormState } from '../../lib/forms'
import { FormFeedback } from './form-feedback'

export function PasswordForm() {
  const [state, action, pending] = useActionState(savePassword, initialFormState)
  return <form className="platform-form" action={action}>
    <h2>Définir ou changer mon mot de passe</h2>
    <p className="muted">Choisissez une phrase d’au moins 12 caractères. Le code e-mail reste disponible si vous oubliez votre mot de passe.</p>
    <fieldset disabled={pending || state.status === 'success'}>
      <label>Nouveau mot de passe<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /></label>
      <label>Confirmer le mot de passe<input name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /></label>
      <button type="submit" className="button button-primary">{pending ? 'Enregistrement…' : 'Enregistrer mon mot de passe'}</button>
    </fieldset>
    <FormFeedback state={state} />
  </form>
}
