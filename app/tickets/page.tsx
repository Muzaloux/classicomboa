import Link from 'next/link'
import { PageHero, EmptyState } from '../../components/shared/page'
import { ticketCatalog, testTicketingEnabled } from '../../lib/ticketing'
import { formatXaf } from '../../lib/formatting'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Billetterie' }
export default async function TicketsPage() {
  const types = await ticketCatalog()
  return <main id="main-content" className="page-container"><PageHero eyebrow="BILLETTERIE" title="Votre place au Classico." description="Choisissez votre catégorie et préparez votre venue." />
    {testTicketingEnabled() ? <><div className="test-banner" role="note">MODE TEST · Aucun paiement réel. Billets sans droit d’entrée.</div><div className="info-grid">{types.map(type => <article className="info-card" key={type.id}><h2>{type.name}</h2><p>{formatXaf(type.price_xaf)}</p><p>{type.available} place(s) disponible(s)</p>{type.available > 0 ? <Link className="button button-primary" href={'/tickets/checkout?type=' + type.id}>Choisir</Link> : <p>Complet</p>}</article>)}</div>{!types.length && <EmptyState title="Aucune catégorie ouverte" description="Revenez lorsque l’organisation ouvrira une catégorie de test." />}</> : <EmptyState title="Les ventes ne sont pas encore ouvertes" description="Les tarifs, capacités et moyens de paiement seront confirmés par l’organisation avant l’ouverture." />}
    <Link className="text-link" href="/tickets/retrieve">Retrouver ma commande →</Link>
  </main>
}
