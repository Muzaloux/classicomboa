'use client'
import { useActionState } from 'react'
import { confirmTombolaPayment, runDraw, saveDraw } from '../../app/admin/tombola/actions'
import { initialFormState } from '../../lib/forms'
import { FormFeedback } from '../forms/form-feedback'

export function ConfirmTombolaPaymentForm({ reference, amount }: { reference: string; amount: number }) {
  const [state, action, pending] = useActionState(confirmTombolaPayment, initialFormState)
  return <form className="platform-form" action={action} onReset={event => event.preventDefault()}><p>Vérifiez la transaction dans le compte Mobile Money destinataire. Montant attendu : {amount} XAF.</p><input name="reference" value={reference} type="hidden" /><fieldset disabled={pending}><label>Montant réellement reçu en XAF<input name="amount" type="number" min={0} required /></label><label>Référence unique du reçu Mobile Money<input name="receipt" required minLength={6} maxLength={100} autoComplete="off" /></label><label className="checkbox-label"><input name="confirmed" type="checkbox" required />J’ai vérifié la réception de ce montant dans le compte destinataire.</label><button className="button button-primary">{pending ? 'Confirmation…' : 'Confirmer et attribuer les numéros'}</button></fieldset><FormFeedback state={state} /></form>
}
export function DrawSettingsForm({ draw, locked }: { draw: { id: string; name: string; prize: string; status: string; winners_count: number; results_public: boolean }; locked: boolean }) {
  const [state, action, pending] = useActionState(saveDraw, initialFormState)
  return <form className="platform-form" action={action} onReset={event => event.preventDefault()}><h3>{draw.name}</h3><input type="hidden" name="id" value={draw.id} /><fieldset disabled={pending}>
    <label>Statut<select name="status" defaultValue={locked ? 'closed' : draw.status} disabled={locked}><option value="draft">Brouillon</option><option value="open">Ouverte à la vente</option><option value="closed">Clôturée (prête pour le tirage)</option></select></label>
    <label>Lots à gagner<input name="prize" defaultValue={draw.prize} required minLength={2} maxLength={300} disabled={locked} /></label>
    <label>Nombre de gagnants<input name="winners_count" type="number" min={1} max={100} defaultValue={draw.winners_count} required disabled={locked} /></label>
    <label className="checkbox-label"><input name="results_public" type="checkbox" defaultChecked={draw.results_public} />Publier les gagnants</label>
    {locked && <input type="hidden" name="status" value="closed" />}
    <button className="button button-outline">{pending ? 'Enregistrement…' : 'Enregistrer'}</button></fieldset><FormFeedback state={state} /></form>
}
export function RunDrawForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(runDraw, initialFormState)
  return <form className="platform-form" action={action} onReset={event => event.preventDefault()}><h3>Lancer le tirage</h3><p>Le tirage est définitif et ne peut pas être refait. Un gagnant est choisi au hasard par le système, au plus un par participant.</p><input type="hidden" name="id" value={id} /><fieldset disabled={pending}><label className="checkbox-label"><input name="confirmed" type="checkbox" required />Les ventes sont closes et tous les paiements ont été vérifiés.</label><button className="button button-primary">{pending ? 'Tirage…' : 'Lancer le tirage définitif'}</button></fieldset><FormFeedback state={state} /></form>
}
