import { z } from 'zod'
import { consumeQuizRateLimit, getQuizDb, requestBucketHash } from '../../../../lib/quiz'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const schema = z.object({ reference: z.string().regex(/^[a-f0-9]{32}$/), position: z.number().int().min(1).max(5), optionId: z.string().uuid() })

export async function POST(request: Request) {
  try {
    const body = await request.text()
    if (body.length > 2000) return Response.json({ error: 'Demande trop volumineuse.' }, { status: 413 })
    const parsed = schema.safeParse(JSON.parse(body))
    if (!parsed.success) return Response.json({ error: 'Réponse invalide.' }, { status: 400 })
    if (!await consumeQuizRateLimit(request,180)) return Response.json({ error: 'Trop de réponses. Réessayez plus tard.' }, { status: 429 })
    const { data, error } = await getQuizDb().rpc('save_daily_quiz_answer', {
      p_reference: parsed.data.reference, p_position: parsed.data.position, p_option: parsed.data.optionId, p_bucket_hash: requestBucketHash(request),
    })
    if (error) return Response.json({ error: error.message.includes('QUIZ_CLOSED') ? 'Le quiz est fermé. Cette tentative a expiré.' : 'Cette réponse ne peut pas être enregistrée.' }, { status: 409, headers: { 'Cache-Control': 'no-store' } })
    if (!data) return Response.json({ error: 'Le quiz est fermé. Cette tentative a expiré.' }, { status: 409, headers: { 'Cache-Control': 'no-store' } })
    return Response.json({ saved: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'Impossible d’enregistrer votre réponse.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
