'use client'
import { useActionState } from 'react'
import { registerPlayer } from '../../app/joueurs/actions'
import { initialFormState } from '../../lib/forms'
import { FormFeedback } from '../forms/form-feedback'
import { formatXaf } from '../../lib/formatting'
import { paymentContacts } from '../../lib/manual-payment'
import { playerClubs } from '../../lib/players-validation'
import { TeamEmblem } from '../shared/team-emblem'

export function PlayerForm({ fee, request, access }: { fee: number; request: string; access: string }) {
  const [state, action, pending] = useActionState(registerPlayer, initialFormState)
  return <form action={action} onReset={event => event.preventDefault()} className="platform-form">
    <h2>Inscription joueur</h2>
    <p>Après validation de votre demande par l’organisation, la contribution est de <strong>{formatXaf(fee)}</strong> : 10 000 XAF pour la location du terrain et 6 000 XAF pour le kit (maillot, short et chaussettes avec nom et dossard imprimés). N’envoyez le paiement qu’après approbation.</p>
    <input type="hidden" name="request" value={request} /><input type="hidden" name="access" value={access} />
    <fieldset disabled={pending}>
      <fieldset className="payment-options"><legend>Votre club</legend>{Object.entries(playerClubs).map(([key, label], index) => <label className="payment-option" key={key}><input type="radio" name="club" value={key} required defaultChecked={index === 0} /><span className="payment-option-card"><TeamEmblem team={key} decorative /><span><strong>{label}</strong></span></span></label>)}</fieldset>
      <label>Nom complet<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
      <label>Téléphone camerounais<input name="phone" type="tel" autoComplete="tel" placeholder="+237 6XX XXX XXX" required maxLength={30} /></label>
      <label>Nom à imprimer sur le maillot<input name="kitName" required minLength={2} maxLength={24} /></label>
      <label>Numéro de dossard souhaité<input name="dorsal" type="number" min={0} max={99} required /></label>
      <p className="ticket-total" aria-live="polite">Total à payer : <strong>{formatXaf(fee)}</strong></p>
      <fieldset className="payment-options"><legend>Choisissez votre moyen de paiement</legend>{Object.entries(paymentContacts).map(([key, contact], index) => <label className="payment-option" key={key}><input type="radio" name="contact" value={key} defaultChecked={index === 0} /><span className="payment-option-card"><span className={`payment-provider-badge provider-${key}`} aria-hidden="true">{key === 'manuel' ? 'MTN' : 'OM'}</span><span><strong>{contact.provider}</strong></span></span></label>)}</fieldset>
      <div className="form-honeypot" aria-hidden="true"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="checkbox-label"><input name="consent" type="checkbox" required />J’accepte que l’organisation utilise mes coordonnées pour traiter ma demande et me contacter au sujet de mon approbation et du paiement.</label>
      <button className="button button-primary">{pending ? 'Envoi…' : 'Envoyer ma demande à l’organisation'}</button>
    </fieldset><FormFeedback state={state} />
  </form>
}
