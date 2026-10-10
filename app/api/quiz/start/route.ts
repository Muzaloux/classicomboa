import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { consumeQuizRateLimit, getQuizDb, normalizeCameroonPhone, requestBucketHash } from '../../../../lib/quiz'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(32),
  email: z.string().trim().max(254).optional().default(''),
  confirmedChannelIds: z.array(z.string().uuid()).max(20),
})

export async function POST(request: Request) {
  try {
    const body = await request.text()
    if (body.length > 8000) return Response.json({ error: 'Demande trop volumineuse.' }, { status: 413 })
    const parsed = schema.safeParse(JSON.parse(body))
    if (!parsed.success) return Response.json({ error: 'Vérifiez votre nom et votre numéro WhatsApp.' }, { status: 400 })
    const phone = normalizeCameroonPhone(parsed.data.phone)
    if (!phone) return Response.json({ error: 'Saisissez un numéro camerounais valide, par exemple +237 6XX XXX XXX.' }, { status: 400 })
    const email = parsed.data.email.trim()
    if (email && !z.email().safeParse(email).success) return Response.json({ error: 'Vérifiez votre adresse e-mail.' }, { status: 400 })
    const bucketHash = requestBucketHash(request)
    if (!await consumeQuizRateLimit(request,20)) return Response.json({ error: 'Trop de tentatives. Réessayez un peu plus tard.' }, { status: 429 })

    const { data, error } = await getQuizDb().rpc('start_daily_quiz', {
      p_reference: randomBytes(16).toString('hex'),
      p_name: parsed.data.name,
      p_phone: phone,
      p_email: email || null,
      p_confirmed_channels: parsed.data.confirmedChannelIds,
      p_bucket_hash: bucketHash,
    })
    if (error) {
      const message = error.message
      const status = message.includes('QUIZ_CLOSED') ? 409 : message.includes('RATE_LIMITED') ? 429 : 400
      const errorText = message.includes('QUIZ_CLOSED') ? 'Le quiz est fermé pour le moment.'
        : message.includes('SOCIAL_GATE_INCOMPLETE') ? 'Confirmez le suivi de chaque page obligatoire.'
          : message.includes('QUESTION_POOL_INCOMPLETE') || message.includes('QUESTION_OPTIONS_INVALID') ? 'Le quiz se prépare. Réessayez bientôt.'
            : message.includes('ATTEMPT_ALREADY_USED') ? 'Une participation existe déjà pour ce numéro aujourd’hui.'
              : message.includes('RATE_LIMITED') ? 'Trop de tentatives. Réessayez un peu plus tard.'
                : 'Impossible de démarrer le quiz. Vérifiez vos informations.'
      return Response.json({ error: errorText }, { status, headers: { 'Cache-Control': 'no-store' } })
    }
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'Le service du quiz est momentanément indisponible.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
