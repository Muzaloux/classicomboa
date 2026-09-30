import { PagePhoto } from '../../components/public/page-photo'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { publicPages } from '../../data/public-pages'
import { PublicPageContent } from '../../components/public/page-content'
import { InfoCards, PageHero } from '../../components/shared/page'
import { ShareButton } from '../../components/shared/share-button'
import { socialOpenGraph, socialTwitter } from '../../lib/social-metadata'

// Data-backed prototype routes are published at build time.
export const dynamicParams = false

type Props = { params: Promise<{ slug: string[] }> }
export function generateStaticParams() {
  return publicPages.filter(({ path }) => !path.startsWith('/edition/') && !path.startsWith('/tickets')).map(({ path }) => ({ slug: path.split('/').filter(Boolean) }))
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = publicPages.find((item) => item.path === '/' + slug.join('/'))
  if (!page) return {}
  return { title: page.title, description: page.description, alternates: process.env.NEXT_PUBLIC_SITE_URL ? { canonical: page.path } : undefined, openGraph: { ...socialOpenGraph, title: page.title, description: page.description }, twitter: { ...socialTwitter, title: page.title, description: page.description } }
}
export default async function PublicPage({ params }: Props) {
  const { slug } = await params
  const path = '/' + slug.join('/')
  const page = publicPages.find((item) => item.path === path)
  if (!page) notFound()
  return <main id="main-content" className="page-container">
    <PageHero {...page} />
    <PagePhoto path={path} /><PublicPageContent path={path} />
    {page.sections && !['/teams', '/players', '/programme', '/stands'].includes(path) && <InfoCards items={page.sections} />}
    {page.links && <nav className="public-page-links" aria-label="Pages associées">{page.links.map((link) => <Link className="text-link" href={link.href} key={link.href}>{link.label} →</Link>)}</nav>}
    <ShareButton title={page.title} />
  </main>
}
