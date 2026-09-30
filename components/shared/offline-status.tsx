'use client'
import { useEffect, useState } from 'react'

export function OfflineStatus() {
  const [offline, setOffline] = useState(false)
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  return offline ? <div className="offline-status" role="status">Connexion interrompue. Les informations affichées peuvent ne plus être à jour.</div> : null
}
