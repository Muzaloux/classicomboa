import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdminNav } from '../../../../components/shared/admin-nav'
import { PageHero } from '../../../../components/shared/page'
import { currentEdition } from '../../../../data/current-edition'
import { getRoleAccess } from '../../../../lib/auth'
import { getQuizAvailability, getQuizDb } from '../../../../lib/quiz'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Organisation — participants du quiz', robots: { index: false, follow: false } }
const pageSize = 30

export default async function AdminQuizAttempts({ searchParams }: { searchParams: Promise<{ date?: string; page?: string }> }) {
  if (!await getRoleAccess(currentEdition.id, ['admin', 'manager'])) notFound()
  const params = await searchParams
  const today = (await getQuizAvailability()).localDate
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? '') ? params.date! : today
  const page = Math.min(10000, Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1))
  const { data, error, count } = await getQuizDb().from('quiz_attempts')
    .select('participant_name,participant_phone,score,correct_answers,completion_seconds,status,started_at,completed_at', { count: 'exact' })
    .eq('quiz_date', date)
    .order('score', { ascending: false, nullsFirst: false })
    .order('completion_seconds', { ascending: true, nullsFirst: false })
    .order('completed_at', { ascending: true, nullsFirst: false })
    .range((page - 1) * pageSize, page * pageSize - 1)
  if (error) throw new Error('Participants du quiz indisponibles. Réessayez.')
  const formatTime = (seconds: number | null) => seconds === null ? '—' : `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s`
  const pageHref = (number: number) => `/admin/quiz/attempts?${new URLSearchParams({ date, page: String(number) })}`

  return <main id="main-content" className="page-container command-center">
    <PageHero eyebrow="ORGANISATION · QUIZ QUOTIDIEN" title="Les participants." description="Classement complet des tentatives et statuts. Les numéros de téléphone sont visibles uniquement au personnel autorisé pour la gestion des gagnants." />
    <AdminNav />
    <div className="quiz-attempt-toolbar"><form method="get"><label>Date du quiz<input type="date" name="date" defaultValue={date} /><input type="hidden" name="page" value="1" /></label><button className="button button-outline">Afficher</button></form><span>{count ?? 0} participant(s)</span></div>
    {error ? <p role="alert">Impossible de charger les participants.</p> : !data?.length ? <p className="command-empty">Aucune participation pour le {date}.</p> : <div className="quiz-attempt-table-wrap"><table className="quiz-attempt-table"><thead><tr><th>Rang</th><th>Participant</th><th>Téléphone</th><th>Score</th><th>Bonnes réponses</th><th>Temps</th><th>Statut</th></tr></thead><tbody>{data.map((attempt, index) => {
      const eligible = attempt.status === 'completed' && attempt.completion_seconds !== null && attempt.completion_seconds < 240
      const rank = attempt.score === null ? '—' : String((page - 1) * pageSize + index + 1).padStart(2, '0')
      return <tr key={`${attempt.started_at}-${index}`}><td>{rank}</td><td>{attempt.participant_name}</td><td><a href={`tel:${attempt.participant_phone}`}>{attempt.participant_phone}</a></td><td>{attempt.score === null ? '—' : `${attempt.score} pts`}</td><td>{attempt.correct_answers === null ? '—' : `${attempt.correct_answers}/5`}</td><td>{formatTime(attempt.completion_seconds)}</td><td><span className={eligible ? 'attempt-status is-eligible' : 'attempt-status'}>{eligible ? 'Admissible' : attempt.status === 'disqualified' ? 'Éliminé · délai' : attempt.status === 'expired' ? 'Expiré' : attempt.status === 'started' ? 'En cours' : 'Non admissible'}</span></td></tr>
    })}</tbody></table></div>}
    <nav className="account-actions" aria-label="Pagination">{page > 1 && <Link href={pageHref(page - 1)}>← Précédent</Link>}{page * pageSize < (count ?? 0) && <Link href={pageHref(page + 1)}>Suivant →</Link>}</nav>
  </main>
}
