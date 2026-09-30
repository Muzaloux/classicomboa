'use client'
import { useState } from 'react'

export function ShareButton({ title }: { title: string }) {
  const [message, setMessage] = useState('')
  async function share() {
    try {
      const url = window.location.origin + window.location.pathname
      if (navigator.share) await navigator.share({ title, url })
      else { await navigator.clipboard.writeText(url); setMessage('Lien copié.') }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      setMessage('Partage indisponible. Copiez le lien depuis la barre d’adresse.')
    }
  }
  return <div className="share-actions"><button className="button button-outline" onClick={share}>Partager cette page</button><button className="button button-ghost" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${window.location.origin}${window.location.pathname}`)}`, '_blank', 'noopener,noreferrer')}>WhatsApp ↗</button><span role="status">{message}</span></div>
}
