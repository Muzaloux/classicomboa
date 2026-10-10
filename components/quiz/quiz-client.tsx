'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Banknote, Check, Clock3, Copy, Crown, LockKeyhole, Sparkles, Trophy } from 'lucide-react'
import { PlatformLogo, type SocialPlatform } from '../public/social-pages'
import type { QuizAvailability, QuizChannel } from '../../lib/quiz'

type Option = { id: string; label: string }
type Question = { id: string; position: number; question: string; category: string; difficulty: string; selectedOptionId: string | null; options: Option[] }
type Props = { initialAvailability: QuizAvailability; initialChannels: QuizChannel[] }
type Stage = 'restoring' | 'locked' | 'intro' | 'follow' | 'details' | 'quiz' | 'confirm' | 'expired'
const attemptStorageKey = 'classico-quiz-attempt'
const positionStorageKey = 'classico-quiz-position'

function readSavedAttempt() {
  const reference = window.localStorage.getItem(attemptStorageKey) ?? window.sessionStorage.getItem(attemptStorageKey)
  if (reference) window.localStorage.setItem(attemptStorageKey, reference)
  window.sessionStorage.removeItem(attemptStorageKey)
  return reference
}

function clearSavedAttempt() {
  window.localStorage.removeItem(attemptStorageKey)
  window.localStorage.removeItem(positionStorageKey)
  window.sessionStorage.removeItem(attemptStorageKey)
  window.sessionStorage.removeItem(positionStorageKey)
}

