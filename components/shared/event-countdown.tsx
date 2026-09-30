'use client'

import { useEffect, useState } from 'react'

export function EventCountdown({ date }: { date: string }) {
  const [remaining, setRemaining] = useState<number | null>(null)
  useEffect(() => {
    // Count down to the calendar day in Douala, not an unconfirmed kick-off time.
    const update = () => setRemaining(Math.max(0, new Date(`${date}T00:00:00+01:00`).getTime() - Date.now()))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [date])
  if (remaining === 0) return <p className="countdown-message">La date du rendez-vous est arrivée. Consultez les annonces officielles.</p>
  const units = [
    ['jours', remaining === null ? null : Math.floor(remaining / 86400000)],
    ['heures', remaining === null ? null : Math.floor(remaining / 3600000) % 24],
    ['minutes', remaining === null ? null : Math.floor(remaining / 60000) % 60],
    ['secondes', remaining === null ? null : Math.floor(remaining / 1000) % 60],
  ] as const
  return <div className="countdown" role="timer" aria-label="Compte à rebours jusqu’au jour de l’événement, heure de Douala">{units.map(([label, value]) => <div className="countdown-unit" key={label}><strong>{value === null ? '—' : String(value).padStart(2, '0')}</strong><span>{label}</span></div>)}</div>
}
