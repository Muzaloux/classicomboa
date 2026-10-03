'use client'
import { useActionState, useState } from 'react'
import { castVote } from '../../app/vote/actions'
import { initialFormState } from '../../lib/forms'
import { FormFeedback } from '../forms/form-feedback'
import { formatXaf } from '../../lib/formatting'
import { paymentContacts } from '../../lib/manual-payment'

type Category = { id: string; name: string; price_xaf: number; candidates: { id: string; name: string; subtitle: string | null }[] }

export function VoteForm({ categories, request, access }: { categories: Category[]; request: string; access: string }) {
  const [state, action, pending] = useActionState(castVote, initialFormState)
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [qty, setQty] = useState(1)
  const category = categories.find(c => c.id === categoryId) ?? categories[0]
  const safeQty = Number.isFinite(qty) ? Math.min(100, Math.max(1, qty)) : 1
  if (!category) return null
  return <form action={action} onReset={event => event.preventDefault()} className="platform-form">
    <h2>Voter</h2>
    <p>Chaque vote coûte {formatXaf(category.price_xaf)}. Vos votes sont comptés après vérification de votre paiement Mobile Money par l’organisation.</p>
    <input type="hidden" name="request" value={request} /><input type="hidden" name="access" value={access} />
    <fieldset disabled={pending}>
      <label>Catégorie<select value={categoryId} onChange={event => setCategoryId(event.target.value)}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Candidat<select key={category.id} name="candidate" required defaultValue="">{<option value="" disabled>Choisissez un candidat</option>}{category.candidates.map(k => <option key={k.id} value={k.id}>{k.name}{k.subtitle ? ' · ' + k.subtitle : ''}</option>)}</select></label>
      <label>Nombre de votes<input name="quantity" type="number" inputMode="numeric" min={1} max={100} step={1} value={Number.isNaN(qty) ? '' : qty} onChange={event => setQty(event.target.valueAsNumber)} onBlur={() => setQty(safeQty)} required /></label>
      <p className="ticket-total" aria-live="polite">Total à payer : <strong>{formatXaf(safeQty * category.price_xaf)}</strong></p>
      <label>Nom complet<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
      <label>Téléphone camerounais<input name="phone" type="tel" autoComplete="tel" placeholder="+237 6XX XXX XXX" required maxLength={30} /></label>
      <fieldset className="payment-options"><legend>Choisissez votre moyen de paiement</legend>{Object.entries(paymentContacts).map(([key, contact], index) => <label className="payment-option" key={key}><input type="radio" name="contact" value={key} defaultChecked={index === 0} /><span className="payment-option-card"><span className={`payment-provider-badge provider-${key}`} aria-hidden="true">{key === 'manuel' ? 'MTN' : 'OM'}</span><span><strong>{contact.provider}</strong></span></span></label>)}</fieldset>
      <div className="form-honeypot" aria-hidden="true"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="checkbox-label"><input name="consent" type="checkbox" required />J’accepte l’utilisation de mes coordonnées pour ce vote et la transmission de ma référence et de mon montant au moyen de paiement choisi.</label>
      <button className="button button-primary">{pending ? 'Envoi…' : 'Voter et afficher le paiement'}</button>
    </fieldset><FormFeedback state={state} />
  </form>
}
