import { notFound } from 'next/navigation'
import { getRoleAccess } from '../../../../lib/auth'
import { currentEdition } from '../../../../data/current-edition'
import { referenceSchema, orderStatusLabels, ticketStatusLabels } from '../../../../lib/ticketing-validation'
import { formatXaf } from '../../../../lib/formatting'
import { PageHero } from '../../../../components/shared/page'
import { AdminNav } from '../../../../components/shared/admin-nav'
import { VoidTicketForm } from '../../../../components/tickets/admin-forms'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Détail de commande', robots: { index: false, follow: false } }
export default async function AdminOrder({ params }: { params: Promise<{ reference: string }> }) {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) notFound()
  const { reference } = await params
  if (!referenceSchema.safeParse(reference).success) notFound()
  const { data: order, error } = await identity.supabase.from('ticket_orders').select('id,reference,customer_name,customer_email,customer_phone,quantity,total_xaf,status,is_test').eq('reference', reference).eq('edition_id', currentEdition.id).maybeSingle()
  if (error) throw new Error('Commande indisponible.')
  if (!order) notFound()
  const [tickets, payments] = await Promise.all([identity.supabase.from('tickets').select('ticket_code,status,checked_in_at').eq('order_id', order.id).order('unit_number'), identity.supabase.from('payment_transactions').select('provider,amount_xaf,status,settled_at').eq('order_id', order.id)])
  if (tickets.error || payments.error) throw new Error('Détails indisponibles.')
  return <main id="main-content" className="page-container"><PageHero eyebrow={order.is_test ? 'COMMANDE DE TEST' : 'COMMANDE'} title={order.customer_name} description={`${order.quantity} billet(s) · ${formatXaf(order.total_xaf)} · ${orderStatusLabels[order.status]}`} /><AdminNav /><p className="order-reference">{reference}</p><p>{order.customer_email} · {order.customer_phone}</p>
    <h2>Paiement</h2>{payments.data.map(payment => <p key={payment.provider}>{payment.provider === 'test' ? 'Simulation — aucun encaissement' : payment.provider} · {payment.status} · {formatXaf(payment.amount_xaf)}</p>)}
    <h2>Billets</h2>{!tickets.data.length && <p>Aucun billet délivré.</p>}{tickets.data.map(ticket => <article className="inquiry-card" key={ticket.ticket_code}><h3>{ticket.ticket_code}</h3><p>{ticketStatusLabels[ticket.status]}</p>{ticket.checked_in_at && <p>Contrôlé le {new Intl.DateTimeFormat('fr-CM', { dateStyle: 'short', timeStyle: 'short', timeZone: currentEdition.timezone }).format(new Date(ticket.checked_in_at))}</p>}{ticket.status === 'valid' && <VoidTicketForm code={ticket.ticket_code} />}</article>)}
  </main>
}
