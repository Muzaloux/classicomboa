'use client'

import { useState } from 'react'
import { Check, Copy, Facebook, MessageCircle, Share2 } from 'lucide-react'

export function QuizResultShare({ name, score }: { name: string; score: number }) {
  const [copied, setCopied] = useState(false)
  const message = `${name} a fait ${score}/100 au Quiz Classico Mboa. Tu peux faire mieux ?`
  const quizUrl = 'https://classicomboa.com/quiz'
  const encoded = encodeURIComponent(`${message} ${quizUrl}`)
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: 'Mon score · Quiz Classico Mboa', text: message, url: quizUrl }) } catch { /* Sharing may be cancelled by the participant. */ }
      return
    }
    await copy()
  }
  async function copy() {
    try { await navigator.clipboard.writeText(`${message} ${quizUrl}`); setCopied(true); window.setTimeout(() => setCopied(false), 2200) } catch { /* Clipboard access depends on browser permissions. */ }
  }
  return <div className="quiz-share">
    <button className="quiz-button" onClick={() => void share()}><Share2 size={17} /> PARTAGER MON SCORE</button>
    <div className="quiz-share-links">
      <a href={`https://wa.me/?text=${encoded}`} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quizUrl)}&quote=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer"><Facebook size={16} /> Facebook</a>
      <a href={`https://twitter.com/intent/tweet?text=${encoded}`} target="_blank" rel="noreferrer"><span aria-hidden="true">𝕏</span> X</a>
      <button onClick={() => void copy()}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copié' : 'Copier le lien'}</button>
    </div>
  </div>
}
