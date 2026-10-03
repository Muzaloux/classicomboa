'use client'
import { useActionState } from 'react'
import { confirmVotePayment, saveVoteCategory } from '../../app/admin/votes/actions'
import { initialFormState } from '../../lib/forms'
import { FormFeedback } from '../forms/form-feedback'

export function ConfirmVotePaymentForm({ reference, amount }: { reference: string; amount: number }) {
  const [state, action, pending] = useActionState(confirmVotePayment, initialFormState)
  return <form className="platform-form" action={action} onReset={event => event.preventDefault()}><p>Vérifiez la transaction dans le compte Mobile Money destinataire. Montant attendu : {amount} XAF.</p><input name="reference" value={reference} type="hidden" /><fieldset disabled={pending}><label>Montant réellement reçu en XAF<input name="amount" type="number" min={0} required /></label><label>Référence unique du reçu Mobile Money<input name="receipt" required minLength={6} maxLength={100} autoComplete="off" /></label><label className="checkbox-label"><input name="confirmed" type="checkbox" required />J’ai vérifié la réception de ce montant dans le compte destinataire.</label><button className="button button-primary">{pending ? 'Confirmation…' : 'Confirmer les votes'}</button></fieldset><FormFeedback state={state} /></form>
}
export function VoteCategoryForm({ category }: { category: { id: string; name: string; status: string; results_public: boolean } }) {
  const [state, action, pending] = useActionState(saveVoteCategory, initialFormState)
  return <form className="platform-form" action={action} onReset={event => event.preventDefault()}><h3>{category.name}</h3><input type="hidden" name="id" value={category.id} /><fieldset disabled={pending}><label>Statut<select name="status" defaultValue={category.status}><option value="draft">Brouillon</option><option value="open">Ouvert au vote</option><option value="closed">Clos</option></select></label><label className="checkbox-label"><input name="results_public" type="checkbox" defaultChecked={category.results_public} />Publier les résultats</label><button className="button button-outline">{pending ? 'Enregistrement…' : 'Enregistrer'}</button></fieldset><FormFeedback state={state} /></form>
}
