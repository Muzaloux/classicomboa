import type { Metadata } from 'next'
import { PageHero } from '../../../components/shared/page'
import { getQuizAvailability, getQuizDb } from '../../../lib/quiz'
import { QUIZ_DURATION_SECONDS } from '../../../lib/quiz-constants'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Classement du quiz', description: 'Le classement complet des participants au quiz quotidien Classico Mboa.' }

type Attempt = {
  participant_name: string
  status: 'started' | 'completed' | 'expired' | 'disqualified'
  score: number | null
  completion_seconds: number | null
  completed_at: string | null
  started_at: string
}

const PAGE_SIZE = 500

async function getTodayAttempts(localDate: string): Promise<Attempt[]> {
  const attempts: Attempt[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await getQuizDb().from('quiz_attempts')
      .select('participant_name,status,score,completion_seconds,completed_at,started_at')
      .eq('quiz_date', localDate)
      .order('started_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`Impossible de charger les participants du quiz: ${error.message}`)
    const page = (data ?? []) as Attempt[]
    attempts.push(...page)
    if (page.length < PAGE_SIZE) break
  }
  return attempts
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'Participant'
}

export default async function QuizLeaderboardPage() {
  const state = await getQuizAvailability()
  const attempts = await getTodayAttempts(state.localDate)
  const ranked = attempts.filter((attempt) => attempt.score !== null && attempt.status !== 'started')
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)
      || (a.completion_seconds ?? Number.MAX_SAFE_INTEGER) - (b.completion_seconds ?? Number.MAX_SAFE_INTEGER)
      || (a.completed_at ?? a.started_at).localeCompare(b.completed_at ?? b.started_at))
  const unscored = attempts.filter((attempt) => attempt.score === null || attempt.status === 'started')
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
  const participantCount = attempts.length

  let eligibleRank = 0
  return <main id="main-content" className="page-container quiz-leaderboard">
    <PageHero eyebrow={`QUIZ CLASSICO MBOA · ${state.localDate}`} title="Le classement." description="Tous les participants et leurs résultats sont affichés. Les rangs officiels comptent uniquement les parties terminées en moins de 4 minutes : points d’abord, puis temps de réponse. Les résultats hors délai restent visibles, sans rang admissible aux cadeaux." />
    <p className="quiz-participant-count"><strong>{participantCount}</strong> participant{participantCount === 1 ? '' : 's'} aujourd’hui</p>
    {!participantCount ? <p className="quiz-leaderboard-empty">Aucun participant pour le classement du jour.</p> : <>
      <ol aria-label="Classement de tous les participants ayant un score">
        {ranked.map((entry, index) => {
          const eligible = entry.status === 'completed' && entry.completion_seconds !== null && entry.completion_seconds < QUIZ_DURATION_SECONDS
          const stateLabel = eligible ? 'Éligible aux cadeaux' : entry.status === 'disqualified' ? 'Éliminé · délai dépassé' : entry.status === 'expired' ? 'Partie interrompue' : 'Non admissible'
          return <li key={`${entry.started_at}-${index}`} className={eligible ? 'quiz-result-eligible' : 'quiz-result-ineligible'}>
            <span className="quiz-rank">{eligible ? String(++eligibleRank).padStart(2, '0') : '—'}</span>
            <strong>{firstName(entry.participant_name)}</strong>
            <span className="quiz-result-score">{entry.score} pts</span>
            <small>{entry.completion_seconds === null ? '—' : `${entry.completion_seconds} sec`}</small>
            <em>{stateLabel}</em>
          </li>
        })}
      </ol>
      {unscored.length > 0 && <section className="quiz-unscored-participants" aria-labelledby="quiz-unscored-title">
        <h2 id="quiz-unscored-title">Autres participants</h2>
        <p>Parties commencées sans score final, affichées ici pour que chaque participation soit comptée.</p>
        <ul>{unscored.map((entry, index) => <li key={`${entry.started_at}-${index}`}>
          <strong>{firstName(entry.participant_name)}</strong>
          <span>{entry.status === 'started' ? 'Partie en cours' : 'Aucun score enregistré'}</span>
        </li>)}</ul>
      </section>}
    </>}
  </main>
}
