import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdminNav } from '../../components/shared/admin-nav'
import { currentEdition } from '../../data/current-edition'
import { getRoleAccess } from '../../lib/auth'
import { formatXaf } from '../../lib/formatting'
import { getQuizAvailability, getQuizDb } from '../../lib/quiz'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Centre de commandement', robots: { index: false, follow: false } }

function StatCard({ label, value, detail, href }: { label: string; value: string | number; detail: string; href?: string }) {
  const content = <><span>{label}</span><strong>{value}</strong><small>{detail}</small></>
  return href ? <Link className="command-stat" href={href}>{content}<i aria-hidden="true">↗</i></Link> : <div className="command-stat">{content}</div>
}

export default async function AdminDashboard() {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) notFound()
  const db = identity.supabase
  const quizState = await getQuizAvailability()
  const [metricsResult, quizAnalytics, latestOrders] = await Promise.all([
    db.rpc('get_admin_dashboard_metrics', { p_edition: currentEdition.id }),
    getQuizDb().rpc('get_quiz_daily_analytics', { p_quiz_date: quizState.localDate }),
    db.from('ticket_orders').select('reference,customer_name,quantity,total_xaf,status,created_at').eq('edition_id', currentEdition.id).eq('is_test', false).order('created_at', { ascending: false }).limit(5),
  ])
  if (metricsResult.error || latestOrders.error) {
    throw new Error('Une partie des indicateurs est indisponible. Réessayez.')
  }
  const metrics = metricsResult.data?.[0] as {
    tickets_sold: number; ticket_revenue_xaf: number; paid_vote_orders: number; vote_revenue_xaf: number;
    tombola_entries: number; tombola_revenue_xaf: number; accepted_checkins: number; new_inquiries: number;
    paid_player_registrations: number
  } | undefined
  if (!metrics) throw new Error('Indicateurs de l’édition indisponibles. Réessayez.')
  const revenue = metrics.ticket_revenue_xaf + metrics.vote_revenue_xaf + metrics.tombola_revenue_xaf
  const analytics = quizAnalytics.data as unknown as { participants: number; completed: number } | null
  const eventDate = new Date(`${currentEdition.eventDate}T12:00:00+01:00`)
  const daysToEvent = Math.max(0, Math.ceil((eventDate.getTime() - Date.now()) / 86_400_000))

  return <main id="main-content" className="page-container command-center">
    <header className="command-header">
      <div><span className="eyebrow">CLASSICO MBOA · CENTRE DE COMMANDEMENT</span><h1>{currentEdition.editionNumber}e édition</h1><p>{new Intl.DateTimeFormat('fr-CM', { dateStyle: 'long', timeZone: currentEdition.timezone }).format(eventDate)} · {currentEdition.venue}</p></div>
      <div className="command-edition"><span>ÉDITION ACTUELLE</span><strong>{currentEdition.name}</strong><small>{daysToEvent} jours avant l’événement</small></div>
    </header>
    <AdminNav />
    <section className="command-section" aria-labelledby="command-kpis"><div className="command-section-title"><div><span className="eyebrow">VUE D’ENSEMBLE</span><h2 id="command-kpis">Aujourd’hui, sur l’édition</h2></div><span className="command-live"><i /> Données actualisées à l’ouverture</span></div>
      <div className="command-stats">
        <StatCard label="Billets vendus" value={metrics.tickets_sold} detail="Commandes payées, hors tests" href="/admin/tickets" />
        <StatCard label="Recettes confirmées" value={formatXaf(revenue)} detail="Billets, votes et tombola" href="/admin/tickets" />
        <StatCard label="Paiements votes" value={metrics.paid_vote_orders} detail={formatXaf(metrics.vote_revenue_xaf)} href="/admin/votes" />
        <StatCard label="Participations tombola" value={metrics.tombola_entries} detail={formatXaf(metrics.tombola_revenue_xaf)} href="/admin/tombola" />
        <StatCard label="Entrées contrôlées" value={metrics.accepted_checkins} detail="Scans acceptés" href="/admin/check-in" />
        <StatCard label="Quiz aujourd’hui" value={analytics?.participants ?? 0} detail={`${analytics?.completed ?? 0} terminés · ${quizState.status === 'open' ? 'ouvert' : 'verrouillé'}`} href="/admin/quiz" />
        <StatCard label="Joueurs inscrits" value={metrics.paid_player_registrations} detail="Inscriptions confirmées" href="/admin/players" />
        <StatCard label="À traiter" value={metrics.new_inquiries} detail="Demandes nouvelles" href="/admin/demandes?status=new" />
      </div>
    </section>
    <div className="command-columns">
      <section className="command-panel"><div className="command-section-title"><div><span className="eyebrow">À FAIRE</span><h2>Centre d’action</h2></div></div>
        <ul className="command-actions">
          {metrics.new_inquiries > 0 && <li><span className="command-action-dot urgent" /><div><strong>{metrics.new_inquiries} demande(s) à examiner</strong><small>Partenariats, contacts et stands</small></div><Link href="/admin/demandes?status=new">Ouvrir →</Link></li>}
          <li><span className="command-action-dot" /><div><strong>Quiz {quizState.status === 'open' ? 'ouvert' : 'verrouillé'}</strong><small>{quizState.status === 'open' ? 'Les participants peuvent jouer.' : 'Ouverture automatique à 20 h, heure de Douala.'}</small></div><Link href="/admin/quiz">Gérer →</Link></li>
          <li><span className="command-action-dot" /><div><strong>Billetterie et accès</strong><small>Commandes, catégories et contrôle à l’entrée</small></div><Link href="/admin/tickets">Ouvrir →</Link></li>
          <li><span className="command-action-dot" /><div><strong>Opérations de l’événement</strong><small>Votes, tombola et inscriptions joueurs</small></div><Link href="/admin/votes">Ouvrir →</Link></li>
        </ul>
      </section>
      <section className="command-panel"><div className="command-section-title"><div><span className="eyebrow">DERNIÈRES COMMANDES</span><h2>Activité billetterie</h2></div><Link href="/admin/tickets">Tout voir →</Link></div>
        {!latestOrders.data?.length ? <p className="command-empty">Aucune commande de billet réelle pour cette édition.</p> : <ul className="command-orders">{latestOrders.data.map(order => <li key={order.reference}><div><strong>{order.customer_name}</strong><small>{order.quantity} billet(s) · {new Intl.DateTimeFormat('fr-CM', { dateStyle: 'medium', timeZone: currentEdition.timezone }).format(new Date(order.created_at))}</small></div><span>{order.status === 'paid' ? formatXaf(order.total_xaf) : 'En attente'}</span></li>)}</ul>}
      </section>
    </div>
    <p className="command-footnote">Les indicateurs financiers affichent uniquement les ventes confirmées actuellement disponibles dans le système. Les montants de sponsors et les modules non encore configurés ne sont pas inclus.</p>
  </main>
}
