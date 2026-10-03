'use client'
import { useActionState } from 'react'
import { registerPlayer } from '../../app/joueurs/actions'
import { initialFormState } from '../../lib/forms'
import { FormFeedback } from '../forms/form-feedback'
import { formatXaf } from '../../lib/formatting'
import { paymentContacts } from '../../lib/manual-payment'
import { playerClubs } from '../../lib/players-validation'

export function PlayerForm({ fee, request, access }: { fee: number; request: string; access: string }) {
  const [state, action, pending] = useActionState(registerPlayer, initialFormState)
  return <form action={action} onReset={event => event.preventDefault()} className="platform-form">
    <h2>Inscription joueur</h2>
    <p>Les frais d’inscription sont de <strong>{formatXaf(fee)}</strong> par joueur, à régler en totalité par Mobile Money. Votre inscription est enregistrée après vérification de votre paiement par l’organisation.</p>
    <input type="hidden" name="request" value={request} /><input type="hidden" name="access" value={access} />
    <fieldset disabled={pending}>
      <fieldset className="payment-options"><legend>Votre club</legend>{Object.entries(playerClubs).map(([key, label], index) => <label className="payment-option" key={key}><input type="radio" name="club" value={key} required defaultChecked={index === 0} /><span className="payment-option-card"><span><strong>{label}</strong></span></span></label>)}</fieldset>
      <label>Nom complet<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
      <label>Téléphone camerounais<input name="phone" type="tel" autoComplete="tel" placeholder="+237 6XX XXX XXX" required maxLength={30} /></label>
      <p className="ticket-total" aria-live="polite">Total à payer : <strong>{formatXaf(fee)}</strong></p>
      <fieldset className="payment-options"><legend>Choisissez votre moyen de paiement</legend>{Object.entries(paymentContacts).map(([key, contact], index) => <label className="payment-option" key={key}><input type="radio" name="contact" value={key} defaultChecked={index === 0} /><span className="payment-option-card"><span className={`payment-provider-badge provider-${key}`} aria-hidden="true">{key === 'manuel' ? 'MTN' : 'OM'}</span><span><strong>{contact.provider}</strong></span></span></label>)}</fieldset>
      <div className="form-honeypot" aria-hidden="true"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="checkbox-label"><input name="consent" type="checkbox" required />J’accepte l’utilisation de mes coordonnées pour mon inscription et la transmission de ma référence et de mon montant au moyen de paiement choisi.</label>
      <button className="button button-primary">{pending ? 'Envoi…' : 'M’inscrire et afficher le paiement'}</button>
    </fieldset><FormFeedback state={state} />
  </form>
}
