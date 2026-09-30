import Link from 'next/link'
import QRCode from 'qrcode'
import { ownedOrder, testTicketingEnabled } from '../../../../lib/ticketing'
import { createAdminSupabase } from '../../../../lib/supabase/admin'
import { orderStatusLabels, ticketStatusLabels } from '../../../../lib/ticketing-validation'
import { formatXaf, formatEventDate } from '../../../../lib/formatting'
import { currentEdition } from '../../../../data/current-edition'
import { PageHero } from '../../../../components/shared/page'
import { PrintTickets, TestPaymentForm } from '../../../../components/tickets/checkout-form'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ma commande', robots: { index: false, follow: false }, referrer: 'no-referrer' as const }
export default async function OrderPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const { order, token } = await ownedOrder(reference)
  const expired = order.status === 'pending' && Date.parse(order.expires_at) <= Date.now()
  const status = expired ? 'expired' : order.status
  const { data: tickets, error } = await createAdminSupabase().from('tickets').select('ticket_code,qr_token,holder_name,status,is_test').eq('order_id', order.id).order('unit_number')
  if (error) throw new Error('Billets indisponibles. Réessayez.')
  const renderedTickets = await Promise.all((tickets ?? []).map(async ticket => ({ ...ticket, qr: await QRCode.toDataURL('CM-TICKET:' + ticket.qr_token, { width: 280, margin: 4, errorCorrectionLevel: 'M' }) })))
  return <main id="main-content" className="page-container"><PageHero eyebrow="MA COMMANDE" title={orderStatusLabels[status]} description={`${order.quantity} billet(s) · ${formatXaf(order.total_xaf)} · ${order.customer_name}`} />
    {order.is_test && <div className="test-banner">MODE TEST · Aucun paiement réel · Ne permet pas d’entrer à l’événement.</div>}
    <p className="order-reference">Référence : {order.reference}</p>
    <details className="recovery-details no-print"><summary>Conserver ma clé de récupération</summary><p>Copiez cette clé et la référence dans un endroit privé. Elles permettent de retrouver vos billets sur un autre appareil. Aucun e-mail automatique n’est envoyé pour ce test.</p><code>{token}</code><Link href="/tickets/retrieve" className="text-link">Retrouver une commande →</Link></details>
    {status === 'pending' && <><p>Réservation valable jusqu’à {new Intl.DateTimeFormat('fr-CM', { timeStyle: 'short', timeZone: currentEdition.timezone }).format(new Date(order.expires_at))} (Douala).</p>{testTicketingEnabled() && <TestPaymentForm reference={reference} />}</>}
    {['failed', 'expired'].includes(status) && <Link className="button button-primary" href="/tickets">Créer une nouvelle commande</Link>}
    {!!renderedTickets.length && <><PrintTickets /><div className="ticket-grid">{renderedTickets.map(ticket => <article className="digital-ticket" key={ticket.ticket_code}><span className="eyebrow">CLASSICO MBOA · {currentEdition.editionNumber}E ÉDITION</span><h2>{ticket.holder_name}</h2><p>{formatEventDate(currentEdition.eventDate)} · {currentEdition.venue}</p>{ticket.is_test && <strong>BILLET DE TEST — SANS DROIT D’ENTRÉE</strong>}<p>{ticketStatusLabels[ticket.status]}</p>{ticket.status === 'valid' && <img src={ticket.qr} width={280} height={280} alt={'Code QR du billet ' + ticket.ticket_code} />}<code>{ticket.ticket_code}</code></article>)}</div></>}
  </main>
}
