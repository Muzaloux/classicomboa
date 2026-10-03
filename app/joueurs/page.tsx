import { randomBytes, randomUUID } from 'node:crypto'
import { PageHero } from '../../components/shared/page'
import { PlayerForm } from '../../components/players/player-form'
import { playerRegistrationEnabled, registrationSettings } from '../../lib/players'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Inscription des joueurs', robots: { index: false, follow: false } }
export default async function PlayersPage() {
  const settings = playerRegistrationEnabled() ? await registrationSettings() : null
  const open = !!settings?.is_open
  return <main id="main-content" className="page-container">
    <PageHero eyebrow="RÉSERVÉ AUX JOUEURS" title={open ? 'Inscrivez-vous au Classico.' : 'Inscriptions closes.'} description={open ? 'Choisissez votre club, Real Mboa ou Barça Mboa, puis réglez vos frais d’inscription par Mobile Money.' : 'Les inscriptions des joueurs ne sont pas ouvertes pour le moment. Contactez l’organisation.'} status={open ? 'Inscriptions ouvertes' : 'Inscriptions closes'} />
    {open && settings && <PlayerForm fee={settings.fee_xaf} request={randomUUID()} access={randomBytes(32).toString('hex')} />}
  </main>
}
