'use client'
import { useActionState, useEffect, useRef, useState } from 'react'
import { saveTicketType, cancelTicket, scanTicket, confirmManualPayment } from '../../app/admin/tickets/actions'
import { initialFormState } from '../../lib/forms'
import { FormFeedback } from '../forms/form-feedback'
export function ConfirmPaymentForm({ reference, amount }: { reference: string; amount: number }) {
  const [state, action, pending] = useActionState(confirmManualPayment, initialFormState)
  return <form className="platform-form" action={action} onReset={event => event.preventDefault()}><h2>Confirmer le paiement reçu</h2><p>Vérifiez la transaction dans le compte Mobile Money destinataire. Un message ou une capture d’écran du client ne suffit pas. Montant attendu : {amount} XAF.</p><input name="reference" value={reference} type="hidden" /><fieldset disabled={pending}><label>Montant réellement reçu en XAF<input name="amount" type="number" min={0} required /></label><label>Référence unique du reçu Mobile Money<input name="receipt" required minLength={6} maxLength={100} autoComplete="off" /></label><label className="checkbox-label"><input name="confirmed" type="checkbox" required />J’ai vérifié la réception de ce montant dans le compte destinataire.</label><button className="button button-primary">{pending ? 'Confirmation…' : 'Confirmer et délivrer les billets'}</button></fieldset><FormFeedback state={state} /></form>
}

export function TicketTypeForm({ type }: { type: { id: string; name: string; price_xaf: number; capacity: number; status: string; is_test: boolean } }) {
  const [state, action, pending] = useActionState(saveTicketType, initialFormState)
  return <form className="platform-form" action={action}><input type="hidden" name="id" value={type.id} /><h3>{type.is_test ? 'Catégorie de test' : 'Catégorie réelle'}</h3><fieldset disabled={pending}><label>Nom<input name="name" defaultValue={type.name} required minLength={2} maxLength={100} /></label><label>Prix unitaire en FCFA<input name="price" type="number" defaultValue={type.price_xaf} min={0} max={10000000} required /></label><label>Capacité totale<input name="capacity" type="number" defaultValue={type.capacity} min={0} max={1000000} required /></label><label>Statut<select name="status" defaultValue={type.status}><option value="draft">Brouillon</option><option value="active">Ouverte</option><option value="paused">En pause</option><option value="closed">Fermée</option></select></label><button className="button button-primary">{pending ? 'Enregistrement…' : 'Enregistrer'}</button></fieldset><FormFeedback state={state} /></form>
}
export function VoidTicketForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState(cancelTicket, initialFormState)
  return <form action={action} className="platform-form"><input type="hidden" name="code" value={code} /><fieldset disabled={pending}><label className="checkbox-label"><input type="checkbox" name="confirm" required />Annuler ce billet sans remboursement automatique.</label><button className="button button-outline">Annuler le billet</button></fieldset><FormFeedback state={state} /></form>
}
export function CheckinForm() {
  const [state, action, pending] = useActionState(scanTicket, initialFormState)
  const [code, setCode] = useState('')
  const [mode, setMode] = useState('live')
  const [gate, setGate] = useState('Entrée principale')
  const [camera, setCamera] = useState(false)
  const [cameraMessage, setCameraMessage] = useState('')
  const [showResult, setShowResult] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const controls = useRef<{ stop: () => void } | null>(null)
  useEffect(() => {
    if (!camera) return
    let disposed = false
    async function start() {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser')
        if (disposed || !video.current) return
        const reader = new BrowserQRCodeReader()
        const stream = await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } }, audio: false }, video.current, (result, _error, control) => {
          if (result && !disposed) { setCode(result.getText()); setShowResult(false); setCameraMessage('Code lu. Vérifiez le mode, puis validez le billet.'); control.stop(); setCamera(false) }
        })
        if (disposed) stream.stop()
        else controls.current = stream
      } catch {
        if (!disposed) { setCameraMessage('Caméra indisponible. Autorisez son accès ou saisissez le code du billet.'); setCamera(false) }
      }
    }
    void start()
    return () => { disposed = true; controls.current?.stop(); controls.current = null }
  }, [camera])
  return <form action={action} onSubmit={() => setShowResult(true)} onReset={event => event.preventDefault()} className="platform-form"><fieldset disabled={pending}>
    <label>Mode de contrôle<select name="mode" value={mode} onChange={event => { setMode(event.target.value); setShowResult(false) }}><option value="live">ENTRÉE RÉELLE — refuse les billets de test</option><option value="test">TEST — aucune entrée réelle</option></select></label>
    <label>Porte / point de contrôle<input name="gate" value={gate} onChange={event => setGate(event.target.value)} required maxLength={60} /></label>
    <button type="button" className="button button-outline" onClick={() => { setCameraMessage(''); setCamera(!camera) }}>{camera ? 'Arrêter la caméra' : 'Scanner un QR avec la caméra'}</button>
    {camera && <video ref={video} className="scanner-video" muted playsInline aria-label="Caméra de lecture QR" />}
    {cameraMessage && <p role="status">{cameraMessage}</p>}
    <label>Code du billet / contenu QR<input name="code" value={code} onChange={event => { setCode(event.target.value); setShowResult(false) }} required maxLength={100} autoComplete="off" placeholder="TKT-…" /></label>
    <button className="button button-primary">{pending ? 'Contrôle…' : 'Valider le billet'}</button>
  </fieldset>{showResult && !pending && <FormFeedback state={state} />}<button className="button button-outline" type="button" disabled={pending} onClick={() => { setCode(''); setShowResult(false) }}>Effacer pour le prochain billet</button></form>
}
