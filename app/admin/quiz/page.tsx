import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AdminNav } from '../../../components/shared/admin-nav'
import { PageHero } from '../../../components/shared/page'
import { getRoleAccess } from '../../../lib/auth'
import { currentEdition } from '../../../data/current-edition'
import { getQuizAvailability, getQuizDb } from '../../../lib/quiz'
import { saveQuizChannel, saveQuizSettings, setQuizOverride } from './actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Organisation — quiz', robots: { index: false, follow: false } }

type Channel = { id: string; platform: string; name: string; username: string; url: string; is_required: boolean; is_active: boolean; sort_order: number }

export default async function AdminQuizPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  if (!await getRoleAccess(currentEdition.id, ['admin','manager'])) notFound()
  const [state, params] = await Promise.all([getQuizAvailability(), searchParams])
  const db = getQuizDb()
  const [settingsResult, channelsResult, analyticsResult, questionResult] = await Promise.all([
    db.from('quiz_settings').select('require_boss_question,reveal_answers_after_close').eq('id', true).maybeSingle(),
    db.from('social_channels').select('id,platform,name,username,url,is_required,is_active,sort_order').order('sort_order'),
    db.rpc('get_quiz_daily_analytics', { p_quiz_date: state.localDate }),
    db.from('quiz_questions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])
  const channels = (channelsResult.data ?? []) as Channel[]
  const analytics = analyticsResult.data as unknown as { participants: number; completed: number; averageScore: number; highestScore: number; perfectScores: number; averageSeconds: number; socialGateCompletions: number } | null
  const message = params.error ? 'Enregistrement impossible. Vérifiez les champs puis réessayez.' : params.saved ? 'Modifications enregistrées.' : ''
  return <main id="main-content" className="page-container quiz-admin-page">
    <PageHero eyebrow="ORGANISATION · QUIZ QUOTIDIEN" title="Le quiz." description="Suivez l’activité du quiz quotidien, ajustez son ouverture et gérez les pages sociales et le questionnaire." />
    <AdminNav />
    {message && <p className={params.error ? 'quiz-error' : 'form-feedback success'} role={params.error ? 'alert' : 'status'}>{message}</p>}
    <section className="quiz-admin-state">
      <div><span className="eyebrow">ÉTAT DU {state.localDate}</span><h2 className={state.status === 'open' ? 'is-open' : ''}>{state.status === 'open' ? 'OUVERT' : 'VERROUILLÉ'}</h2><p>{state.status === 'open' ? 'Fermeture à minuit, heure de Douala.' : 'Prochaine ouverture : ' + new Intl.DateTimeFormat('fr-CM',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Douala'}).format(new Date(state.nextOpenAt))}</p><small>Contrôle horaire automatique · {state.override === 'auto' ? 'mode automatique' : `override : ${state.override}`}</small></div>
      <div className="quiz-admin-metrics"><div><strong>{analytics?.participants ?? 0}</strong><span>PARTIES LANCÉES</span></div><div><strong>{analytics?.completed ?? 0}</strong><span>TERMINÉES</span></div><div><strong>{analytics?.averageScore ?? 0}</strong><span>SCORE MOYEN</span></div><div><strong>{analytics?.highestScore ?? 0}</strong><span>MEILLEUR SCORE</span></div><div><strong>{analytics?.perfectScores ?? 0}</strong><span>SANS-FAUTE</span></div><div><strong>{analytics?.averageSeconds ?? 0}s</strong><span>TEMPS MOYEN</span></div><div><strong>{analytics?.socialGateCompletions ?? 0}</strong><span>GATE SOCIAL VALIDÉ</span></div><div><strong>{questionResult.count ?? 0}</strong><span>QUESTIONS ACTIVES</span></div></div>
    </section>
    <section className="quiz-admin-section"><div className="quiz-admin-section-heading"><div><span className="eyebrow">GESTION DES QUESTIONS</span><h2>Banque de questions</h2></div><Link className="button button-outline" href="/admin/quiz/questions">Gérer les questions <span aria-hidden="true">→</span></Link></div><p>Les questions utilisées sont conservées dans l’historique des tentatives. Les réponses correctes restent privées côté serveur.</p></section>
    <section className="quiz-admin-section"><div className="quiz-admin-section-heading"><div><span className="eyebrow">RÉCOMPENSES</span><h2>Top 2 et remise des cadeaux</h2></div><Link className="button button-outline" href="/admin/quiz/winners">Gérer les gagnants <span aria-hidden="true">→</span></Link></div><p>Consultez les deux premiers des classements finalisés et notez les cadeaux remis.</p></section>
    <section className="quiz-admin-section"><div className="quiz-admin-section-heading"><div><span className="eyebrow">OUVERTURE ET SÉCURITÉ</span><h2>Réglages du quiz</h2></div></div>
      <form className="quiz-admin-form" action={setQuizOverride}><label>Ouverture du jour<select name="override" defaultValue={state.override}><option value="auto">Automatique · 20H00 à minuit</option><option value="paused">Mettre en pause</option><option value="disabled">Désactiver aujourd’hui</option><option value="reopen">Réouvrir aujourd’hui</option></select></label><button className="button button-primary">Appliquer</button></form>
      <form className="quiz-admin-form quiz-admin-settings" action={saveQuizSettings}><label><input type="checkbox" name="requireBoss" defaultChecked={settingsResult.data?.require_boss_question ?? true} /> Inclure une question Boss parmi les cinq</label><label><input type="checkbox" name="revealAnswers" defaultChecked={settingsResult.data?.reveal_answers_after_close ?? false} /> Révéler les réponses après la fermeture</label><button className="button button-outline">Enregistrer les réglages</button></form>
    </section>
    <section className="quiz-admin-section"><div className="quiz-admin-section-heading"><div><span className="eyebrow">GATE SOCIAL</span><h2>Pages à suivre</h2></div></div><p>Les pages requises sont confirmées par le participant. Le site ne vérifie pas les abonnements auprès des plateformes.</p>
      {channels.map((channel) => <form className="quiz-admin-channel" action={saveQuizChannel} key={channel.id}>
        <input type="hidden" name="channelId" value={channel.id} />
        <label>Plateforme<select name="platform" defaultValue={channel.platform}>{[['instagram','Instagram'],['tiktok','TikTok'],['facebook','Facebook'],['whatsapp','WhatsApp']].map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Nom<input name="name" required defaultValue={channel.name} /></label><label>Compte / description<input name="username" defaultValue={channel.username} /></label>
        <label>URL officielle<input name="url" type="url" required defaultValue={channel.url} /></label><label>Ordre<input name="sortOrder" type="number" min="0" max="10000" defaultValue={channel.sort_order} /></label>
        <label className="quiz-check-label"><input type="checkbox" name="isRequired" defaultChecked={channel.is_required} /> Obligatoire</label><label className="quiz-check-label"><input type="checkbox" name="isActive" defaultChecked={channel.is_active} /> Active</label><button className="button button-outline">Enregistrer</button>
      </form>)}
      <details className="quiz-admin-add"><summary>Ajouter une page</summary><form className="quiz-admin-channel" action={saveQuizChannel}>
        <label>Plateforme<select name="platform" defaultValue="instagram">{[['instagram','Instagram'],['tiktok','TikTok'],['facebook','Facebook'],['whatsapp','WhatsApp']].map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Nom<input name="name" required /></label><label>Compte / description<input name="username" /></label><label>URL officielle<input name="url" type="url" required placeholder="https://…" /></label><label>Ordre<input name="sortOrder" type="number" min="0" defaultValue="50" /></label><label className="quiz-check-label"><input type="checkbox" name="isRequired" /> Obligatoire</label><label className="quiz-check-label"><input type="checkbox" name="isActive" defaultChecked /> Active</label><button className="button button-primary">Ajouter</button>
      </form></details>
    </section>
  </main>
}
