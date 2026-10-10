import { z } from 'zod'
import { consumeQuizRateLimit, getQuizDb, requestBucketHash } from '../../../../../lib/quiz'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  if (!z.string().regex(/^[a-f0-9]{32}$/).safeParse(reference).success) return Response.json({ error: 'Résultat introuvable.' }, { status: 404 })
  try {
    if (!await consumeQuizRateLimit(request,60)) return Response.json({ error: 'Trop de tentatives. Réessayez plus tard.' }, { status: 429 })
    const { data, error } = await getQuizDb().rpc('get_public_quiz_attempt', { p_reference: reference, p_bucket_hash: requestBucketHash(request) })
    if (error) return Response.json({ error: error.message.includes('ATTEMPT_NOT_FOUND') ? 'Résultat introuvable.' : 'Impossible de charger cette tentative.' }, { status: error.message.includes('ATTEMPT_NOT_FOUND') ? 404 : 429, headers: { 'Cache-Control': 'no-store' } })
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'Le service du quiz est momentanément indisponible.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
