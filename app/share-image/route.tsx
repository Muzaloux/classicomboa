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
      <div style={{ display: 'flex', flexDirection: 'column', width: 400, padding: '36px 32px' }}>
        <img src={`data:image/png;base64,${logo.toString('base64')}`} width={104} height={104} alt="" />
        <div style={{ display: 'flex', color: '#c8ee6a', fontSize: 19, letterSpacing: 3, marginTop: 24 }}>{currentEdition.editionNumber}E ÉDITION · DOUALA</div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 58, fontWeight: 700, lineHeight: 1.04, marginTop: 22 }}>
          <span>LE CLASSICO.</span><span style={{ color: '#c8ee6a' }}>VERSION</span><span style={{ color: '#c8ee6a' }}>MBOA.</span>
        </div>
        <div style={{ display: 'flex', fontSize: 20, color: '#c6c6c6', marginTop: 24 }}>Football. Culture. Ensemble.</div>
      </div>
      <img src={`data:image/jpeg;base64,${photo.toString('base64')}`} width={800} height={534} style={{ position: 'absolute', top: 0, right: 0, objectFit: 'cover' }} alt="" />
      <div style={{ display: 'flex', position: 'absolute', bottom: 0, left: 0, width: '100%', height: 96, alignItems: 'center', justifyContent: 'space-between', padding: '0 36px', borderTop: '3px solid #c8ee6a', background: '#131313' }}>
        <span style={{ fontSize: 25, fontWeight: 700 }}>{formatEventDate(currentEdition.eventDate).toUpperCase()} · DOUALA</span>
        <span style={{ fontSize: 24, color: '#c8ee6a' }}>classicomboa.com</span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  )
}
