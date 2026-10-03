import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { currentEdition } from '../../data/current-edition'
import { formatEventDate } from '../../lib/formatting'

export const runtime = 'nodejs'
export const dynamic = 'force-static'

export async function GET() {
  const [photo, logo] = await Promise.all([
    readFile(join(process.cwd(), 'public/images/social/team-6687.jpg')),
    readFile(join(process.cwd(), 'public/classico-mboa-logo-transparent.png')),
  ])
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#131313', color: '#f6f3ec', position: 'relative', fontFamily: 'sans-serif' }}>
      <img src={`data:image/jpeg;base64,${photo.toString('base64')}`} width={1200} height={802} style={{ position: 'absolute', top: -70, left: 0 }} alt="" />
      <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(19,19,19,0) 42%, rgba(19,19,19,.88) 72%, #131313 100%)' }} />
      <div style={{ display: 'flex', position: 'absolute', top: 28, left: 32, padding: 12, borderRadius: 28, background: 'rgba(19,19,19,.72)', border: '2px solid rgba(200,238,106,.7)' }}>
        <img src={`data:image/png;base64,${logo.toString('base64')}`} width={118} height={118} alt="" />
      </div>
      <div style={{ display: 'flex', position: 'absolute', top: 40, right: 32, padding: '12px 22px', borderRadius: 999, background: '#c8ee6a', color: '#131313', fontSize: 24, fontWeight: 700 }}>{currentEdition.editionNumber}E ÉDITION</div>
      <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', left: 48, bottom: 36, right: 48 }}>
        <div style={{ display: 'flex', fontSize: 78, fontWeight: 800, lineHeight: 1, letterSpacing: -1 }}>
          <span>LE CLASSICO</span><span style={{ color: '#c8ee6a', marginLeft: 20 }}>VERSION MBOA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 16, borderTop: '3px solid #c8ee6a' }}>
          <span style={{ display: 'flex', fontSize: 28, fontWeight: 700 }}>{formatEventDate(currentEdition.eventDate).toUpperCase()} · {currentEdition.venue.toUpperCase()}, {currentEdition.city.toUpperCase()}</span>
          <span style={{ display: 'flex', fontSize: 26, color: '#c8ee6a', fontWeight: 700 }}>classicomboa.com</span>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  )
}
