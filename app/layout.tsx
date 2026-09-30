import type { Metadata } from 'next'
import { DM_Sans, Oswald } from 'next/font/google'
import { Navbar } from '../components/layout/navbar'
import { Footer } from '../components/layout/footer'
import { OfflineStatus } from '../components/shared/offline-status'
import { SiteMotion } from '../components/shared/site-motion'
import { socialOpenGraph, socialTwitter } from '../lib/social-metadata'
import '../src/styles.css'
import '../src/premium.css'

const bodyFont = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const displayFont = Oswald({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const description = 'Classico Mboa rassemble football, culture, musique et divertissement autour du Classico version Mboa au Cameroun.'
export const metadata: Metadata = {
  title: { default: 'Classico Mboa | Le Classico Version Mboa', template: '%s | Classico Mboa' },
  description,
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  openGraph: { ...socialOpenGraph, title: 'Classico Mboa | Le Classico Version Mboa', description },
  twitter: { ...socialTwitter, title: 'Classico Mboa', description },
}
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr-CM" className={bodyFont.variable + ' ' + displayFont.variable}><body><a className="skip-link" href="#main-content">Aller au contenu</a><Navbar /><OfflineStatus />{children}<Footer /><SiteMotion /></body></html>
}