export function QuizClient({ initialAvailability, initialChannels }: Props) {
  const [availability, setAvailability] = useState(initialAvailability)
  const [channels, setChannels] = useState(initialChannels)
  const [stage, setStage] = useState<Stage>(initialAvailability.status === 'open' ? 'restoring' : 'locked')
  const [checkedChannels, setCheckedChannels] = useState<string[]>([])
  const [openedChannels, setOpenedChannels] = useState<string[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [reference, setReference] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [position, setPosition] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.parse(initialAvailability.serverNow))
  const [copied, setCopied] = useState(false)
  const expiryHandled = useRef(false)

  const requiredChannels = useMemo(() => channels.filter((channel) => channel.is_required), [channels])
  const allRequiredConfirmed = requiredChannels.every((channel) => checkedChannels.includes(channel.id))
  const currentQuestion = questions[position - 1]
  const answeredCount = questions.filter((question) => question.selectedOptionId).length
  const timeTarget = Date.parse(availability.status === 'open' ? availability.closesAt : availability.nextOpenAt)
  const remaining = Math.max(0, Math.floor((timeTarget - now) / 1000))
  const timeParts = [Math.floor(remaining / 3600), Math.floor((remaining % 3600) / 60), remaining % 60]
  const clockLabel = timeParts.map((value) => String(value).padStart(2, '0')).join(' : ')
  const attemptSeconds = expiresAt ? Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 1000)) : 7 * 60
  const attemptClock = `${String(Math.floor(attemptSeconds / 60)).padStart(2, '0')}:${String(attemptSeconds % 60).padStart(2, '0')}`

  const expireAttempt = useCallback(() => {
    if (expiryHandled.current || !reference) return
    expiryHandled.current = true
    clearSavedAttempt()
    setStage('expired')
    window.location.assign(`/quiz/result/${reference}`)
  }, [reference])

  const refreshState = useCallback(async () => {
    try {
      const response = await fetch('/api/quiz/state', { cache: 'no-store' })
      if (!response.ok) return
      const data = await response.json() as { availability: QuizAvailability; channels: QuizChannel[] }
      setAvailability(data.availability)
      setChannels(data.channels)
      setNow(Date.parse(data.availability.serverNow))
      if (data.availability.status === 'locked') {
        setStage('locked')
        setReference('')
        clearSavedAttempt()
      } else {
        setStage((current) => current === 'locked' ? 'intro' : current)
      }
    } catch { /* Access remains server-controlled if a refresh request fails. */ }
  }, [])

  useEffect(() => {
    const poll = window.setInterval(() => { void refreshState() }, 30_000)
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    const onVisibilityChange = () => setNow(Date.now())
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(poll)
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [refreshState])

  useEffect(() => {
    if ((stage === 'quiz' || stage === 'confirm') && expiresAt && attemptSeconds === 0) expireAttempt()
  }, [attemptSeconds, stage, expiresAt, expireAttempt])

  useEffect(() => {
    if (reference && (stage === 'quiz' || stage === 'confirm')) {
      window.localStorage.setItem(positionStorageKey, String(position))
    }
  }, [position, reference, stage])

  useEffect(() => {
    if (remaining === 0) void refreshState()
  }, [remaining, refreshState])

  useEffect(() => {
    const savedReference = readSavedAttempt()
    if (!savedReference) {
      setStage(initialAvailability.status === 'open' ? 'intro' : 'locked')
      return
    }
    setStage('restoring')
    let active = true
    void fetch(`/api/quiz/attempt/${savedReference}`, { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) {
        if (response.status === 404) {
          clearSavedAttempt()
          if (active) setStage(initialAvailability.status === 'open' ? 'intro' : 'locked')
          return
        }
        throw new Error('Impossible de retrouver ta partie pour le moment.')
      }
      const data = await response.json() as { status?: string; name?: string; questions?: Question[]; expiresAt?: string }
      if (!active) return
      if (data.status === 'completed' || data.status === 'expired') {
        clearSavedAttempt()
        window.location.assign(`/quiz/result/${savedReference}`)
        return
      }
      if ((data.status !== 'started' && data.status !== 'resumed') || !data.questions?.length) {
        clearSavedAttempt()
        setStage(initialAvailability.status === 'open' ? 'intro' : 'locked')
        return
      }
      setReference(savedReference)
      setExpiresAt(data.expiresAt ?? null)
      setName(data.name ?? '')
      setQuestions(data.questions)
      const savedPosition = Number.parseInt(window.localStorage.getItem(positionStorageKey) ?? '1', 10)
      setPosition(Number.isInteger(savedPosition) ? Math.min(5, Math.max(1, savedPosition)) : 1)
      setStage('quiz')
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Impossible de retrouver ta partie pour le moment.')
    })
    return () => { active = false }
  }, [])

  async function beginAttempt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!allRequiredConfirmed) return
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/quiz/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, confirmedChannelIds: checkedChannels }),
      })
      const data = await response.json() as { error?: string; status?: string; reference?: string; participantName?: string; questions?: Question[]; expiresAt?: string }
      if (!response.ok) { setError(data.error ?? 'Impossible de démarrer le quiz.'); await refreshState(); return }
      if (data.status === 'completed' && data.reference) {
        clearSavedAttempt()
        window.location.assign(`/quiz/result/${data.reference}`)
        return
      }
      if (!data.reference || !data.questions?.length) throw new Error('Questionnaire indisponible.')
      setReference(data.reference)
      setExpiresAt(data.expiresAt ?? null)
      expiryHandled.current = false
      window.localStorage.setItem(attemptStorageKey, data.reference)
      setName(data.participantName ?? name)
      setQuestions(data.questions)
      setPosition(1)
      window.localStorage.setItem(positionStorageKey, '1')
      setStage('quiz')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Le service du quiz est momentanément indisponible.')
    } finally { setLoading(false) }
  }

  async function selectOption(optionId: string) {
    if (!currentQuestion || saving) return
    setError(''); setSaving(true)
    setQuestions((current) => current.map((question) => question.position === position ? { ...question, selectedOptionId: optionId } : question))
    try {
      const response = await fetch('/api/quiz/answer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, position, optionId }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) { setError(data.error ?? 'Réponse non enregistrée.'); await refreshState() }
    } catch { setError('Vérifiez votre connexion avant de continuer.') }
    finally { setSaving(false) }
  }

  async function submitAttempt() {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, answers: questions.map((question) => ({ position: question.position, optionId: question.selectedOptionId })) }),
      })
      const data = await response.json() as { error?: string; status?: string; reference?: string }
      if (data.status === 'expired') { expireAttempt(); return }
      if (!response.ok) { setError(data.error ?? 'Impossible d’envoyer tes réponses.'); return }
      clearSavedAttempt()
      window.location.assign(`/quiz/result/${data.reference ?? reference}`)
    } catch { setError('Envoi impossible. Vérifiez votre connexion puis réessayez.') }
    finally { setLoading(false) }
  }

  async function copyQuizLink() {
    try { await navigator.clipboard.writeText('https://classicomboa.com/quiz'); setCopied(true); window.setTimeout(() => setCopied(false), 2200) }
    catch { setError('La copie du lien n’est pas disponible sur cet appareil.') }
  }

  if (stage === 'restoring') return <main id="main-content" className="quiz-page"><section className="quiz-form-shell"><span className="quiz-kicker">QUIZ CLASSICO MBOA</span><h1>Reprise<br /><em>de ta partie.</em></h1><p className="quiz-lead">Tes réponses sont sauvegardées. On recharge tes questions…</p>{error && <p className="quiz-error" role="alert">{error}</p>}<button className="quiz-button" onClick={() => window.location.reload()}>RÉESSAYER <ArrowRight size={17} /></button></section></main>

  if (stage === 'locked') return <main id="main-content" className="quiz-page">
    <section className="quiz-shell quiz-locked">
      <div className="quiz-brandline"><span className="quiz-mark">CM</span><span>CLASSICO MBOA <b>QUIZ</b></span></div>
      <div className="quiz-locked-content"><span className="quiz-kicker"><LockKeyhole size={16} /> RENDEZ-VOUS CE SOIR</span><h1>Le quiz est<br /><em>verrouillé.</em></h1><p>Testez vos connaissances sur le plus grand duel du football. Cinq questions. Cent points. Un nouveau défi chaque soir.</p>
        <div className="quiz-countdown"><span>PROCHAIN QUIZ DANS</span><strong>{clockLabel}</strong><small>Ouverture à 20H00 · Heure de Douala</small></div>
        <button className="quiz-button" disabled><LockKeyhole size={17} /> QUIZ VERROUILLÉ</button>
      </div>
      <div className="quiz-locked-footer"><span>5 QUESTIONS</span><i /><span>100 POINTS</span><i /><span>TOUS LES SOIRS</span></div>
      <div className="quiz-community"><div><strong>Restez dans le match.</strong><span>Rejoignez notre communauté et retrouvez nos pages officielles.</span></div><div className="quiz-community-links">{channels.map((channel) => <a key={channel.id} href={channel.url} target="_blank" rel="noreferrer"><span className={`quiz-platform quiz-platform-${channel.icon}`}><PlatformLogo platform={channel.icon as SocialPlatform} /></span>{channel.name}<ArrowRight size={14} /></a>)}</div></div>
      <button className="quiz-copy-link" onClick={() => void copyQuizLink()}><Copy size={15} /> {copied ? 'Lien copié' : 'Copier le lien du quiz'}</button>
      <a className="quiz-leaderboard-link" href="/quiz/classement">Voir le classement du jour <ArrowRight size={14} /></a>
    </section>
  </main>

  if (stage === 'intro') return <main id="main-content" className="quiz-page"><section className="quiz-shell quiz-open">
    <div className="quiz-brandline"><span className="quiz-mark">CM</span><span>CLASSICO MBOA <b>QUIZ</b></span><span className="quiz-live"><i /> OUVERT</span></div>
    <div className="quiz-open-content"><span className="quiz-kicker"><Trophy size={16} /> LE DÉFI DU SOIR</span><h1>Le quiz est<br /><em>ouvert.</em></h1><p>Le coup d’envoi est donné. Prouve que tu connais le Clásico sur le bout des doigts.</p>
      <div className="quiz-stats"><div><strong>05</strong><span>QUESTIONS</span></div><div><strong>20</strong><span>PTS / QUESTION</span></div><div><strong>100</strong><span>POINTS MAX.</span></div></div>
      <button className="quiz-button" onClick={() => setStage('follow')}>COMMENCER LE QUIZ <ArrowRight size={18} /></button>
      <div className="quiz-closes"><Clock3 size={15} /> Fermeture dans {clockLabel}</div>
      <a className="quiz-leaderboard-link" href="/quiz/classement">Voir le classement du jour <ArrowRight size={14} /></a>
    </div>
  </section></main>

  if (stage === 'follow') return <main id="main-content" className="quiz-page"><section className="quiz-form-shell">
    <button className="quiz-back" onClick={() => setStage('intro')}><ArrowLeft size={16} /> Retour</button>
    <span className="quiz-kicker">ÉTAPE 1 SUR 2</span><h1>Avant de jouer,<br /><em>suis nos pages.</em></h1>
    <section className="quiz-prize-poster" aria-labelledby="quiz-prize-title">
      <span className="quiz-prize-kicker"><Sparkles size={14} /> LES RÉCOMPENSES DU QUIZ</span>
      <span className="quiz-prize-top"><Trophy size={15} /> TOP 2</span>
      <h2 id="quiz-prize-title">À GAGNER <em>CE SOIR</em></h2>
      <p>Les deux meilleurs scores repartent avec des récompenses.</p>
      <div className="quiz-prize-items">
        <div><span className="quiz-prize-icon quiz-prize-cash"><Banknote size={22} /></span><strong>Prix en cash</strong><small>Pour les meilleurs scores</small></div>
        <div><span className="quiz-prize-icon quiz-prize-premium"><Crown size={22} /></span><strong>Comptes premium</strong><small>Réseaux sociaux & streaming</small></div>
      </div>
      <div className="quiz-prize-footer"><span>5 QUESTIONS</span><i /><span>100 POINTS</span><i /><span>CHAQUE SOIR</span></div>
    </section>
    <p className="quiz-lead">Ouvre chaque lien, suis ou rejoins la page, puis confirme pour continuer.</p>
    <div className="quiz-channel-list">{channels.map((channel) => <article className="quiz-channel" key={channel.id}>
      <span className={`quiz-platform quiz-platform-${channel.icon}`}><PlatformLogo platform={channel.icon as SocialPlatform} /></span>
      <div className="quiz-channel-copy"><strong>{channel.name}</strong><span>{channel.username || channel.platform}{channel.is_required ? <small>REQUIS</small> : <small>RECOMMANDÉ</small>}</span></div>
      <a className={`quiz-follow-link quiz-follow-${channel.icon}`} href={channel.url} target="_blank" rel="noreferrer" onClick={() => setOpenedChannels((current) => current.includes(channel.id) ? current : [...current, channel.id])}>{channel.platform === 'whatsapp' ? 'Joindre' : 'Suivre'} <ArrowRight size={15} /></a>
      {openedChannels.includes(channel.id) ? <label className="quiz-confirm"><input type="checkbox" checked={checkedChannels.includes(channel.id)} onChange={(event) => setCheckedChannels((current) => event.target.checked ? [...current, channel.id] : current.filter((id) => id !== channel.id))} /><span><Check size={14} /></span><span className="sr-only">J’ai suivi {channel.name}</span></label> : <span className="quiz-confirm-prompt">Ouvre le lien</span>}
    </article>)}</div>
    <p className="quiz-honesty">Après avoir suivi ou rejoint la page, coche la case. Les plateformes ne nous permettent pas de vérifier les abonnements.</p>
    {error && <p className="quiz-error" role="alert">{error}</p>}
    <button className="quiz-button" disabled={!allRequiredConfirmed} onClick={() => { setError(''); setStage('details') }}>J’AI TOUT SUIVI — CONTINUER <ArrowRight size={18} /></button>
  </section></main>

  if (stage === 'details') return <main id="main-content" className="quiz-page"><section className="quiz-form-shell quiz-details-shell">
    <button className="quiz-back" onClick={() => setStage('follow')}><ArrowLeft size={16} /> Retour</button>
    <span className="quiz-kicker">ÉTAPE 2 SUR 2</span><h1>À toi de<br /><em>jouer.</em></h1><p className="quiz-lead">Renseigne tes coordonnées pour lancer ta partie. Une participation par numéro et par jour.</p>
    <form className="quiz-details-form" onSubmit={(event) => void beginAttempt(event)}>
      <label>Nom complet<input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ton nom" /></label>
      <label>Numéro WhatsApp / téléphone<input required inputMode="tel" autoComplete="tel" maxLength={32} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+237 6XX XXX XXX" /><small>Numéro camerounais · indicatif +237</small></label>
      <label>E-mail <span>(facultatif)</span><input type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="toi@exemple.com" /></label>
      {error && <p className="quiz-error" role="alert">{error}</p>}
      <button className="quiz-button" disabled={!allRequiredConfirmed || loading}>{loading ? 'PRÉPARATION…' : <>LANCER MA PARTIE <ArrowRight size={18} /></>}</button>
    </form>
  </section></main>

  if ((stage === 'quiz' || stage === 'confirm') && currentQuestion) return <main id="main-content" className="quiz-page"><section className="quiz-play-shell">
    <div className="quiz-brandline"><span className="quiz-mark">CM</span><span>CLASSICO MBOA <b>QUIZ</b></span><span className="quiz-live"><i /> EN COURS</span></div>
    <div className="quiz-progress-head"><span>QUESTION {position} <i>/ 5</i></span><span>{answeredCount} RÉPONSES</span><span className={`quiz-attempt-timer${attemptSeconds <= 60 ? ' is-urgent' : ''}`} aria-label={`${Math.floor(attemptSeconds / 60)} minutes ${attemptSeconds % 60} secondes restantes`}><Clock3 size={14} /> {attemptClock}</span></div>
    <div className="quiz-progress-track" role="progressbar" aria-label="Progression du quiz" aria-valuenow={position} aria-valuemin={1} aria-valuemax={5}><span style={{ width: `${position * 20}%` }} /></div>
    <div className="quiz-question-label">{currentQuestion.difficulty === 'boss' ? '★ QUESTION BOSS' : currentQuestion.category.toUpperCase()}</div>
    <h1 className="quiz-question-title">{currentQuestion.question}</h1>
    <div className="quiz-answer-list">{currentQuestion.options.map((option, index) => <button key={option.id} className={`quiz-answer${currentQuestion.selectedOptionId === option.id ? ' is-selected' : ''}`} aria-pressed={currentQuestion.selectedOptionId === option.id} disabled={saving || loading} onClick={() => void selectOption(option.id)}><span>{String.fromCharCode(65 + index)}</span><strong>{option.label}</strong><i>{currentQuestion.selectedOptionId === option.id && <Check size={17} />}</i></button>)}</div>
    <div className="quiz-play-controls"><button className="quiz-secondary" disabled={position === 1 || saving} onClick={() => setPosition((value) => Math.max(1, value - 1))}><ArrowLeft size={16} /> PRÉCÉDENT</button>{position < 5 ? <button className="quiz-button quiz-next" disabled={saving} onClick={() => setPosition((value) => Math.min(5, value + 1))}>SUIVANT <ArrowRight size={17} /></button> : <button className="quiz-button quiz-next" disabled={saving || answeredCount !== 5} onClick={() => { setError(''); setStage('confirm') }}>TERMINER LE QUIZ <Check size={17} /></button>}</div>
    <p className="quiz-no-reveal">Chaque bonne réponse vaut 20 points. Le résultat se révèle après l’envoi.</p>
    {(error || saving) && <p className={error ? 'quiz-error' : 'quiz-saving'} role={error ? 'alert' : 'status'}>{error || 'Réponse enregistrée…'}</p>}
  </section>{stage === 'confirm' && <div className="quiz-confirm-backdrop"><section className="quiz-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="quiz-confirm-title"><span className="quiz-kicker">DERNIÈRE ÉTAPE</span><h2 id="quiz-confirm-title">Envoyer tes réponses ?</h2><p>Elles ne pourront plus être modifiées une fois le quiz terminé.</p>{error && <p className="quiz-error" role="alert">{error}</p>}<div><button className="quiz-secondary" disabled={loading} onClick={() => setStage('quiz')}>CONTINUER</button><button className="quiz-button" disabled={loading} onClick={() => void submitAttempt()}>{loading ? 'ENVOI…' : 'ENVOYER MES RÉPONSES'}</button></div></section></div>}</main>

  return <main id="main-content" className="quiz-page"><section className="quiz-form-shell"><span className="quiz-kicker">QUIZ CLASSICO MBOA</span><h1>{stage === 'expired' ? <>Temps<br /><em>écoulé.</em></> : <>Partie<br /><em>terminée.</em></>}</h1><p>{stage === 'expired' ? 'Les sept minutes sont écoulées. Cette partie est terminée.' : 'Ton résultat est prêt.'}</p><a className="quiz-button" href={`/quiz/result/${reference}`}>VOIR MON RÉSULTAT <ArrowRight size={17} /></a></section></main>
}
