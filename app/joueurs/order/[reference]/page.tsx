import Link from 'next/link'
import { ownedPlayer, playerWhatsAppUrl } from '../../../../lib/players'
import { playerClubs, playerStatusLabels } from '../../../../lib/players-validation'
import { formatPhone, paymentContacts } from '../../../../lib/manual-payment'
import { formatXaf } from '../../../../lib/formatting'
import { PageHero } from '../../../../components/shared/page'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mon inscription', robots: { index: false, follow: false }, referrer: 'no-referrer' as const }
export default async function PlayerOrderPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const order = await ownedPlayer(reference)
  const contact = order.contact === 'youana' ? 'youana' : 'manuel'
  const club = playerClubs[order.club as keyof typeof playerClubs] ?? order.club
  return <main id="main-content" className="page-container">
    <PageHero eyebrow="MON INSCRIPTION" title={playerStatusLabels[order.status]} description={`${order.player_name} · ${club} · ${formatXaf(order.amount_xaf)}`} />
    <p className="order-reference">Référence : {order.reference}</p>
    {order.status === 'pending' && <section className="payment-card content-section" aria-labelledby="payment-card-title"><div className="payment-card-heading"><span className={`payment-provider-badge provider-${contact}`} aria-hidden="true">{contact === 'manuel' ? 'MTN' : 'OM'}</span><div><span className="eyebrow">MOYEN DE PAIEMENT</span><h2 id="payment-card-title">{paymentContacts[contact].provider}</h2></div></div><div className="payment-card-details"><div><small>Montant à payer (en totalité)</small><strong>{formatXaf(order.amount_xaf)}</strong></div><div><small>Référence</small><strong>{order.reference}</strong></div><div className="payment-number"><small>Numéro de paiement</small><strong>{formatPhone(paymentContacts[contact].paymentNumber ?? paymentContacts[contact].contactNumber)}</strong></div>{paymentContacts[contact].accountName && <div><small>Nom du compte</small><strong>{paymentContacts[contact].accountName}</strong></div>}</div><p className="payment-warning"><strong>Avant de valider, vérifiez que le nom du bénéficiaire affiché par {paymentContacts[contact].provider} correspond bien à celui confirmé par l’organisation.</strong></p><p>Effectuez le paiement au numéro affiché, puis envoyez votre référence sur WhatsApp. L’ouverture de WhatsApp ne confirme pas le paiement.</p><a className="button button-primary" href={playerWhatsAppUrl(contact, { ...order, club })}>J’ai payé · Contacter {paymentContacts[contact].name} →</a><p>Après vérification par l’organisation, actualisez cette page : votre inscription sera confirmée.</p><a className="text-link" href={'/joueurs/order/' + order.reference}>Actualiser mon inscription →</a></section>}
    {order.status === 'paid' && <p>Merci ! Votre paiement est confirmé : vous êtes inscrit avec {club}.</p>}
    <Link className="button button-outline" href="/">Retour à l’accueil</Link>
  </main>
}
