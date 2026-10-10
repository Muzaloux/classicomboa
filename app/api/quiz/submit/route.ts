import { z } from 'zod'
import { consumeQuizRateLimit, getQuizDb, requestBucketHash } from '../../../../lib/quiz'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const schema = z.object({
  reference: z.string().regex(/^[a-f0-9]{32}$/),
  answers: z.array(z.object({ position: z.number().int().min(1).max(5), optionId: z.string().uuid() })).length(5),
})

export async function POST(request: Request) {
  try {
    const body = await request.text()
    if (body.length > 4000) return Response.json({ error: 'Demande trop volumineuse.' }, { status: 413 })
    const parsed = schema.safeParse(JSON.parse(body))
    if (!parsed.success || new Set(parsed.data?.answers.map((answer) => answer.position)).size !== 5) {
      return Response.json({ error: 'Répondez aux cinq questions avant de terminer.' }, { status: 400 })
    }
    if (!await consumeQuizRateLimit(request,30)) return Response.json({ error: 'Trop de tentatives. Réessayez plus tard.' }, { status: 429 })
    const { data, error } = await getQuizDb().rpc('submit_daily_quiz', {
      p_reference: parsed.data.reference,
      p_answers: parsed.data.answers,
      p_bucket_hash: requestBucketHash(request),
    })
    if (error) {
      const closed = error.message.includes('QUIZ_CLOSED')
      const limited = error.message.includes('RATE_LIMITED')
      return Response.json({ error: closed ? 'Le quiz est fermé. Cette tentative a expiré.' : limited ? 'Trop de tentatives. Réessayez plus tard.' : 'Impossible de valider ces réponses.' }, { status: closed ? 409 : limited ? 429 : 400, headers: { 'Cache-Control': 'no-store' } })
    }
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'Le service du quiz est momentanément indisponible.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
