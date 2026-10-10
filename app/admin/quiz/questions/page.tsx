import { notFound } from 'next/navigation'
import { AdminNav } from '../../../../components/shared/admin-nav'
import { PageHero } from '../../../../components/shared/page'
import { getRoleAccess } from '../../../../lib/auth'
import { currentEdition } from '../../../../data/current-edition'
import { getQuizDb } from '../../../../lib/quiz'
import { saveQuizQuestion } from '../actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Organisation — questions du quiz', robots: { index: false, follow: false } }

type Option = { id: string; label: string; is_correct: boolean; sort_order: number }
type Question = { id: string; question: string; category: string; difficulty: 'easy'|'medium'|'hard'|'boss'; explanation: string | null; status: 'draft'|'active'|'archived'; quiz_options: Option[] }

const emptyQuestion: Question = { id: '', question: '', category: 'El Clásico', difficulty: 'medium', explanation: '', status: 'draft', quiz_options: [0,1,2,3].map((sort_order) => ({ id: '', label: '', is_correct: sort_order === 0, sort_order })) }

function QuestionForm({ item, title }: { item: Question; title: string }) {
  const options = [...item.quiz_options].sort((a,b) => a.sort_order-b.sort_order)
  const correctOption = Math.max(0,options.findIndex((option) => option.is_correct))
  return <details className="quiz-question-editor" open={!item.id}><summary><span>{title}</span><small>{item.status.toUpperCase()} · {item.difficulty.toUpperCase()}</small></summary><form className="quiz-admin-form" action={saveQuizQuestion}>
    <input type="hidden" name="questionId" value={item.id} />
    <label className="quiz-wide-field">Question<input name="question" required minLength={8} maxLength={600} defaultValue={item.question} /></label>
    <label>Catégorie<input name="category" required maxLength={80} defaultValue={item.category} /></label>
    <label>Difficulté<select name="difficulty" defaultValue={item.difficulty}>{[['easy','Facile'],['medium','Moyenne'],['hard','Difficile'],['boss','Boss']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label>Statut<select name="status" defaultValue={item.status}>{[['draft','Brouillon'],['active','Active'],['archived','Archivée']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="quiz-wide-field">Explication après la session<textarea name="explanation" maxLength={1200} defaultValue={item.explanation ?? ''} /></label>
    {options.map((option,index) => <div className="quiz-option-edit" key={option.id || index}><label>Option {String.fromCharCode(65+index)}<input required maxLength={400} name={`option${index}`} defaultValue={option.label} /></label><label className="quiz-check-label"><input type="radio" name="correctOption" value={index} defaultChecked={index===correctOption} /> Bonne réponse</label></div>)}
    <button className="button button-primary">Enregistrer la question</button>
  </form></details>
}

export default async function QuizQuestionsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  if (!await getRoleAccess(currentEdition.id, ['admin','manager'])) notFound()
  const [result, analyticsResult, params] = await Promise.all([
    getQuizDb().from('quiz_questions').select('id,question,category,difficulty,explanation,status,quiz_options(id,label,is_correct,sort_order)').order('created_at', { ascending: false }),
    getQuizDb().rpc('get_quiz_question_analytics'),
    searchParams,
  ])
  if (result.error) throw new Error('La banque de questions est momentanément indisponible.')
  const questions = (result.data ?? []) as unknown as Question[]
  const analytics = (analyticsResult.data ?? []) as unknown as { question_id: string; times_shown: number; correct_answers: number; incorrect_answers: number; success_rate: number }[]
  const stats = new Map(analytics.map((item) => [item.question_id,item]))
  return <main id="main-content" className="page-container quiz-admin-page">
    <PageHero eyebrow="ORGANISATION · BANQUE DE QUESTIONS" title="Questions du quiz." description="Créez et modifiez les questions, définissez une seule bonne réponse et gérez leur activation. Une question utilisée ne peut pas être supprimée." /><AdminNav />
    {params.saved && <p className="form-feedback success" role="status">Question enregistrée.</p>}{params.error && <p className="quiz-error" role="alert">Vérifiez le texte, les quatre options et la bonne réponse, puis réessayez.</p>}
    <QuestionForm item={emptyQuestion} title="Ajouter une question" />
    <div className="quiz-admin-question-list">{questions.map((question) => { const metric = stats.get(question.id); return <div className="quiz-admin-question" key={question.id}>
      <div className="quiz-question-metrics"><span>{metric?.times_shown ?? 0} vues</span><span>{metric?.correct_answers ?? 0} bonnes réponses</span><span>{metric?.incorrect_answers ?? 0} erreurs</span><strong>{metric?.success_rate ?? 0}% de réussite</strong></div>
      <QuestionForm item={{...question,quiz_options:[...question.quiz_options].sort((a,b)=>a.sort_order-b.sort_order)}} title={question.question} />
    </div>})}</div>
  </main>
}
