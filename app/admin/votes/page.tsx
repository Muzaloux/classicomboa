import { notFound } from 'next/navigation'
import { getRoleAccess } from '../../../lib/auth'
import { currentEdition } from '../../../data/current-edition'
import { formatXaf } from '../../../lib/formatting'
import { voteStatusLabels } from '../../../lib/voting-validation'
import { PageHero } from '../../../components/shared/page'
import { AdminNav } from '../../../components/shared/admin-nav'
import { ConfirmVotePaymentForm, VoteCategoryForm } from '../../../components/vote/admin-forms'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Organisation — votes', robots: { index: false, follow: false } }
export default async function AdminVotes({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) notFound()
  const status = Object.hasOwn(voteStatusLabels, (await searchParams).status ?? '') ? (await searchParams).status! : 'pending'
  const [orders, categories, results] = await Promise.all([
    identity.supabase.from('vote_orders').select('reference,voter_name,voter_phone,quantity,total_xaf,status,contact,expires_at,candidate_id').eq('edition_id', currentEdition.id).eq('status', status).order('created_at', { ascending: false }).limit(50),
    identity.supabase.from('vote_categories').select('id,name,status,results_public').eq('edition_id', currentEdition.id).order('sort_order'),
    identity.supabase.rpc('vote_results', { p_edition: currentEdition.id, p_public_only: false }),
  ])
  if (orders.error || categories.error) throw new Error('Votes indisponibles. Réessayez.')
  const names = new Map((results.data ?? []).map(r => [r.candidate_id, r.candidate_name]))
  return <main id="main-content" className="page-container"><PageHero eyebrow="ORGANISATION" title="Les votes." description="Confirmez les paiements Mobile Money, ouvrez ou clôturez les catégories et publiez les résultats." /><AdminNav />
    <form className="platform-form" method="get"><label>Statut<select name="status" defaultValue={status}>{Object.entries(voteStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="button button-outline">Filtrer</button></form>
    <h2>{orders.data.length} commande(s) de votes</h2><div className="inquiry-list">{orders.data.map(o => <article className="inquiry-card" key={o.reference}><h3>{o.voter_name} · {o.voter_phone}</h3><p>{o.quantity} vote(s) pour {names.get(o.candidate_id) ?? '—'} · {formatXaf(o.total_xaf)} · {o.contact === 'youana' ? 'Orange Money' : 'MTN Mobile Money'}</p><span className="order-reference">{o.reference}</span>{o.status !== 'paid' && <ConfirmVotePaymentForm reference={o.reference} amount={o.total_xaf} />}</article>)}</div>
    <h2>Catégories</h2><div className="ticket-grid">{categories.data.map(c => <VoteCategoryForm key={JSON.stringify(c)} category={c} />)}</div>
    <h2>Décompte actuel</h2>{[...new Set((results.data ?? []).map(r => r.category_name))].map(name => <section key={name}><h3>{name}</h3><ol className="results-list">{(results.data ?? []).filter(r => r.category_name === name).slice(0, 10).map(r => <li key={r.candidate_id}>{r.candidate_name} — {Number(r.votes)}</li>)}</ol></section>)}
  </main>
}
