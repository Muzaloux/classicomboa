import { createHash } from 'node:crypto'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { QuizResultShare } from '../../../../components/quiz/quiz-result-share'
import { getQuizDb } from '../../../../lib/quiz'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Mon score — Quiz Classico Mboa', robots: { index: false, follow: false } }

type Result = {
  reference: string; name: string; date: string; status: string; score: number | null; correctAnswers: number | null;
  totalQuestions: number; completionSeconds: number | null; review: { question: string; selected: string | null; correct: string; isCorrect: boolean }[] | null
}

function resultCopy(score: number) {
  if (score === 100) return ['PARFAIT !', 'Un sans-faute. Tu connais le Clásico par cœur.']
  if (score >= 80) return ['TRÈS FORT.', 'Tu as une sacrée mémoire football.']
  if (score >= 60) return ['PAS MAL.', 'Le prochain défi est déjà à portée de crampons.']
  if (score >= 40) return ['IL FAUT RÉVISER.', 'On se retrouve demain pour prendre ta revanche.']
  if (score >= 20) return ['ON SE RETROUVE DEMAIN.', 'Le Clásico t’a donné du fil à retordre.']
  return ['LE CLÁSICO T’A EU.', 'Pas de panique, un nouveau quiz t’attend demain.']
}

export default async function QuizResultPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  if (!/^[a-f0-9]{32}$/.test(reference)) notFound()
  const bucket = createHash('sha256').update(`result:${reference}`).digest('hex')
  const { data, error } = await getQuizDb().rpc('get_public_quiz_attempt', { p_reference: reference, p_bucket_hash: bucket })
  if (error || !data) notFound()
  const result = data as unknown as Result
  const date = new Intl.DateTimeFormat('fr-CM', { dateStyle: 'long', timeZone: 'Africa/Douala' }).format(new Date(`${result.date}T12:00:00+01:00`))
  const [headline, note] = resultCopy(result.score ?? 0)
  return <main id="main-content" className="quiz-page quiz-result-page"><section className="quiz-result-card">
    <div className="quiz-brandline"><span className="quiz-mark">CM</span><span>CLASSICO MBOA <b>QUIZ</b></span></div>
    {result.status === 'completed' ? <>
      <span className="quiz-kicker">RÉSULTAT DU {date.toUpperCase()}</span>
      <p className="quiz-result-name">{result.name}</p>
      <div className="quiz-result-score"><strong>{result.score}</strong><span>/ 100</span></div>
      <h1>{headline}</h1><p className="quiz-result-note">{note}</p>
      <div className="quiz-result-stats"><span><strong>{result.correctAnswers} / 5</strong> BONNES RÉPONSES</span>{result.completionSeconds !== null && <span><strong>{result.completionSeconds}s</strong> TEMPS</span>}</div>
      <QuizResultShare name={result.name.split(/\s+/)[0]} score={result.score ?? 0} />
      {result.review?.length ? <section className="quiz-review"><h2>Réponses du quiz</h2>{result.review.map((item, index) => <article key={`${index}-${item.question}`}><span>0{index + 1}</span><div><strong>{item.question}</strong><p className={item.isCorrect ? 'is-right' : 'is-wrong'}>{item.isCorrect ? 'Bonne réponse' : `Ta réponse : ${item.selected ?? 'Sans réponse'}`} · {item.correct}</p></div></article>)}</section> : <p className="quiz-result-note quiz-review-later">Les réponses détaillées ne sont pas révélées pendant la session du jour.</p>}
    </> : result.status === 'started' ? <><span className="quiz-kicker">PARTIE EN COURS</span><h1>Ton quiz<br /><em>t’attend.</em></h1><p className="quiz-result-note">Reprends cette tentative depuis l’appareil utilisé pour la commencer.</p><Link className="quiz-button" href="/quiz">REPRENDRE <span aria-hidden="true">→</span></Link></> : <><span className="quiz-kicker">PARTIE FERMÉE</span><h1>À demain.</h1><p className="quiz-result-note">Le délai est écoulé ou le quiz est fermé. Cette partie ne peut plus être reprise.</p><Link className="quiz-button" href="/quiz">RETOUR AU QUIZ</Link></>}
  </section></main>
}
