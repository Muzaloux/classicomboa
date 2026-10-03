'use client'
import { useActionState, useState } from 'react'
import { reserveOrder, retrieveOrder, simulatePayment } from '../../app/tickets/actions'
import { initialFormState } from '../../lib/forms'
import { FormFeedback } from '../forms/form-feedback'
import { formatXaf } from '../../lib/formatting'
import { paymentContacts } from '../../lib/manual-payment'

export function CheckoutForm({ type, request, access, test = true }: { type: { id: string; name: string; price_xaf: number; available: number }; request: string; access: string; test?: boolean }) {
  const [state, action, pending] = useActionState(reserveOrder, initialFormState)
  const maxQty = Math.max(1, Math.min(100, type.available))
  const [qty, setQty] = useState(1)
  const safeQty = Number.isFinite(qty) ? Math.min(maxQty, Math.max(1, qty)) : 1
  return <form action={action} onReset={event => event.preventDefault()} className="platform-form">
    <h2>{type.name} · {formatXaf(type.price_xaf)} / billet</h2>
    <p>Réservation pendant {test ? '15 minutes' : '2 heures'}. Aucun compte nécessaire.</p>
    {!test && <p>Après réservation, vous serez redirigé vers une carte de paiement avec le montant, la référence et les coordonnées du moyen choisi. Vos billets seront disponibles après vérification du paiement par l’organisation.</p>}
    <input type="hidden" name="type" value={type.id} /><input type="hidden" name="request" value={request} /><input type="hidden" name="access" value={access} />
    <fieldset disabled={pending}>
      <label>Nombre de billets<input name="quantity" type="number" inputMode="numeric" min={1} max={maxQty} step={1} value={Number.isNaN(qty) ? "" : qty} onChange={event => setQty(event.target.valueAsNumber)} onBlur={() => setQty(safeQty)} required /></label>
      <p className="ticket-total" aria-live="polite">Total à payer : <strong>{formatXaf(safeQty * type.price_xaf)}</strong></p>
      <label>Nom complet<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
      <label>Téléphone camerounais<input name="phone" type="tel" autoComplete="tel" placeholder="+237 6XX XXX XXX" required maxLength={30} /></label>
      {!test && <fieldset className="payment-options"><legend>Choisissez votre moyen de paiement</legend>{Object.entries(paymentContacts).map(([key, contact], index) => <label className="payment-option" key={key}><input type="radio" name="contact" value={key} defaultChecked={index === 0} /><span className="payment-option-card"><span className={`payment-provider-badge provider-${key}`} aria-hidden="true">{key === 'manuel' ? 'MTN' : 'OM'}</span><span><strong>{contact.provider}</strong></span></span></label>)}</fieldset>}
      <div className="form-honeypot" aria-hidden="true"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="checkbox-label"><input name="consent" type="checkbox" required />J’accepte l’utilisation de mes coordonnées pour cette commande{test ? ' de test' : ' et la transmission de ma référence et de mon montant au moyen de paiement choisi'}.</label>
      <button className="button button-primary" disabled={type.available < 1}>{pending ? 'Réservation…' : test ? 'Réserver mes billets de test' : 'Réserver et afficher le paiement'}</button>
    </fieldset><FormFeedback state={state} />
  </form>
}
export function TestPaymentForm({ reference }: { reference: string }) {
  const [state, action, pending] = useActionState(simulatePayment, initialFormState)
  return <form action={action} className="platform-form"><input name="reference" type="hidden" value={reference} /><h2>Simuler le paiement</h2><p>Aucun paiement réel. Ces billets ne donnent pas accès à l’événement.</p><fieldset disabled={pending} className="account-actions"><button className="button button-primary" name="outcome" value="successful">{pending ? 'Traitement…' : 'Simuler une réussite'}</button><button className="button button-outline" name="outcome" value="failed">Simuler un refus</button></fieldset><FormFeedback state={state} /></form>
}
export function RetrieveOrderForm() {
  const [state, action, pending] = useActionState(retrieveOrder, initialFormState)
  return <form action={action} className="platform-form"><fieldset disabled={pending}><label>Référence de commande<input name="reference" required placeholder="CM-…" autoComplete="off" maxLength={35} /></label><label>Clé de récupération<input name="access" type="password" required autoComplete="off" maxLength={64} /></label><button className="button button-primary">{pending ? 'Recherche…' : 'Retrouver ma commande'}</button></fieldset><FormFeedback state={state} /></form>
}
export function PrintTickets() { return <button className="button button-outline no-print" onClick={() => window.print()}>Imprimer / Enregistrer en PDF</button> }
