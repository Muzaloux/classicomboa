import { PageHero } from '../../../components/shared/page'
import { RetrieveOrderForm } from '../../../components/tickets/checkout-form'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createAdminSupabase } from '../../../lib/supabase/admin'
import { accessHash } from '../../../lib/ticketing'
import { orderStatusLabels } from '../../../lib/ticketing-validation'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Retrouver ma commande', robots: { index: false, follow: false } }
export default async function RetrievePage() {
  const credentials = (await cookies()).getAll().filter(c => /^cm_order_[a-f0-9]{32}$/.test(c.name) && /^[a-f0-9]{64}$/.test(c.value)).slice(-10)
  const db = createAdminSupabase()
  const orders = await Promise.all(credentials.map(async c => {
    const { data } = await db.from('ticket_orders').select('reference,status,created_at').eq('reference', 'CM-' + c.name.slice(9)).eq('access_hash', accessHash(c.value)).maybeSingle()
    return data
  }))
  return <main id="main-content" className="page-container"><PageHero eyebrow="BILLETTERIE" title="Retrouvez vos billets." description="Vos commandes récentes sur cet appareil apparaissent ci-dessous. Sur un autre appareil, utilisez votre référence et votre clé privée." />
    <div className="inquiry-list">{orders.filter(o => o !== null).sort((a,b) => b.created_at.localeCompare(a.created_at)).map(order => <Link key={order.reference} className="inquiry-card order-reference" href={'/tickets/order/' + order.reference}>{order.reference} · {orderStatusLabels[order.status]}</Link>)}</div><RetrieveOrderForm /></main>
}
