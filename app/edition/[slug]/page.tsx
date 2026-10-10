import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { editions, getPublicEdition } from '../../../data/editions'
import { editionTeams } from '../../../data/current-edition'
import { programme } from '../../../data/programme'
import { formatEventDate } from '../../../lib/formatting'
import { EventCountdown } from '../../../components/shared/event-countdown'
import { EventSchema } from '../../../components/shared/event-schema'
import { CTASection, InfoCards, PageHero, Section } from '../../../components/shared/page'
import { ProgrammeList } from '../../../components/public/programme-list'
import { ShareButton } from '../../../components/shared/share-button'
import { socialOpenGraphFor, socialTwitterFor } from '../../../lib/social-metadata'

// Data-backed prototype routes are published at build time.
export const dynamicParams = false

type Props = { params: Promise<{ slug: string }> }
export function generateStaticParams() { return editions.filter((edition) => getPublicEdition(edition.slug)).map(({ slug }) => ({ slug })) }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const edition = getPublicEdition((await params).slug)
  if (!edition) return {}
  const description = formatEventDate(edition.eventDate) + ' · ' + edition.venue + ', ' + edition.city
  return { title: edition.name, description, alternates: process.env.NEXT_PUBLIC_SITE_URL ? { canonical: '/edition/' + edition.slug } : undefined, openGraph: socialOpenGraphFor('/edition/' + edition.slug, edition.name, description), twitter: socialTwitterFor('/edition/' + edition.slug, edition.name, description) }
}
export default async function EditionPage({ params }: Props) {
  const edition = getPublicEdition((await params).slug)
  if (!edition) notFound()
  const completed = ['completed', 'archived'].includes(edition.status)
  return <main id="main-content" className="page-container"><EventSchema edition={edition} /><PageHero eyebrow={'ÉDITION ' + edition.editionNumber} title={edition.name} description={formatEventDate(edition.eventDate) + ' · ' + edition.venue + ' · ' + edition.city + ', ' + edition.country} status={completed ? 'Édition terminée' : edition.status === 'cancelled' ? 'Édition annulée' : edition.status === 'live' ? 'Édition en cours' : 'Rendez-vous à venir'} />
    {!completed && edition.status !== 'cancelled' && edition.status !== 'live' && <EventCountdown date={edition.eventDate} />}
    <Section title="Le Classico, version Mboa"><InfoCards items={editionTeams.filter((team) => team.editionId === edition.id).map((team) => ({ title: team.name, description: team.description || 'Effectif officiel à annoncer.' }))} /></Section>
    <Section title="Au programme"><ProgrammeList items={programme.filter((item) => item.editionId === edition.id)} /></Section>
    {!completed && edition.status !== 'cancelled' && <CTASection title="Votre rendez-vous au Classico" description="Consultez les informations officielles avant de préparer votre venue." href="/tickets" label="Billetterie" />}
    <ShareButton title={edition.name} />
  </main>
}
