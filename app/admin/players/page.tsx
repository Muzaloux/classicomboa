import { notFound } from 'next/navigation'
import { getRoleAccess } from '../../../lib/auth'
import { currentEdition } from '../../../data/current-edition'
import { formatXaf } from '../../../lib/formatting'
import { playerClubs, playerStatusLabels } from '../../../lib/players-validation'
import { PageHero } from '../../../components/shared/page'
import { AdminNav } from '../../../components/shared/admin-nav'
import { ConfirmPlayerPaymentForm, PlayerSettingsForm } from '../../../components/players/admin-forms'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Organisation — joueurs', robots: { index: false, follow: false } }
const clubName = (club: string) => playerClubs[club as keyof typeof playerClubs] ?? club
export default async function AdminPlayers({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) notFound()
  const requested = (await searchParams).status ?? ''
  const status = Object.hasOwn(playerStatusLabels, requested) ? requested : 'pending'
  const [orders, settings, paid] = await Promise.all([
    identity.supabase.from('player_registrations').select('reference,player_name,player_phone,club,amount_xaf,contact,receipt_reference,paid_at').eq('edition_id', currentEdition.id).eq('status', status).order('created_at', { ascending: false }).limit(100),
    identity.supabase.from('player_registration_settings').select('fee_xaf,is_open').eq('edition_id', currentEdition.id).maybeSingle(),
    identity.supabase.from('player_registrations').select('club,amount_xaf').eq('edition_id', currentEdition.id).eq('status', 'paid'),
  ])
  if (orders.error || settings.error || paid.error) throw new Error('Joueurs indisponibles. Réessayez.')
  const perClub = Object.keys(playerClubs).map(club => ({ club, count: paid.data.filter(p => p.club === club).length }))
  const collected = paid.data.reduce((sum, p) => sum + p.amount_xaf, 0)
  return <main id="main-content" className="page-container"><PageHero eyebrow="ORGANISATION" title="Les joueurs." description="Confirmez le paiement intégral des frais d’inscription : seuls les joueurs confirmés sont comptés." /><AdminNav />
    <p><strong>{paid.data.length} joueur(s) inscrit(s)</strong> · {perClub.map(c => `${clubName(c.club)} : ${c.count}`).join(' · ')} · {formatXaf(collected)} encaissés</p>
    {settings.data && <PlayerSettingsForm fee={settings.data.fee_xaf} isOpen={settings.data.is_open} />}
    <form className="platform-form" method="get"><label>Statut<select name="status" defaultValue={status}>{Object.entries(playerStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="button button-outline">Filtrer</button></form>
    <h2>{orders.data.length} inscription(s)</h2><div className="inquiry-list">{orders.data.map(o => <article className="inquiry-card" key={o.reference}><h3>{o.player_name} · {o.player_phone}</h3><p>{clubName(o.club)} · {formatXaf(o.amount_xaf)} · {o.contact === 'youana' ? 'Orange Money' : 'MTN Mobile Money'}{o.receipt_reference ? ` · reçu ${o.receipt_reference}` : ''}</p><span className="order-reference">{o.reference}</span>{status === 'pending' && <ConfirmPlayerPaymentForm reference={o.reference} amount={o.amount_xaf} />}</article>)}</div>
  </main>
}
