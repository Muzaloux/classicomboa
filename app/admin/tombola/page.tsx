import { notFound } from 'next/navigation'
import { getRoleAccess } from '../../../lib/auth'
import { currentEdition } from '../../../data/current-edition'
import { formatXaf } from '../../../lib/formatting'
import { drawStatusLabels, tombolaStatusLabels } from '../../../lib/tombola-validation'
import { PageHero } from '../../../components/shared/page'
import { AdminNav } from '../../../components/shared/admin-nav'
import { ConfirmTombolaPaymentForm, DrawSettingsForm, RunDrawForm } from '../../../components/tombola/admin-forms'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Organisation — tombola', robots: { index: false, follow: false } }
export default async function AdminTombola({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) notFound()
  const requested = (await searchParams).status ?? ''
  const status = Object.hasOwn(tombolaStatusLabels, requested) ? requested : 'pending'
  const [orders, draws, winners] = await Promise.all([
    identity.supabase.from('tombola_orders').select('reference,buyer_name,buyer_phone,quantity,total_xaf,contact,draw_id').eq('edition_id', currentEdition.id).eq('status', status).order('created_at', { ascending: false }).limit(50),
    identity.supabase.from('tombola_draws').select('id,name,prize,status,winners_count,results_public').eq('edition_id', currentEdition.id).order('sort_order'),
    identity.supabase.from('tombola_winners').select('rank,draw_id,tombola_entries(entry_number,tombola_orders(buyer_name,buyer_phone,reference))').order('rank'),
  ])
  if (orders.error || draws.error) throw new Error('Tombola indisponible. Réessayez.')
  const counts = await Promise.all(draws.data.map(async d => [d.id, (await identity.supabase.from('tombola_entries').select('id', { count: 'exact', head: true }).eq('draw_id', d.id)).count ?? 0] as const))
  const entryCount = new Map(counts)
  return <main id="main-content" className="page-container"><PageHero eyebrow="ORGANISATION" title="La tombola." description="Confirmez les paiements Mobile Money, clôturez les ventes puis lancez le tirage définitif." /><AdminNav />
    <form className="platform-form" method="get"><label>Statut<select name="status" defaultValue={status}>{Object.entries(tombolaStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="button button-outline">Filtrer</button></form>
    <h2>{orders.data.length} commande(s)</h2><div className="inquiry-list">{orders.data.map(o => <article className="inquiry-card" key={o.reference}><h3>{o.buyer_name} · {o.buyer_phone}</h3><p>{o.quantity} participation(s) · {formatXaf(o.total_xaf)} · {o.contact === 'youana' ? 'Orange Money' : 'MTN Mobile Money'}</p><span className="order-reference">{o.reference}</span>{status !== 'paid' && <ConfirmTombolaPaymentForm reference={o.reference} amount={o.total_xaf} />}</article>)}</div>
    <h2>Tirages</h2><div className="ticket-grid">{draws.data.map(d => <section key={d.id}><p><strong>{drawStatusLabels[d.status]}</strong> · {entryCount.get(d.id) ?? 0} numéro(s) payé(s)</p><DrawSettingsForm draw={d} locked={d.status === 'drawn'} />{d.status === 'closed' && <RunDrawForm id={d.id} />}</section>)}</div>
    {!!winners.data?.length && <><h2>Gagnants (visible par l’organisation)</h2><ol className="results-list">{winners.data.map(w => { const e = w.tombola_entries as unknown as { entry_number: number; tombola_orders: { buyer_name: string; buyer_phone: string; reference: string } } | null; return <li key={w.draw_id + w.rank}><strong>N° {e?.entry_number}</strong> — {e?.tombola_orders.buyer_name} · {e?.tombola_orders.buyer_phone} · {e?.tombola_orders.reference}</li> })}</ol></>}
  </main>
}
