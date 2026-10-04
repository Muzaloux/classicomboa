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
    <PageHero eyebrow="INSCRIPTION JOUEURS" title={open ? 'Rejoignez Barça Mboa ou Real Mboa.' : 'Inscriptions temporairement closes.'} description={open ? 'Inscrivez-vous ici. Après examen de votre demande, l’organisation vous contactera pour le paiement. Vos accès joueur vous seront communiqués après confirmation de votre contribution.' : 'Les inscriptions ne sont pas ouvertes pour le moment. Revenez bientôt ou contactez l’organisation.'} status={open ? 'Inscriptions ouvertes' : 'Inscriptions closes'} />
    {open && settings && <PlayerForm fee={16000} request={randomUUID()} access={randomBytes(32).toString('hex')} />}
  </main>
}
