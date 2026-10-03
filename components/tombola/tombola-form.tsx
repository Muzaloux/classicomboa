'use client'
import { useActionState, useState } from 'react'
import { joinTombola } from '../../app/tombola/actions'
import { initialFormState } from '../../lib/forms'
import { FormFeedback } from '../forms/form-feedback'
import { formatXaf } from '../../lib/formatting'
import { paymentContacts } from '../../lib/manual-payment'

export function TombolaForm({ draw, request, access }: { draw: { id: string; name: string; prize: string; price_xaf: number }; request: string; access: string }) {
  const [state, action, pending] = useActionState(joinTombola, initialFormState)
  const [qty, setQty] = useState(1)
  const safeQty = Number.isFinite(qty) ? Math.min(100, Math.max(1, qty)) : 1
  return <form action={action} onReset={event => event.preventDefault()} className="platform-form">
    <h2>{draw.name}</h2>
    <p><strong>À gagner :</strong> {draw.prize}</p>
    <p>Chaque participation coûte {formatXaf(draw.price_xaf)}. Vos numéros vous sont attribués après vérification de votre paiement Mobile Money par l’organisation. Plus vous avez de numéros, plus vous avez de chances.</p>
    <input type="hidden" name="request" value={request} /><input type="hidden" name="access" value={access} /><input type="hidden" name="draw" value={draw.id} />
    <fieldset disabled={pending}>
      <label>Nombre de participations<input name="quantity" type="number" inputMode="numeric" min={1} max={100} step={1} value={Number.isNaN(qty) ? '' : qty} onChange={event => setQty(event.target.valueAsNumber)} onBlur={() => setQty(safeQty)} required /></label>
      <p className="ticket-total" aria-live="polite">Total à payer : <strong>{formatXaf(safeQty * draw.price_xaf)}</strong></p>
      <label>Nom complet<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
      <label>Téléphone camerounais<input name="phone" type="tel" autoComplete="tel" placeholder="+237 6XX XXX XXX" required maxLength={30} /></label>
      <fieldset className="payment-options"><legend>Choisissez votre moyen de paiement</legend>{Object.entries(paymentContacts).map(([key, contact], index) => <label className="payment-option" key={key}><input type="radio" name="contact" value={key} defaultChecked={index === 0} /><span className="payment-option-card"><span className={`payment-provider-badge provider-${key}`} aria-hidden="true">{key === 'manuel' ? 'MTN' : 'OM'}</span><span><strong>{contact.provider}</strong></span></span></label>)}</fieldset>
      <div className="form-honeypot" aria-hidden="true"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="checkbox-label"><input name="consent" type="checkbox" required />J’accepte l’utilisation de mes coordonnées pour cette tombola et la transmission de ma référence et de mon montant au moyen de paiement choisi. Si je gagne, l’organisation pourra me contacter par téléphone.</label>
      <button className="button button-primary">{pending ? 'Envoi…' : 'Participer et afficher le paiement'}</button>
    </fieldset><FormFeedback state={state} />
  </form>
}
