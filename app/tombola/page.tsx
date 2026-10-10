import { randomBytes, randomUUID } from 'node:crypto'
import Link from 'next/link'
import { PageHero } from '../../components/shared/page'
import { PublicPageContent } from '../../components/public/page-content'
import { TombolaForm } from '../../components/tombola/tombola-form'
import { openDraws, tombolaEnabled } from '../../lib/tombola'
import { socialOpenGraphFor, socialTwitterFor } from '../../lib/social-metadata'
export const dynamic = 'force-dynamic'
const shareDescription = 'Participez à la tombola du Classico Mboa et retrouvez les informations du tirage.'
export const metadata = { title: 'Tombola', description: shareDescription, openGraph: socialOpenGraphFor('/tombola', 'Tombola | Classico Mboa', shareDescription), twitter: socialTwitterFor('/tombola', 'Tombola | Classico Mboa', shareDescription) }
export default async function TombolaPage() {
  const draws = await openDraws()
  const open = draws.length > 0
  return <main id="main-content" className="page-container">
    <PageHero eyebrow="TOMBOLA" title={open ? 'Tentez votre chance.' : 'La tombola ouvre bientôt.'} description={open ? 'Achetez vos numéros par Mobile Money. Le tirage est effectué par le système, sans intervention manuelle, et le résultat est publié ici.' : 'Les modalités et la date du tirage seront annoncées ici.'} status={open ? 'Tombola ouverte' : 'Aucune tombola ouverte'} />
    {open ? draws.map(draw => <TombolaForm key={draw.id} draw={draw} request={randomUUID()} access={randomBytes(32).toString('hex')} />) : <PublicPageContent path="/tombola" />}
    {tombolaEnabled() && <nav className="public-page-links" aria-label="Pages associées"><Link className="text-link" href="/tombola/results">Gagnants →</Link></nav>}
  </main>
}
