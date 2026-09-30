import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRoleAccess } from '../../../lib/auth'
import { currentEdition } from '../../../data/current-edition'
import { formatXaf } from '../../../lib/formatting'
import { orderStatusLabels } from '../../../lib/ticketing-validation'
import { PageHero } from '../../../components/shared/page'
import { AdminNav } from '../../../components/shared/admin-nav'
import { TicketTypeForm } from '../../../components/tickets/admin-forms'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Organisation — billetterie', robots: { index: false, follow: false } }
export default async function AdminTickets({ searchParams }: { searchParams: Promise<{ page?: string; status?: string; reference?: string }> }) {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) notFound()
  const params = await searchParams
  const page = Math.min(10000, Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1))
  const status = Object.hasOwn(orderStatusLabels, params.status ?? '') ? params.status! : ''
  const reference = (params.reference ?? '').trim().slice(0, 35)
  let query = identity.supabase.from('ticket_orders').select('reference,customer_name,quantity,total_xaf,status,is_test,expires_at', { count: 'exact' }).eq('edition_id', currentEdition.id)
  if (status) query = query.eq('status', status)
  if (reference) query = query.eq('reference', reference)
  const [orders, types] = await Promise.all([query.order('created_at', { ascending: false }).order('id').range((page - 1) * 20, page * 20 - 1), identity.supabase.from('ticket_types').select('id,name,price_xaf,capacity,status,is_test').eq('edition_id', currentEdition.id).order('price_xaf')])
  if (orders.error || types.error) throw new Error('Billetterie indisponible. Réessayez.')
  const href = (p: number) => '/admin/tickets?' + new URLSearchParams({ page: String(p), status, reference })
  return <main id="main-content" className="page-container"><PageHero eyebrow="ORGANISATION" title="La billetterie." description="Suivez les commandes et réglez les catégories. Les commandes de test ne sont pas des recettes réelles." /><AdminNav />
    <form className="platform-form" method="get"><label>Référence exacte<input name="reference" defaultValue={reference} placeholder="CM-…" maxLength={35} /></label><label>Statut<select name="status" defaultValue={status}><option value="">Tous</option>{Object.entries(orderStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="button button-outline">Filtrer</button></form>
    <h2>{orders.count ?? 0} commande(s)</h2><div className="inquiry-list">{orders.data.map(order => <article className="inquiry-card" key={order.reference}><span className="eyebrow">{order.is_test ? 'TEST — aucun encaissement' : 'RÉEL'}</span><h3>{order.customer_name}</h3><p>{order.quantity} billet(s) · {formatXaf(order.total_xaf)} · {orderStatusLabels[order.status === 'pending' && Date.parse(order.expires_at) <= Date.now() ? 'expired' : order.status]}</p><Link className="text-link order-reference" href={'/admin/tickets/' + order.reference}>{order.reference} →</Link></article>)}</div>
    <nav className="account-actions" aria-label="Pagination des commandes">{page > 1 && <Link href={href(page - 1)}>← Précédent</Link>}{page * 20 < (orders.count ?? 0) && <Link href={href(page + 1)}>Suivant →</Link>}</nav>
    <h2>Catégories</h2><p>Une catégorie ouverte n’active pas les paiements réels. Les capacités des billets annulés restent réservées pour préserver les historiques.</p><div className="ticket-grid">{types.data.map(type => <TicketTypeForm key={JSON.stringify(type)} type={type} />)}</div>
  </main>
}
