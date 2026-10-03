import Link from 'next/link'
import { ownedTombola, tombolaWhatsAppUrl } from '../../../../lib/tombola'
import { createAdminSupabase } from '../../../../lib/supabase/admin'
import { tombolaStatusLabels } from '../../../../lib/tombola-validation'
import { paymentContacts, formatPhone } from '../../../../lib/manual-payment'
import { formatXaf } from '../../../../lib/formatting'
import { PageHero } from '../../../../components/shared/page'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ma participation', robots: { index: false, follow: false }, referrer: 'no-referrer' as const }
export default async function TombolaOrderPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const order = await ownedTombola(reference)
  const status = order.status === 'pending' && Date.parse(order.expires_at) <= Date.now() ? 'expired' : order.status
  const db = createAdminSupabase()
  const [draw, entries] = await Promise.all([
    db.from('tombola_draws').select('name,status').eq('id', order.draw_id).single(),
    db.from('tombola_entries').select('id,entry_number').eq('order_id', order.id).order('entry_number'),
  ])
  if (draw.error || entries.error) throw new Error('Commande indisponible. Réessayez.')
  const winners = entries.data.length ? await db.from('tombola_winners').select('entry_id,rank').in('entry_id', entries.data.map(e => e.id)) : { data: [], error: null }
  const won = draw.data.status === 'drawn' && !winners.error && winners.data.length > 0
  const winningNumber = won ? entries.data.find(e => e.id === winners.data![0].entry_id)?.entry_number : undefined
  const contact = order.contact === 'youana' ? 'youana' : 'manuel'
  return <main id="main-content" className="page-container">
    <PageHero eyebrow="MA PARTICIPATION" title={tombolaStatusLabels[status]} description={`${order.quantity} participation(s) · ${draw.data.name} · ${formatXaf(order.total_xaf)}`} />
    <p className="order-reference">Référence : {order.reference}</p>
    {status === 'pending' && <section className="payment-card content-section" aria-labelledby="payment-card-title"><div className="payment-card-heading"><span className={`payment-provider-badge provider-${contact}`} aria-hidden="true">{contact === 'manuel' ? 'MTN' : 'OM'}</span><div><span className="eyebrow">MOYEN DE PAIEMENT</span><h2 id="payment-card-title">{paymentContacts[contact].provider}</h2></div></div><div className="payment-card-details"><div><small>Montant à payer</small><strong>{formatXaf(order.total_xaf)}</strong></div><div><small>Référence</small><strong>{order.reference}</strong></div><div className="payment-number"><small>Numéro de paiement</small><strong>{formatPhone(paymentContacts[contact].paymentNumber ?? paymentContacts[contact].contactNumber)}</strong></div>{paymentContacts[contact].accountName && <div><small>Nom du compte</small><strong>{paymentContacts[contact].accountName}</strong></div>}</div><p className="payment-warning"><strong>Avant de valider, vérifiez que le nom du bénéficiaire affiché par {paymentContacts[contact].provider} correspond bien à celui confirmé par l’organisation.</strong></p><p>Effectuez le paiement au numéro affiché, puis envoyez votre référence sur WhatsApp. L’ouverture de WhatsApp ne confirme pas le paiement.</p><a className="button button-primary" href={tombolaWhatsAppUrl(contact, order)}>J’ai payé · Contacter {paymentContacts[contact].name} →</a><p>Après vérification par l’organisation, actualisez cette page : vos numéros apparaîtront.</p><a className="text-link" href={'/tombola/order/' + order.reference}>Actualiser ma commande →</a></section>}
    {status === 'paid' && <section className="content-section"><h2>Vos numéros</h2><p className="tombola-numbers">{entries.data.map(e => <span key={e.id}>{e.entry_number}</span>)}</p>{draw.data.status === 'drawn' ? (won ? <p className="payment-warning"><strong>Félicitations ! Votre numéro {winningNumber} a été tiré. L’organisation vous contactera par téléphone.</strong></p> : <p>Le tirage a eu lieu. Votre numéro n’a pas été tiré cette fois, merci de votre participation.</p>) : <p>Conservez cette page : elle prouve vos numéros pour le tirage.</p>}</section>}
    {status === 'expired' && <p>Si vous avez déjà payé, contactez {paymentContacts[contact].name} avec cette référence : l’organisation peut encore confirmer votre paiement tant que le tirage n’a pas eu lieu.</p>}
    <Link className="button button-outline" href="/tombola">Retour à la tombola</Link>
  </main>
}
