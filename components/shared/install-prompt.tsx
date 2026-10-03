'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const dismissKey = 'classico-install-dismissed-until'
const dismissForMs = 14 * 24 * 60 * 60 * 1000

function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && navigator.standalone === true)
}

function installInstructions() {
  const userAgent = navigator.userAgent
  const isAppleMobile = /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isAppleMobile) return 'Dans Safari, touchez Partager, puis « Sur l’écran d’accueil ».'
  if (/Android/i.test(userAgent)) return 'Ouvrez le menu ⋮ de votre navigateur, puis touchez « Installer l’application » ou « Ajouter à l’écran d’accueil ».'
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'Dans Chrome ou Edge, choisissez « Installer Classico Mboa » dans la barre d’adresse ou le menu. Dans Safari, utilisez Fichier → Ajouter au Dock.'
  return 'Ouvrez le menu de votre navigateur, puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».'
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [instructions, setInstructions] = useState('')

  useEffect(() => {
    if (isInstalled()) return
    try {
      if (Number(localStorage.getItem(dismissKey)) > Date.now()) return
    } catch { /* Storage may be unavailable; the prompt remains dismissible. */ }
    setVisible(true)

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setVisible(false)
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function closePrompt() {
    setVisible(false)
    try { localStorage.setItem(dismissKey, String(Date.now() + dismissForMs)) }
    catch { /* Dismiss for this visit if storage is unavailable. */ }
  }

  async function installApp() {
    if (!deferredPrompt) {
      setInstructions(installInstructions())
      return
    }
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      if (choice.outcome === 'accepted') setVisible(false)
    } catch {
      setDeferredPrompt(null)
      setInstructions(installInstructions())
    }
  }

  if (!visible) return null

  return <aside className="install-prompt" aria-label="Installer Classico Mboa">
    <div className="install-prompt-bar">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="install-prompt-logo" src="/icons/classico-192.png" alt="" width={44} height={44} />
      <div className="install-prompt-text"><strong>Application Classico Mboa</strong><span>Billets, votes et tombola en un geste.</span></div>
      <button className="install-prompt-action" type="button" onClick={installApp}><Download size={15} aria-hidden="true" /> Télécharger</button>
      <button className="install-prompt-close" type="button" onClick={closePrompt} aria-label="Fermer le message d’installation"><X size={16} /></button>
    </div>
    {instructions && <p className="install-prompt-instructions" role="status">{instructions}</p>}
  </aside>
}
