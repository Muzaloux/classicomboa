'use client'
import { useActionState } from 'react'
import { confirmPlayerPayment, savePlayerSettings } from '../../app/admin/players/actions'
import { initialFormState } from '../../lib/forms'
import { FormFeedback } from '../forms/form-feedback'

export function ConfirmPlayerPaymentForm({ reference, amount }: { reference: string; amount: number }) {
  const [state, action, pending] = useActionState(confirmPlayerPayment, initialFormState)
  return <form className="platform-form" action={action} onReset={event => event.preventDefault()}><p>Vérifiez la transaction dans le compte Mobile Money destinataire. Montant attendu (paiement intégral) : {amount} XAF.</p><input name="reference" value={reference} type="hidden" /><fieldset disabled={pending}><label>Montant réellement reçu en XAF<input name="amount" type="number" min={0} required /></label><label>Référence unique du reçu Mobile Money<input name="receipt" required minLength={6} maxLength={100} autoComplete="off" /></label><label className="checkbox-label"><input name="confirmed" type="checkbox" required />J’ai vérifié la réception de ce montant dans le compte destinataire.</label><button className="button button-primary">{pending ? 'Confirmation…' : 'Confirmer et inscrire le joueur'}</button></fieldset><FormFeedback state={state} /></form>
}
export function PlayerSettingsForm({ fee, isOpen }: { fee: number; isOpen: boolean }) {
  const [state, action, pending] = useActionState(savePlayerSettings, initialFormState)
  return <form className="platform-form" action={action} onReset={event => event.preventDefault()}><h3>Réglages des inscriptions</h3><fieldset disabled={pending}><label>Frais d’inscription (XAF)<input name="fee" type="number" min={0} defaultValue={fee} required /></label><label className="checkbox-label"><input name="is_open" type="checkbox" defaultChecked={isOpen} />Inscriptions ouvertes</label><button className="button button-outline">{pending ? 'Enregistrement…' : 'Enregistrer'}</button></fieldset><FormFeedback state={state} /></form>
}
