export default function Loading() {
  return (
    <div className="site-loading" role="status" aria-busy="true" aria-label="Chargement de Classico Mboa">
      <div className="site-loading-content">
        <video className="site-loading-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
          <source src="/classico-loading.mp4" type="video/mp4" />
        </video>
        <span className="site-loading-name">CLASSICO <b>MBOA</b></span>
        <span className="site-loading-progress" aria-hidden="true"><span /></span>
        <span className="site-loading-label">CHARGEMENT…</span>
      </div>
    </div>
  )
}
