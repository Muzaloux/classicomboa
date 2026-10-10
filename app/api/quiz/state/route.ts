import { getQuizAvailability, getQuizChannels } from '../../../../lib/quiz'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const [availability, channels] = await Promise.all([getQuizAvailability(), getQuizChannels()])
    return Response.json({ availability, channels }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'Le quiz est momentanément indisponible.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
