import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main-content" className="public-page">
      <section className="public-page-content">
        <span className="eyebrow">404 · CLASSICO MBOA</span>
        <h1>Cette page est introuvable.</h1>
        <p>Le lien est peut-être incorrect ou la page n’est pas encore publiée.</p>
        <Link className="button button-primary" href="/">
          Retour à l’accueil <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  )
}