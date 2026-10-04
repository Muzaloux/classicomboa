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
    <p>Nom à imprimer : <strong>{order.kit_name}</strong> · Dossard : <strong>{order.dorsal_number}</strong></p>
    {order.status === 'pending' && <section className="payment-card content-section"><h2>Votre demande est en cours d’examen</h2><p>Contactez l’organisation avec votre référence et attendez son approbation. Ne payez pas encore.</p><a className="button button-primary" href={playerWhatsAppUrl(contact, { ...order, club })}>Contacter l’organisation sur WhatsApp →</a><p>Après approbation, revenez sur cette page pour afficher les coordonnées de paiement.</p><a className="text-link" href={'/joueurs/order/' + order.reference}>Actualiser mon statut →</a></section>}
    {order.status === 'approved' && <section className="payment-card content-section" aria-labelledby="payment-card-title"><div className="payment-card-heading"><span className={`payment-provider-badge provider-${contact}`} aria-hidden="true">{contact === 'manuel' ? 'MTN' : 'OM'}</span><div><span className="eyebrow">PAIEMENT APRÈS APPROBATION</span><h2 id="payment-card-title">{paymentContacts[contact].provider}</h2></div></div><div className="payment-card-details"><div><small>Location du terrain</small><strong>10 000 XAF</strong></div><div><small>Kit imprimé complet</small><strong>6 000 XAF</strong></div><div><small>Total à régler</small><strong>{formatXaf(order.amount_xaf)}</strong></div><div><small>Référence</small><strong>{order.reference}</strong></div>{paymentContacts[contact].paymentNumber && <div className="payment-number"><small>Numéro de paiement</small><strong>{formatPhone(paymentContacts[contact].paymentNumber)}</strong></div>}{paymentContacts[contact].accountName && <div><small>Nom du compte</small><strong>{paymentContacts[contact].accountName}</strong></div>}</div><p className="payment-warning"><strong>{paymentContacts[contact].paymentNumber ? `Avant de valider, vérifiez le bénéficiaire affiché par ${paymentContacts[contact].provider} auprès de l’organisation.` : `Écrivez à ${paymentContacts[contact].name} pour recevoir le numéro de paiement officiel ${paymentContacts[contact].provider}.`}</strong></p><p>Effectuez le paiement intégral, puis envoyez votre référence et le reçu sur WhatsApp. L’ouverture de WhatsApp ne confirme pas le paiement.</p><a className="button button-primary" href={playerWhatsAppUrl(contact, { ...order, club })}>{paymentContacts[contact].paymentNumber ? 'J’ai payé' : 'Demander les coordonnées de paiement'} · Contacter {paymentContacts[contact].name} →</a><p>Après vérification par l’organisation, actualisez cette page.</p><a className="text-link" href={'/joueurs/order/' + order.reference}>Actualiser mon inscription →</a></section>}
    {order.status === 'rejected' && <p>Contactez l’organisation si vous souhaitez obtenir des précisions sur cette décision.</p>}
    {order.status === 'paid' && <section className="content-section"><h2>Paiement confirmé</h2><p>Merci ! Votre inscription avec {club} est complète. L’organisation vous communiquera vos accès joueur après confirmation de votre paiement.</p></section>}
    <Link className="button button-outline" href="/">Retour à l’accueil</Link>
  </main>
}
