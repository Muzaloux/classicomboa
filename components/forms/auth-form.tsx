'use client'
import { useActionState, useState } from 'react'
import { authenticate } from '../../app/auth/actions'
import { initialFormState } from '../../lib/forms'
import { FormFeedback } from './form-feedback'

type Mode = 'password' | 'send-code' | 'verify-code'
export function AuthForm({ enabled }: { enabled: boolean }) {
  const [mode, setMode] = useState<Mode>('password')
  return <div className="platform-form">
    <div className="form-tabs" aria-label="Mode d’accès organisateur">{([
      ['password', 'Connexion'], ['send-code', 'Recevoir un code'], ['verify-code', 'Saisir mon code'],
    ] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={value === mode} onClick={() => setMode(value)}>{label}</button>)}</div>
    <AuthFields key={mode} mode={mode} enabled={enabled} />
  </div>
}

function AuthFields({ mode, enabled }: { mode: Mode; enabled: boolean }) {
  const [state, action, pending] = useActionState(authenticate, initialFormState)
  return <form action={action}>
    {!enabled && <p className="form-feedback">L’espace personnel ouvrira prochainement. Les informations de l’événement restent accessibles.</p>}
    <input type="hidden" name="mode" value={mode} />
    <fieldset disabled={!enabled || pending}>
      <label>Adresse e-mail<input type="email" name="email" required autoComplete="email" maxLength={254} /></label>
      {mode === 'password' && <label>Mot de passe<input type="password" name="password" required minLength={1} maxLength={128} autoComplete="current-password" /></label>}
      {mode === 'verify-code' && <label>Code reçu par e-mail<input name="token" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6,8}" minLength={6} maxLength={8} /></label>}
      {mode === 'send-code' && <p className="muted">Déjà inscrit et mot de passe oublié ? Recevez un code pour accéder à votre compte.</p>}
      <button className="button button-primary" type="submit">{pending ? 'Veuillez patienter…' : mode === 'send-code' ? 'Envoyer un code' : 'Me connecter'}</button>
    </fieldset>
    <FormFeedback state={state} />
  </form>
}
