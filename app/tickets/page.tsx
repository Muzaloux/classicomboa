import Link from 'next/link'
import { PageHero, EmptyState } from '../../components/shared/page'
import { ticketCatalog, testTicketingEnabled, ticketingEnabled, manualTicketingEnabled } from '../../lib/ticketing'
import { formatXaf } from '../../lib/formatting'
import { socialOpenGraphFor, socialTwitterFor } from '../../lib/social-metadata'
export const dynamic = 'force-dynamic'
const shareDescription = 'Choisissez votre catégorie de billet et préparez votre venue au Classico Mboa.'
export const metadata = { title: 'Billetterie', description: shareDescription, openGraph: socialOpenGraphFor('/tickets', 'Billetterie Classico Mboa', shareDescription), twitter: socialTwitterFor('/tickets', 'Billetterie Classico Mboa', shareDescription) }
export default async function TicketsPage() {
  const types = await ticketCatalog()
  return <main id="main-content" className="page-container ticket-page"><PageHero eyebrow="BILLETTERIE" title="Votre place au Classico." description="Choisissez votre catégorie et préparez votre venue." />
    {ticketingEnabled() ? <>{testTicketingEnabled() && <div className="test-banner" role="note">MODE TEST · Aucun paiement réel. Billets sans droit d’entrée.</div>}{manualTicketingEnabled() && <p>19 décembre 2026 · Choisissez MTN Mobile Money ou Orange Money au moment de la réservation. Vos billets sont délivrés après vérification du paiement.</p>}<div className="info-grid">{types.map(type => <article className="info-card" key={type.id}><h2>{type.name}</h2><p>{formatXaf(type.price_xaf)}</p>{type.available > 0 ? <Link className="button button-primary" href={'/tickets/checkout?type=' + type.id}>Choisir</Link> : <span className="muted">Réservation indisponible</span>}</article>)}</div>{!types.length && <EmptyState title="Aucune catégorie ouverte" description="Revenez lorsque l’organisation ouvrira la billetterie." />}</> : <EmptyState title="Les ventes ne sont pas encore ouvertes" description="Les tarifs et moyens de paiement seront confirmés par l’organisation avant l’ouverture." />}
    <Link className="text-link" href="/tickets/retrieve">Retrouver ma commande →</Link>
  </main>
}
