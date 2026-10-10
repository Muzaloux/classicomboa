import { notFound } from 'next/navigation'
import { PageHero } from '../../../../components/shared/page'
import { AdminNav } from '../../../../components/shared/admin-nav'
import { getRoleAccess } from '../../../../lib/auth'
import { currentEdition } from '../../../../data/current-edition'
import { getQuizAvailability, getQuizDb } from '../../../../lib/quiz'
import { savePrizeStatus } from './actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Gagnants et cadeaux — quiz', robots: { index: false, follow: false } }

type Leader = {
  public_reference: string
  participant_name: string
  participant_phone: string
  score: number
  completion_seconds: number | null
  prize_awarded_at: string | null
  prize_note: string | null
}

function previousDate(date: string) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() - 1)
  return value.toISOString().slice(0, 10)
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

export default async function QuizWinnersPage({ searchParams }: { searchParams: Promise<{ date?: string; saved?: string; error?: string }> }) {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) notFound()
  const [state, params] = await Promise.all([getQuizAvailability(), searchParams])
  const latestFinalDate = previousDate(state.localDate)
  const date = params.date && isDate(params.date) && params.date < state.localDate ? params.date : latestFinalDate
  const { data, error } = await getQuizDb().from('quiz_attempts')
    .select('public_reference,participant_name,participant_phone,score,completion_seconds,prize_awarded_at,prize_note')
    .eq('quiz_date', date)
    .eq('status', 'completed')
    .order('score', { ascending: false })
    .order('completion_seconds', { ascending: true })
    .order('completed_at', { ascending: true })
    .limit(2)
  if (error) throw new Error('Classement indisponible. Réessayez.')
  const leaders = (data ?? []) as Leader[]
  const message = params.error === 'notwinner' ? 'Seuls les deux premiers du classement final peuvent recevoir un cadeau.'
    : params.error === 'notfinal' ? 'Le classement du jour sera final après minuit, heure de Douala.'
      : params.error ? 'Impossible d’enregistrer le statut du cadeau.'
        : params.saved ? 'Statut du cadeau enregistré.' : ''

  return <main id="main-content" className="page-container quiz-admin-page">
    <PageHero eyebrow="ORGANISATION · QUIZ QUOTIDIEN" title="Gagnants et cadeaux." description="Retrouvez les deux premiers du classement final et suivez la remise de leurs cadeaux." />
    <AdminNav />
    {message && <p className={params.error ? 'quiz-error' : 'form-feedback success'} role={params.error ? 'alert' : 'status'}>{message}</p>}
    <form className="quiz-winner-date" method="get">
      <label htmlFor="winner-date">Date du classement</label>
      <input id="winner-date" type="date" name="date" max={latestFinalDate} defaultValue={date} />
      <button className="button button-outline">Afficher</button>
    </form>
    <p className="quiz-winner-rule">Classement définitif · points, rapidité, puis heure de validation.</p>
    {!leaders.length ? <p className="quiz-leaderboard-empty">Aucune partie terminée pour cette date.</p> : <section className="quiz-winner-list" aria-label="Les deux premiers du classement">
      {leaders.map((leader, index) => <article className="quiz-winner-card" key={leader.public_reference}>
        <div className="quiz-winner-rank">0{index + 1}</div>
        <div className="quiz-winner-info"><span className="eyebrow">{index === 0 ? '1er PRIX' : '2e PRIX'}</span><h2>{leader.participant_name}</h2><a href={`tel:${leader.participant_phone}`}>{leader.participant_phone}</a></div>
        <div className="quiz-winner-score"><strong>{leader.score}</strong><span>PTS</span><small>{leader.completion_seconds ?? '—'} sec</small></div>
        <form className="quiz-winner-gift" action={savePrizeStatus}>
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="reference" value={leader.public_reference} />
          <input type="hidden" name="status" value={leader.prize_awarded_at ? 'pending' : 'given'} />
          <label>Note de remise <input name="note" maxLength={300} defaultValue={leader.prize_note ?? ''} placeholder="Ex. cadeau remis en main propre" /></label>
          <button className={leader.prize_awarded_at ? 'button button-outline' : 'button button-primary'}>
            {leader.prize_awarded_at ? 'Cadeau remis · annuler' : 'Marquer le cadeau remis'}
          </button>
          {leader.prize_awarded_at && <small>Remis le {new Intl.DateTimeFormat('fr-CM', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Douala' }).format(new Date(leader.prize_awarded_at))}</small>}
        </form>
      </article>)}
    </section>}
  </main>
}
