import Link from 'next/link'
import heroImage from '../public/images/events/hero.webp'
import { EventCountdown } from '../components/shared/event-countdown'
import { currentEdition } from '../data/current-edition'
import { formatEventDate } from '../lib/formatting'
import { CTASection, EmptyState, Section } from '../components/shared/page'
import { EventPhoto } from '../components/shared/event-photo'
import { Reveal } from '../components/shared/reveal'
import { SponsorStrip } from '../components/shared/sponsor-strip'
import { ScrollPanImage } from '../components/shared/scroll-pan-image'
import { getEventPhoto } from '../data/event-photos'
import { getAdditionalEventPhoto } from '../data/additional-event-photos'
import {
  ArrowDown,
  ArrowRight,
  MapPin,
  Music2,
  Play,
  Ticket,
  Trophy,
  Users,
} from 'lucide-react'
import { experienceCards, programmePreview } from '../data/home'

const experienceIcons = {
  football: Trophy,
  culture: Music2,
  community: Users,
  gaming: Play,
  chance: Ticket,
  vote: Users,
  village: MapPin,
  partners: Users,
}

const programmeIcons = {
  football: Trophy,
  culture: Music2,
  community: Users,
}

function App() {
  return (
    <>
<main id="main-content">
        <section className="hero" id="home" aria-labelledby="hero-title">
          <div className="hero-image"><ScrollPanImage src={heroImage} alt="Deux joueurs du Classico Mboa poursuivent le ballon sur le terrain." /><div className="hero-photo-shade" /></div>
          <div className="hero-grain" />
          <div className="hero-content">
            <div className="edition-kicker"><span className="live-dot" /> {currentEdition.city.toUpperCase()} · {formatEventDate(currentEdition.eventDate).toUpperCase()}</div>
            <p className="hero-edition">{currentEdition.editionNumber}E ÉDITION</p>
            <h1 id="hero-title">LE CLASSICO.<br /><span>VERSION MBOA.</span></h1>
            <p className="hero-copy">Real Mboa face à Barça Mboa.<br />Plus qu’un match, un rendez-vous autour du football et de la culture.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/tickets"><Ticket size={17} /> Réserver mon billet</Link>
              <Link className="button button-ghost" href="/classico"><Play size={15} /> Découvrir le Classico</Link>
            </div>
            <div className="hero-matchup" aria-label="Real Mboa contre Barça Mboa">
              <div className="team team-madrid"><span className="team-crest crest-madrid">R<span>M</span></span><span>REAL<br />MBOA</span></div>
              <span className="versus">VS</span>
              <div className="team team-barca"><span className="team-crest crest-barca"><i /><b /></span><span>BARÇA<br />MBOA</span></div>
            </div>
          </div>
          <div className="hero-side-note">FOOTBALL, CULTURE<br />ET BIEN PLUS <span>237</span></div>
          <a className="scroll-cue" href="#edition"><ArrowDown size={15} /> DÉFILER POUR EXPLORER</a>
          <div className="hero-date"><span>{currentEdition.eventDate.slice(8)}</span><i>{new Intl.DateTimeFormat(currentEdition.locale, { month: 'short', timeZone: currentEdition.timezone }).format(new Date(`${currentEdition.eventDate}T12:00:00+01:00`))}<br />{currentEdition.eventDate.slice(0, 4)}</i></div>
        </section>
        <Reveal><section className="event-strip" id="edition">
          <div className="event-strip-title"><span className="eyebrow">UN RENDEZ-VOUS À DOUALA</span><h2>LE CLASSICO<br />APPROCHE.</h2></div>
          <EventCountdown date={currentEdition.eventDate} />
          <div className="event-details">
            <div><MapPin size={16} /><span><b>{currentEdition.venue}</b><small>{currentEdition.city}, {currentEdition.country}</small></span></div>
            <div><Ticket size={16} /><span><b>{currentEdition.editionNumber}e édition · {formatEventDate(currentEdition.eventDate)}</b><small>Classique 1 000 XAF · VIP 2 000 XAF</small></span></div>
            <Link className="text-link" href="/tickets">Réserver mon billet <ArrowRight size={15} /></Link>
          </div>
        </section></Reveal>

        <Reveal><section className="experience section-pad" id="experience">
          <div className="section-heading">
            <div><span className="eyebrow">BIEN PLUS QUE 90 MINUTES</span><h2>TOUT UN<br /><span>RENDEZ-VOUS.</span></h2></div>
            <p>Le Classico Mboa rassemble football, culture, gaming et communauté à Douala. Les activités et informations officielles seront publiées au fur et à mesure.</p>
          </div>
          <p className="photo-archive-note">Images des archives Classico Mboa. Les activités de la prochaine édition restent à confirmer.</p><div className="experience-grid">
            {experienceCards.map((card, index) => {
              const Icon = experienceIcons[card.icon]
              return (
                <article className={`experience-card ${card.className}`} key={card.id}>
                  {card.photo ? <EventPhoto photo={card.photo} sizes="(max-width: 720px) 100vw, (max-width: 1000px) 50vw, 25vw" /> : <div className="experience-graphic" aria-hidden="true"><Icon size={100} strokeWidth={1} /><span>CLASSICO MBOA</span></div>}
                  <div className="card-shade" />
                  <div className="card-label"><Icon size={16} /> {card.category}</div>
                  <div className="experience-card-copy"><span>{card.eyebrow}</span><h3>{card.title.split('\n').map((line) => <span key={line}>{line}<br /></span>)}</h3><a href={card.href}>{card.action} <ArrowRight size={15} /></a></div>
                  <span className="card-index">{String(index + 1).padStart(2, '0')} / {String(experienceCards.length).padStart(2, '0')}</span>
                </article>
              )
            })}
          </div>
        </section></Reveal>

        <Reveal><section className="rivalry section-pad" id="vote">
          <div className="rivalry-image"><EventPhoto photo={getEventPhoto("white-action")} sizes="(max-width: 720px) 100vw, 50vw" /></div>
          <div className="rivalry-content">
            <span className="eyebrow">LE DUEL, VERSION MBOA</span>
            <h2>REAL MBOA<br />OU BARÇA MBOA&nbsp;?</h2>
            <p>Deux équipes, une rivalité et toute une communauté. Les informations sur les votes et les distinctions seront annoncées ici.</p>
            <div className="poll">
              <div className="poll-head"><span>VOTES & DISTINCTIONS</span><span>À VENIR</span></div>
              <div className="poll-options">
                <div className="poll-option"><span className="poll-crest crest-madrid">R<span>M</span></span><span className="poll-team-name">Real Mboa</span></div>
                <div className="poll-option"><span className="poll-crest crest-barca"><i /><b /></span><span className="poll-team-name">Barça Mboa</span></div>
              </div>
              <small>Les campagnes officielles seront annoncées ici.</small>
            </div>
          </div>
          <div className="rivalry-stamp">MBOA<br /><b>237</b></div>
        </section></Reveal>

        <Reveal><section className="lineup section-pad" id="lineup">
          <div className="lineup-heading"><div><span className="eyebrow">LE 12 DÉCEMBRE À DOUALA</span><h2>UN PROGRAMME<br />À DÉCOUVRIR.</h2></div><a className="text-link" href="/programme">Tout le programme <ArrowRight size={15} /></a></div>
          <div className="schedule-list">
            {programmePreview.map((item) => {
              const Icon = programmeIcons[item.icon]
              return <div className="schedule-row" key={item.id}><span className="schedule-icon"><Icon size={18} /></span><div><strong>{item.title}</strong><small>{item.description}</small></div></div>
            })}
          </div>
          <p className="schedule-note">Le programme détaillé et les horaires seront publiés dès confirmation par l’organisation.</p>
        </section></Reveal>

        <Reveal><section className="legacy" id="legacy">
          <div className="legacy-image"><EventPhoto photo={getEventPhoto("teams-together")} sizes="100vw" /><div className="legacy-photo-shade" /></div>
          <div className="legacy-copy"><span className="eyebrow">L’HISTOIRE CLASSICO MBOA</span><h2>{currentEdition.editionNumber}E ÉDITION.<br /><span>UN MBOA.</span></h2><p>Né autour du football, Classico Mboa rassemble le public autour d’une rivalité réinventée et d’une expérience ancrée au Cameroun.</p><a className="button button-ghost" href="/classico">Découvrir Classico Mboa <ArrowRight size={15} /></a></div>
          <div className="legacy-number">{String(currentEdition.editionNumber).padStart(2, '0')}</div>
          <span className="legacy-caption">ARCHIVES CLASSICO MBOA</span>
        </section></Reveal>

        <Reveal><section className="ticket-cta" id="tickets">
          <span className="eyebrow">DOUALA, LE RENDEZ-VOUS APPROCHE</span><h2>VIVEZ LE<br /><span>CLASSICO.</span></h2>
          <div className="ticket-cta-bottom"><p>{formatEventDate(currentEdition.eventDate)} · {currentEdition.venue}, {currentEdition.city}</p><Link className="button button-primary" href="/tickets"><Ticket size={17} /> Réserver mon billet <ArrowRight size={15} /></Link></div>
          <div className="cta-lines" aria-hidden="true" />
        </section></Reveal>
        <SponsorStrip />
        <Reveal><section className="section-pad gallery-preview" aria-labelledby="gallery-preview-title">
          <div className="section-heading"><div><span className="eyebrow">LES ARCHIVES EN IMAGES</span><h2 id="gallery-preview-title">LE MBOA<br /><span>SE VIT ENSEMBLE.</span></h2></div><p>Sur le terrain, dans les tribunes et autour du trophée : découvrez d’autres moments du Classico.</p></div>
          <div className="event-gallery">{['archive-6672', 'archive-6681', 'archive-6683'].map((id) => { const photo = getAdditionalEventPhoto(id); return <figure key={id}><Link href="/gallery" className="gallery-photo" aria-label={`Découvrir la galerie : ${photo.caption}`}><EventPhoto photo={photo} sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" /><span className="gallery-expand" aria-hidden="true">↗</span></Link><figcaption><span className="eyebrow">{photo.category}</span><h3>{photo.caption}</h3></figcaption></figure> })}</div>
          <Link className="button button-primary" href="/gallery">Explorer toute la galerie <ArrowRight size={16} /></Link>
        </section></Reveal>
        <div className="page-container home-updates">
          <Section title="Les nouvelles du Classico"><EmptyState title="Les annonces officielles arrivent" description="Suivez les prochaines publications sur les équipes, le programme et les expériences." /><Link className="text-link" href="/news">Toutes les actualités →</Link></Section>
          <CTASection title="Ensemble, faisons vivre le Mboa." description="Entreprises, créateurs et partenaires : participez à l’aventure Classico Mboa." href="/partner" label="Devenir partenaire" />
          <CTASection title="Rejoindre la communauté" description="Le lien officiel de la communauté WhatsApp sera publié après confirmation." href="/contact" label="Rester en contact" />
        </div>
      </main>

    </>
  )
}

export default App

