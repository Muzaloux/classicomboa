import type { Metadata } from 'next'
import { PageHero } from '../../../components/shared/page'
import { getQuizAvailability, getQuizDb } from '../../../lib/quiz'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Classement du quiz', description: 'Les meilleurs scores du quiz quotidien Classico Mboa.' }

type Entry = { participant_name: string; score: number; completion_seconds: number | null; completed_at: string }

export default async function QuizLeaderboardPage() {
  const state = await getQuizAvailability()
  const { data } = await getQuizDb().from('quiz_attempts')
    .select('participant_name,score,completion_seconds,completed_at')
    .eq('quiz_date', state.localDate).eq('status','completed')
    .order('score',{ascending:false}).order('completion_seconds',{ascending:true}).order('completed_at',{ascending:true}).limit(100)
  const entries = (data ?? []) as Entry[]
  return <main id="main-content" className="page-container quiz-leaderboard"><PageHero eyebrow={`QUIZ CLASSICO MBOA · ${state.localDate}`} title="Le classement." description="Les deux premiers remportent un cadeau. Points, puis temps le plus court ; à égalité, premier à valider." />
    {!entries.length ? <p className="quiz-leaderboard-empty">Le classement du jour apparaîtra après les premières parties.</p> : <ol>{entries.map((entry,index) => <li key={`${entry.completed_at}-${index}`}><span className="quiz-rank">{String(index+1).padStart(2,'0')}</span><strong>{entry.participant_name.split(/\s+/)[0]}</strong><span>{entry.score} pts</span><small>{entry.completion_seconds ?? '—'} sec</small></li>)}</ol>}
  </main>
}
