import { randomInt, randomUUID } from 'node:crypto'
import { redirect } from 'next/navigation'
import { ticketCatalog, testTicketingEnabled } from '../../../lib/ticketing'
import { PageHero } from '../../../components/shared/page'
import { CheckoutForm } from '../../../components/tickets/checkout-form'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Réserver des billets', robots: { index: false, follow: false } }
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type: id } = await searchParams
  const types = await ticketCatalog()
  const type = types.find(t => t.id === id && t.available > 0)
  if (!type) redirect('/tickets')
  const test = testTicketingEnabled()
  const recoveryCode = randomInt(0, 1_000_000).toString().padStart(6, '0')
  return <main id="main-content" className="page-container"><PageHero eyebrow={test ? 'COMMANDE DE TEST' : 'BILLETTERIE'} title="Réservez vos places." description={test ? 'Aucun montant ne sera débité. Les billets de test ne donnent pas accès à l’événement.' : 'Classique : 1 000 XAF · VIP : 2 000 XAF. Choisissez MTN Mobile Money ou Orange Money, puis faites vérifier votre paiement par l’organisation.'} /><CheckoutForm type={type} request={randomUUID()} access={recoveryCode} test={test} /></main>
}
