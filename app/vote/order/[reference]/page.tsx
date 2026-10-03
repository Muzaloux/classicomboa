import Link from 'next/link'
import { ownedVote, voteWhatsAppUrl } from '../../../../lib/voting'
import { createAdminSupabase } from '../../../../lib/supabase/admin'
import { voteStatusLabels } from '../../../../lib/voting-validation'
import { formatPhone, paymentContacts } from '../../../../lib/manual-payment'
import { formatXaf } from '../../../../lib/formatting'
import { PageHero } from '../../../../components/shared/page'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mes votes', robots: { index: false, follow: false }, referrer: 'no-referrer' as const }
export default async function VoteOrderPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const order = await ownedVote(reference)
  const status = order.status === 'pending' && Date.parse(order.expires_at) <= Date.now() ? 'expired' : order.status
  const [cand, cat] = await Promise.all([
    createAdminSupabase().from('vote_candidates').select('name').eq('id', order.candidate_id).single(),
    createAdminSupabase().from('vote_categories').select('name').eq('id', order.category_id).single(),
  ])
  if (cand.error || cat.error) throw new Error('Commande indisponible. Réessayez.')
  const contact = order.contact === 'youana' ? 'youana' : 'manuel'
  return <main id="main-content" className="page-container">
    <PageHero eyebrow="MES VOTES" title={voteStatusLabels[status]} description={`${order.quantity} vote(s) pour ${cand.data.name} · ${cat.data.name} · ${formatXaf(order.total_xaf)}`} />
    <p className="order-reference">Référence : {order.reference}</p>
    {status === 'pending' && <section className="payment-card content-section" aria-labelledby="payment-card-title"><div className="payment-card-heading"><span className={`payment-provider-badge provider-${contact}`} aria-hidden="true">{contact === 'manuel' ? 'MTN' : 'OM'}</span><div><span className="eyebrow">MOYEN DE PAIEMENT</span><h2 id="payment-card-title">{paymentContacts[contact].provider}</h2></div></div><div className="payment-card-details"><div><small>Montant à payer</small><strong>{formatXaf(order.total_xaf)}</strong></div><div><small>Référence</small><strong>{order.reference}</strong></div><div className="payment-number"><small>Numéro de paiement</small><strong>{formatPhone(paymentContacts[contact].paymentNumber ?? paymentContacts[contact].contactNumber)}</strong></div>{paymentContacts[contact].accountName && <div><small>Nom du compte</small><strong>{paymentContacts[contact].accountName}</strong></div>}</div><p className="payment-warning"><strong>Avant de valider, vérifiez que le nom du bénéficiaire affiché par {paymentContacts[contact].provider} correspond bien à celui confirmé par l’organisation.</strong></p><p>Effectuez le paiement au numéro affiché, puis envoyez votre référence sur WhatsApp. L’ouverture de WhatsApp ne confirme pas le paiement.</p><a className="button button-primary" href={voteWhatsAppUrl(contact, order)}>J’ai payé · Contacter {paymentContacts[contact].name} →</a><p>Après vérification par l’organisation, actualisez cette page : vos votes seront comptés.</p><a className="text-link" href={'/vote/order/' + order.reference}>Actualiser ma commande →</a></section>}
    {status === 'paid' && <p>Merci ! Vos votes ont été comptés.</p>}
    {status === 'expired' && <p>Si vous avez déjà payé, contactez {paymentContacts[contact].name} avec cette référence : l’organisation peut encore confirmer votre paiement.</p>}
    <Link className="button button-outline" href="/vote">Voter à nouveau</Link>
  </main>
}
