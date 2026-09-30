import { redirect } from 'next/navigation'
import { AdminNav } from '../../components/shared/admin-nav'
import type { Metadata } from 'next'
import Link from 'next/link'
import { currentEdition } from '../../data/current-edition'
import { getStaffAccess, getRoleAccess } from '../../lib/auth'
import { PageHero, EmptyState } from '../../components/shared/page'
import { InquiryStatusForm } from '../../components/forms/inquiry-status-form'
import { signOut } from '../auth/actions'

export const metadata: Metadata = { title: 'Organisation — demandes', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'
const statusLabels: Record<string, string> = { new: 'Nouveau', in_review: 'En cours', closed: 'Clôturé' }
const kindLabels: Record<string, string> = { contact: 'Contact', partner: 'Partenariat', exhibitor: 'Exposant' }
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const identity = await getStaffAccess(currentEdition.id)
  if (!identity && await getRoleAccess(currentEdition.id, ['checkin'])) redirect('/admin/check-in')
  if (!identity) return <main id="main-content" className="page-container"><PageHero eyebrow="ORGANISATION" title="Accès réservé." description="Connectez-vous avec un compte de l’équipe organisatrice pour gérer les demandes." /><Link className="text-link" href="/auth/sign-in">Connexion organisateur →</Link></main>
  const params = await searchParams
  const page = Math.min(10000, Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1))
  const status = ['new', 'in_review', 'closed'].includes(params.status ?? '') ? params.status! : ''
  let query = identity.supabase.from('inquiries').select('id,kind,name,email,phone,organization,message,status,created_at', { count: 'exact' }).eq('edition_id', currentEdition.id)
  if (status) query = query.eq('status', status)
  const { data, error, count } = await query.order('created_at', { ascending: false }).order('id').range((page - 1) * 20, page * 20 - 1)
  return <main id="main-content" className="page-container">
    <PageHero eyebrow={'ORGANISATION · ÉDITION ' + currentEdition.editionNumber} title="Les demandes." description="Contacts, propositions de partenariat et demandes d’exposition. Les changements de statut sont enregistrés dans le journal d’activité." />
    <AdminNav /><div className="account-actions"><span>{count ?? 0} demande(s)</span><Link className="button button-outline" href="/admin/security">Mon mot de passe</Link><form action={signOut}><button className="button button-outline">Me déconnecter</button></form></div>
    <nav className="form-tabs" aria-label="Filtrer les demandes">{[['', 'Toutes'], ...Object.entries(statusLabels)].map(([value, label]) => <Link key={value} aria-current={status === value ? 'page' : undefined} href={'/admin?status=' + value}>{label}</Link>)}</nav>
    {error ? <p className="form-feedback error" role="alert">Impossible de charger les demandes. Réessayez plus tard.</p> : !data?.length ? <EmptyState title="Aucune demande" description="Les demandes correspondant à ce filtre apparaîtront ici." /> : <div className="inquiry-list">{data.map((item) => <article className="inquiry-card" key={item.id}>
      <div className="inquiry-heading"><span className="eyebrow">{kindLabels[item.kind]}</span><span className="inquiry-badge">{statusLabels[item.status]}</span></div>
      <h2>{item.name}</h2><p className="muted">{item.organization}</p>
      <p><a href={'mailto:' + item.email}>{item.email}</a>{item.phone && <> · <a href={'tel:' + item.phone}>{item.phone}</a></>}</p>
      <p className="inquiry-message">{item.message}</p>
      <p className="muted"><time dateTime={item.created_at}>{new Intl.DateTimeFormat('fr-CM', { dateStyle: 'medium', timeStyle: 'short', timeZone: currentEdition.timezone }).format(new Date(item.created_at))}</time> · Réf. {item.id}</p>
      <InquiryStatusForm key={item.id + ':' + item.status} id={item.id} status={item.status} />
    </article>)}</div>}
    <nav className="account-actions" aria-label="Pagination">{page > 1 && <Link href={`/admin?status=${status}&page=${page - 1}`}>← Précédent</Link>}{page * 20 < (count ?? 0) && <Link href={`/admin?status=${status}&page=${page + 1}`}>Suivant →</Link>}</nav>
  </main>
}
