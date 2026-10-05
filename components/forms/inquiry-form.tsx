'use client'
import { useActionState } from 'react'
import { submitInquiry, submitStandReservation } from '../../app/actions/inquiries'
import { initialFormState } from '../../lib/forms'
import { FormFeedback } from './form-feedback'

export function InquiryForm({ kind, enabled }: { kind: 'contact' | 'partner' | 'exhibitor'; enabled: boolean }) {
  const isStandReservation = kind === 'exhibitor'
  const [state, action, pending] = useActionState(isStandReservation ? submitStandReservation : submitInquiry, initialFormState)
  return <form action={action} className="platform-form">
    <input type="hidden" name="kind" value={kind} />
    <div className="form-honeypot" aria-hidden="true"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <h3>{kind === 'contact' ? 'Écrivez à l’organisation' : kind === 'partner' ? 'Présentez votre partenariat' : 'Réserver un stand'}</h3>
    <p className="muted">{isStandReservation ? 'Location : 10 000 XAF par stand. 10 stands sont disponibles. Envoyez votre demande ; l’organisation vous contactera pour confirmer la réservation et le paiement. La demande seule ne confirme pas la réservation.' : 'Votre demande sera consultable par l’équipe organisatrice de cette édition.'}</p>
    {!enabled && <p className="form-feedback">L’envoi des demandes n’est pas encore ouvert. Revenez prochainement.</p>}
    <fieldset disabled={!enabled || pending || state.status === 'success'}>
      <div className="form-grid">
        <label>Votre nom<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
        <label>Adresse e-mail<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label>Téléphone (facultatif)<input name="phone" type="tel" autoComplete="tel" placeholder="+237 6XX XXX XXX" maxLength={30} /></label>
        <label>Organisation / activité{kind === 'contact' ? ' (facultatif)' : ''}<input name="organization" autoComplete="organization" required={kind !== 'contact'} maxLength={150} /></label>
      </div>
      <label>Votre message<textarea name="message" required minLength={20} maxLength={4000} rows={6} /></label>
      <label className="form-checkbox"><input name="consent" type="checkbox" required />J’accepte que l’organisation utilise ces informations pour traiter ma demande.</label>
        <button className="button button-primary" type="submit">{pending ? 'Enregistrement…' : isStandReservation ? 'Demander la réservation' : 'Envoyer ma demande'}</button>
    </fieldset>
    <FormFeedback state={state} />
  </form>
}
