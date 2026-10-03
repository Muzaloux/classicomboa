import { randomBytes, randomUUID } from 'node:crypto'
import Link from 'next/link'
import { PageHero, Section } from '../../components/shared/page'
import { VoteForm } from '../../components/vote/vote-form'
import { openCategories, votingEnabled } from '../../lib/voting'
import { voteCategories } from '../../data/catalog'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Votes & distinctions' }
export default async function VotePage() {
  const categories = await openCategories()
  const open = categories.length > 0
  return <main id="main-content" className="page-container">
    <PageHero eyebrow="VOTES & DISTINCTIONS" title={open ? 'Votez pour vos favoris.' : 'Les votes ouvrent bientôt.'} description={open ? 'Choisissez un candidat, indiquez le nombre de votes et payez par Mobile Money. Vos votes comptent dès que l’organisation a vérifié le paiement.' : 'Les campagnes, catégories et dates de vote seront annoncées ici.'} status={open ? 'Votes ouverts' : 'Aucun vote ouvert'} />
    {open ? <VoteForm categories={categories} request={randomUUID()} access={randomBytes(32).toString('hex')} /> : <Section title="Les distinctions envisagées"><div className="category-grid">{voteCategories.map(name => <div key={name}>{name}<small>À confirmer</small></div>)}</div></Section>}
    {votingEnabled() && <nav className="public-page-links" aria-label="Pages associées"><Link className="text-link" href="/vote/results">Résultats →</Link></nav>}
  </main>
}
