export default function Loading() {
  return (
    <div className="public-page" role="status" aria-busy="true" aria-live="polite">
      <section className="public-page-content">
        <span className="eyebrow">CLASSICO MBOA</span>
        <p>Chargement…</p>
      </section>
    </div>
  )
}