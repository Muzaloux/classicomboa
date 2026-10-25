'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock3, ShieldCheck } from 'lucide-react'
import { CLASSICO_TEAMS, type ClassicoPredictionAvailability } from '../../lib/classico-prediction'
import type { QuizChannel } from '../../lib/quiz'
import { PlatformLogo, type SocialPlatform } from '../public/social-pages'

type Props = {
  availability: ClassicoPredictionAvailability
  channels: QuizChannel[]
}

type Stage = 'intro' | 'follow' | 'prediction' | 'submitted'

export function ClassicoPredictionClient({ availability, channels }: Props) {
  const [stage, setStage] = useState<Stage>('intro')
  const [openedChannels, setOpenedChannels] = useState<string[]>([])
  const [checkedChannels, setCheckedChannels] = useState<string[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [barcelonaGoals, setBarcelonaGoals] = useState('0')
  const [realMadridGoals, setRealMadridGoals] = useState('0')
  const [scorer, setScorer] = useState('')
  const [assist, setAssist] = useState('')
  const [now, setNow] = useState(Date.parse(availability.serverNow))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const requiredChannels = useMemo(() => channels.filter((channel) => channel.is_required), [channels])
  const allRequiredConfirmed = requiredChannels.length > 0 &&
    requiredChannels.every((channel) => checkedChannels.includes(channel.id))
  const isOpen = availability.isOpen && now < Date.parse(availability.closesAt)
  const secondsLeft = Math.max(0, Math.floor((Date.parse(availability.closesAt) - now) / 1000))
  const countdown = [
    Math.floor(secondsLeft / 3600),
    Math.floor((secondsLeft % 3600) / 60),
    secondsLeft % 60,
  ].map((part) => String(part).padStart(2, '0')).join(' : ')
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isOpen && stage !== 'submitted') {
      setStage('intro')
      setError('')
    }
  }, [isOpen, stage])

  async function submitPrediction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!allRequiredConfirmed || !isOpen) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/quiz/classico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          confirmedChannelIds: checkedChannels,
          barcelonaGoals: Number(barcelonaGoals),
          realMadridGoals: Number(realMadridGoals),
          scorer,
          assist,
        }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) {
        setError(data.error ?? 'Impossible d’enregistrer ton pronostic.')
        return
      }
      setStage('submitted')
    } catch {
      setError('Le service est momentanément indisponible. Réessaie avant le coup d’envoi.')
    } finally {
      setLoading(false)
    }
  }

  return <main id="main-content" className="classico-prediction-page">
    <section className="classico-prediction-shell">
      <header className="classico-prediction-hero">
        <Image
          className="classico-prediction-art"
          src="/images/events/classico-poster-2026-10-25.webp"
          alt="Affiche du Clásico entre le FC Barcelona et le Real Madrid"
          fill
          priority
          sizes="(max-width: 800px) 100vw, 1120px"
        />
        <div className="classico-prediction-hero-shade" />
        <div className="classico-prediction-topline"><span>CLASSICO MBOA · ÉVÉNEMENT DU JOUR</span><span><i /> PRONOSTICS</span></div>
        <div className="classico-prediction-match">
          <div className="classico-prediction-team">
            <Image src={CLASSICO_TEAMS[0].logo} alt="" width={68} height={68} />
            <strong>BARÇA</strong>
          </div>
          <span className="classico-prediction-vs">VS</span>
          <div className="classico-prediction-team">
            <Image src={CLASSICO_TEAMS[1].logo} alt="" width={68} height={68} />
            <strong>REAL MADRID</strong>
          </div>
        </div>
        <div className="classico-prediction-headline">
          <span className="classico-prediction-kicker">DIMANCHE 25 OCTOBRE · COUP D’ENVOI 20H30</span>
          <h1>LE GRAND<br /><em>CLÁSICO.</em></h1>
          <p>Le match se joue sur le terrain. À toi de lire le jeu.</p>
        </div>
      </header>

      {stage === 'intro' && isOpen && <section className="classico-prediction-content">
        <div className="classico-prediction-open"><span><i /> PRONOSTICS OUVERTS</span><span><Clock3 size={15} /> CLÔTURE DANS {countdown}</span></div>
        <h2>Trois pronostics.<br /><em>Un Clásico à écrire.</em></h2>
        <div className="classico-prediction-cards">
          <article><b>01</b><strong>Score exact</strong><span>Le résultat final des deux équipes.</span></article>
          <article><b>02</b><strong>Buteur</strong><span>Choisis ton buteur à tout moment.</span></article>
          <article><b>03</b><strong>Passeur décisif</strong><span>Qui délivrera une passe décisive ?</span></article>
        </div>
        <div className="classico-prediction-roster-note"><ShieldCheck size={17} /> Choix de joueurs basés sur les compositions et absences partagées.</div>
        <button className="classico-prediction-button" onClick={() => setStage('follow')}>FAIRE MON PRONOSTIC <ArrowRight size={18} /></button>
        <p className="classico-prediction-footnote">Les prédictions sont définitives après validation et doivent être envoyées avant le coup d’envoi.</p>
      </section>}

      {stage === 'follow' && isOpen && <section className="classico-prediction-content">
        <button className="classico-prediction-back" onClick={() => setStage('intro')}><ArrowLeft size={16} /> Retour</button>
        <span className="classico-prediction-step">ÉTAPE 1 SUR 2</span>
        <h2>Avant de jouer,<br /><em>suis nos pages.</em></h2>
        <p className="classico-prediction-copy">Ouvre chaque lien, suis ou rejoins la page, puis confirme pour accéder au formulaire du match.</p>
        <div className="classico-prediction-channels">{channels.map((channel) => <article key={channel.id}>
          <span className={`quiz-platform quiz-platform-${channel.icon}`}><PlatformLogo platform={channel.icon as SocialPlatform} /></span>
          <div><strong>{channel.name}</strong><small>{channel.username || channel.platform} · {channel.is_required ? 'REQUIS' : 'RECOMMANDÉ'}</small></div>
          <a href={channel.url} target="_blank" rel="noreferrer" onClick={() => setOpenedChannels((current) => current.includes(channel.id) ? current : [...current, channel.id])}>
            {channel.platform === 'whatsapp' ? 'REJOINDRE' : 'SUIVRE'} <ArrowRight size={14} />
          </a>
          {openedChannels.includes(channel.id) ? <label className="classico-prediction-check">
            <input type="checkbox" checked={checkedChannels.includes(channel.id)} onChange={(event) => setCheckedChannels((current) => event.target.checked ? [...current, channel.id] : current.filter((id) => id !== channel.id))} />
            <span><Check size={13} /></span><span className="sr-only">J’ai suivi {channel.name}</span>
          </label> : <small className="classico-prediction-open-link">OUVRE LE LIEN</small>}
        </article>)}</div>
        <p className="classico-prediction-disclaimer">Confirme après avoir suivi ou rejoint les pages. Les réseaux ne permettent pas de vérifier automatiquement les abonnements.</p>
        {error && <p className="quiz-error" role="alert">{error}</p>}
        <button className="classico-prediction-button" disabled={!allRequiredConfirmed} onClick={() => { setError(''); setStage('prediction') }}>J’AI TOUT SUIVI — CONTINUER <ArrowRight size={18} /></button>
      </section>}

      {stage === 'prediction' && isOpen && <section className="classico-prediction-content">
        <button className="classico-prediction-back" onClick={() => setStage('follow')}><ArrowLeft size={16} /> Retour</button>
        <span className="classico-prediction-step">ÉTAPE 2 SUR 2</span>
        <h2>À toi de jouer,<br /><em>pronostique.</em></h2>
        <form className="classico-prediction-form" onSubmit={(event) => void submitPrediction(event)}>
          <fieldset className="classico-prediction-score">
            <legend>01 · SCORE EXACT</legend>
            <label><Image src={CLASSICO_TEAMS[0].logo} alt="" width={40} height={40} /><strong>BARÇA</strong>
              <select required value={barcelonaGoals} onChange={(event) => setBarcelonaGoals(event.target.value)} aria-label="Buts du FC Barcelona">{Array.from({ length: 11 }, (_, score) => <option key={score} value={score}>{score}</option>)}</select>
            </label>
            <span className="classico-prediction-score-dash">:</span>
            <label><Image src={CLASSICO_TEAMS[1].logo} alt="" width={40} height={40} /><strong>REAL MADRID</strong>
              <select required value={realMadridGoals} onChange={(event) => setRealMadridGoals(event.target.value)} aria-label="Buts du Real Madrid">{Array.from({ length: 11 }, (_, score) => <option key={score} value={score}>{score}</option>)}</select>
            </label>
          </fieldset>
          <label className="classico-prediction-field"><span>02 · BUTEUR À TOUT MOMENT</span><select required value={scorer} onChange={(event) => setScorer(event.target.value)}><option value="" disabled>Choisis un joueur</option>{CLASSICO_TEAMS.map((team) => <optgroup key={team.id} label={team.name}>{team.players.map((player) => <option key={player} value={player}>{player}</option>)}</optgroup>)}</select></label>
          <label className="classico-prediction-field"><span>03 · PASSEUR DÉCISIF</span><select required value={assist} onChange={(event) => setAssist(event.target.value)}><option value="" disabled>Choisis un joueur</option>{CLASSICO_TEAMS.map((team) => <optgroup key={team.id} label={team.name}>{team.players.map((player) => <option key={player} value={player}>{player}</option>)}</optgroup>)}</select></label>
          <div className="classico-prediction-identity">
            <label>Nom complet<input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ton nom" /></label>
            <label>Numéro WhatsApp / téléphone<input required inputMode="tel" autoComplete="tel" maxLength={32} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+237 6XX XXX XXX" /></label>
            <label>E-mail <span>(facultatif)</span><input type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="toi@exemple.com" /></label>
          </div>
          {error && <p className="quiz-error" role="alert">{error}</p>}
          <button className="classico-prediction-button" disabled={loading || !allRequiredConfirmed}>{loading ? 'ENREGISTREMENT…' : <>VALIDER MON PRONOSTIC <Check size={18} /></>}</button>
        </form>
        <p className="classico-prediction-footnote">Un pronostic par numéro. Clôture au coup d’envoi à 20h30.</p>
      </section>}

      {(!isOpen || stage === 'submitted') && <section className="classico-prediction-content classico-prediction-closed">
        <span className="classico-prediction-step">{stage === 'submitted' ? 'PRONOSTIC ENREGISTRÉ' : 'ÉVÉNEMENT DU 25 OCTOBRE'}</span>
        <h2>{stage === 'submitted' ? <>C’est dans la<br /><em>boîte !</em></> : <>Les pronostics<br /><em>sont fermés.</em></>}</h2>
        <p>{stage === 'submitted' ? 'Ton pronostic est enregistré. Merci d’avoir joué avec Classico Mboa !' : 'La fenêtre de pronostics est ouverte jusqu’au coup d’envoi de 20h30, heure du Cameroun.'}</p>
        <div className="classico-prediction-final-clock"><Clock3 size={17} /> COUP D’ENVOI · 20H30 · AFRICA/DOUALA</div>
      </section>}
    </section>
  </main>
}
