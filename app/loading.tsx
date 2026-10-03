import Image from 'next/image'

export default function Loading() {
  return (
    <div className="site-loading" role="status" aria-busy="true" aria-label="Chargement de Classico Mboa">
      <div className="site-loading-content">
        <Image className="site-loading-logo" src="/classico-mboa-wordmark.png" alt="Classico Mboa" width={860} height={960} preload sizes="(max-width: 600px) 84vw, 600px" />
        <span className="site-loading-progress" aria-hidden="true"><span /></span>
        <span className="site-loading-label">CHARGEMENT…</span>
      </div>
    </div>
  )
}
