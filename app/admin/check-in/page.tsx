import { notFound } from 'next/navigation'
import { getRoleAccess } from '../../../lib/auth'
import { currentEdition } from '../../../data/current-edition'
import { PageHero } from '../../../components/shared/page'
import { AdminNav } from '../../../components/shared/admin-nav'
import { CheckinForm } from '../../../components/tickets/admin-forms'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Contrôle des billets', robots: { index: false, follow: false } }
export default async function CheckinPage() {
  if (!await getRoleAccess(currentEdition.id, ['admin', 'manager', 'checkin'])) notFound()
  return <main id="main-content" className="page-container"><PageHero eyebrow="CONTRÔLE D’ACCÈS" title="Validez chaque billet." description="Scannez le QR ou saisissez le code. Une connexion est nécessaire pour éviter les entrées en double." /><AdminNav /><CheckinForm /></main>
}
