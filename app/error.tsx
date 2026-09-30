'use client'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main id="main-content" className="public-page" role="alert">
      <section className="public-page-content">
        <span className="eyebrow">CLASSICO MBOA</span>
        <h1>Un problème est survenu.</h1>
        <p>La page n’a pas pu se charger. Réessayez dans un instant.</p>
        <button className="button button-primary" onClick={() => reset()}>
          Réessayer
        </button>
      </section>
    </main>
  )
}