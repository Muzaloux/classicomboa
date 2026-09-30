'use client'
import { useActionState } from 'react'
import { updateInquiry } from '../../app/admin/actions'
import { initialFormState } from '../../lib/forms'
import { FormFeedback } from './form-feedback'

export function InquiryStatusForm({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState(updateInquiry, initialFormState)
  return <form action={action} className="inquiry-status-form">
    <input type="hidden" name="id" value={id} />
    <label htmlFor={'status-' + id}>Traitement</label>
    <select id={'status-' + id} name="status" defaultValue={status} disabled={pending}>
      <option value="new">Nouveau</option><option value="in_review">En cours</option><option value="closed">Clôturé</option>
    </select>
    <button type="submit" className="button button-outline" disabled={pending}>{pending ? 'Enregistrement…' : 'Enregistrer'}</button>
    <FormFeedback state={state} />
  </form>
}
