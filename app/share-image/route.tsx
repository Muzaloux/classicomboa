import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { currentEdition } from '../../data/current-edition'
import { formatEventDate } from '../../lib/formatting'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const pages: Record<string, { title: string; subtitle: string; photo: string }> = {
  home: { title: 'LE CLASSICO', subtitle: 'Football, culture et communauté.', photo: 'images/social/team-6687.jpg' },
  classico: { title: 'PLUS QU’UN MATCH.', subtitle: 'Le Classico, version Mboa.', photo: 'images/social/team-6687.jpg' },
  edition: { title: 'LE RENDEZ-VOUS DE DOUALA.', subtitle: 'La 8e édition approche.', photo: 'images/branding/og/hero.jpg' },
  teams: { title: 'REAL MBOA FACE À BARÇA MBOA.', subtitle: 'Deux équipes. Une rivalité. Une seule passion.', photo: 'images/branding/og/match-action.jpg' },
  players: { title: 'LES VISAGES DU CLASSICO.', subtitle: 'Découvrez les joueurs de l’édition.', photo: 'images/social/team-6687.jpg' },
  programme: { title: 'LE PROGRAMME.', subtitle: 'Une journée de football et de culture à Douala.', photo: 'images/branding/og/match-action.jpg' },
  tickets: { title: 'VOTRE PLACE AU CLASSICO.', subtitle: 'Préparez votre venue à Omnisports Bépanda.', photo: 'images/branding/og/crowd.jpg' },
  vote: { title: 'LA PAROLE AU PUBLIC.', subtitle: 'Votes, distinctions et résultats.', photo: 'images/branding/og/supporters.jpg' },
  'vote-results': { title: 'LES RÉSULTATS.', subtitle: 'Les choix de la communauté Classico Mboa.', photo: 'images/branding/og/supporters.jpg' },
  tombola: { title: 'LA TOMBOLA CLASSICO MBOA.', subtitle: 'Participez et suivez les résultats du tirage.', photo: 'images/branding/og/crowd.jpg' },
  sponsors: { title: 'ILS FONT PARTIE DE L’AVENTURE.', subtitle: 'Découvrez les partenaires du Classico.', photo: 'images/branding/og/stands.jpg' },
  partner: { title: 'DEVENEZ PARTENAIRE.', subtitle: 'Associez votre marque à un rendez-vous populaire.', photo: 'images/branding/og/stands.jpg' },
  stands: { title: 'VOS STANDS AU CLASSICO.', subtitle: 'Présentez votre activité au public de l’événement.', photo: 'images/branding/og/stands.jpg' },
  news: { title: 'LES NOUVELLES DU CLASSICO.', subtitle: 'Annonces et contenus officiels.', photo: 'images/social/team-6687.jpg' },
  gallery: { title: 'EN IMAGES ET EN VIDÉOS.', subtitle: 'Revivez l’ambiance du Classico Mboa.', photo: 'images/branding/og/crowd.jpg' },
  'nos-pages': { title: 'SUIVEZ NOS PAGES.', subtitle: 'Rejoignez la communauté et nos partenaires en ligne.', photo: 'images/branding/og/supporters.jpg' },
  contact: { title: 'RESTONS EN CONTACT.', subtitle: 'Écrivez à l’organisation du Classico Mboa.', photo: 'images/branding/og/crowd.jpg' },
  legal: { title: 'INFORMATIONS LÉGALES.', subtitle: 'Les informations officielles du Classico Mboa.', photo: 'images/branding/og/hero.jpg' },
  privacy: { title: 'VOTRE VIE PRIVÉE.', subtitle: 'Les informations de confidentialité du site.', photo: 'images/branding/og/hero.jpg' },
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const key = url.searchParams.get('page') || 'home'
  const page = pages[key] || pages.home
  const [photo, logo] = await Promise.all([
    readFile(join(process.cwd(), 'public', ...page.photo.split('/'))),
    readFile(join(process.cwd(), 'public/images/branding/classico-mboa-share-logo.jpeg')),
  ])
  const eventLine = `${formatEventDate(currentEdition.eventDate).toUpperCase()}  ·  ${currentEdition.venue.toUpperCase()}  ·  ${currentEdition.city.toUpperCase()}`

  const image = new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#071126', color: '#f6f3ec', fontFamily: 'Arial, sans-serif' }}>
      <img src={`data:image/jpeg;base64,${photo.toString('base64')}`} width={1200} height={630} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5,12,28,0.68)' }} />
      <div style={{ display: 'flex', position: 'absolute', top: 105, left: 48, width: 324, height: 405, overflow: 'hidden', borderRadius: 22, border: '4px solid rgba(200,238,106,.8)', background: '#0a1530' }}>
        <img src={`data:image/jpeg;base64,${logo.toString('base64')}`} width={324} height={405} alt="Classico Mboa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', left: 420, top: 86, right: 54, bottom: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#c8ee6a', fontSize: 19, fontWeight: 700, letterSpacing: 4 }}>
          <span>CLASSICO MBOA</span><span style={{ width: 46, height: 2, background: '#c8ee6a' }} /><span style={{ color: '#f6f3ec', letterSpacing: 2 }}>DOUALA · CAMEROUN</span>
        </div>
        <div style={{ display: 'flex', marginTop: 52, color: '#c8ee6a', fontSize: 21, fontWeight: 700, letterSpacing: 3 }}>8E ÉDITION · 19 DÉCEMBRE 2026</div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 700, marginTop: 18, color: '#fff', fontSize: 56, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1.5 }}>{page.title}</div>
        <div style={{ display: 'flex', maxWidth: 660, marginTop: 18, color: 'rgba(246,243,236,.86)', fontSize: 25, lineHeight: 1.3 }}>{page.subtitle}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginTop: 'auto', paddingTop: 19, borderTop: '2px solid rgba(200,238,106,.9)' }}>
          <span style={{ display: 'flex', color: '#f6f3ec', fontSize: 17, fontWeight: 700, letterSpacing: 1 }}>{eventLine}</span>
          <span style={{ display: 'flex', flexShrink: 0, color: '#c8ee6a', fontSize: 18, fontWeight: 700 }}>CLASSICOMBOA.COM</span>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  )
  const jpeg = await sharp(Buffer.from(await image.arrayBuffer()))
    .jpeg({ quality: 84, mozjpeg: true, progressive: true })
    .toBuffer()

  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400',
    },
  })
}
