import { z } from 'zod'
import { CLASSICO_TEAMS } from '../../../../lib/classico-prediction'
import { consumeQuizRateLimit, getQuizDb, normalizeCameroonPhone } from '../../../../lib/quiz'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const players = CLASSICO_TEAMS.flatMap((team) => team.players)
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(32),
  email: z.string().trim().max(254).optional().default(''),
  confirmedChannelIds: z.array(z.string().uuid()).max(20),
  barcelonaGoals: z.number().int().min(0).max(10),
  realMadridGoals: z.number().int().min(0).max(10),
  scorer: z.enum(players),
  assist: z.enum(players),
})

export async function POST(request: Request) {
  try {
    const body = await request.text()
    if (body.length > 8000) return Response.json({ error: 'Demande trop volumineuse.' }, { status: 413 })
    let payload: unknown
    try {
      payload = JSON.parse(body)
    } catch {
      return Response.json({ error: 'Demande invalide.' }, { status: 400 })
    }
    const parsed = schema.safeParse(payload)
    if (!parsed.success) return Response.json({ error: 'Vérifie tes coordonnées et tes trois pronostics.' }, { status: 400 })
    const phone = normalizeCameroonPhone(parsed.data.phone)
    if (!phone) return Response.json({ error: 'Saisis un numéro camerounais valide, par exemple +237 6XX XXX XXX.' }, { status: 400 })
    const email = parsed.data.email.trim()
    if (email && !z.email().safeParse(email).success) return Response.json({ error: 'Vérifie ton adresse e-mail.' }, { status: 400 })
    if (!await consumeQuizRateLimit(request, 20)) {
      return Response.json({ error: 'Trop de tentatives. Réessaie un peu plus tard.' }, { status: 429 })
    }

    const { data, error } = await getQuizDb().rpc('submit_classico_prediction', {
      p_name: parsed.data.name,
      p_phone: phone,
      p_email: email || null,
      p_confirmed_channel_ids: parsed.data.confirmedChannelIds,
      p_barcelona_goals: parsed.data.barcelonaGoals,
      p_real_madrid_goals: parsed.data.realMadridGoals,
      p_scorer: parsed.data.scorer,
      p_assist: parsed.data.assist,
    })
    if (error) {
      const message = error.message
      const closed = message.includes('PREDICTION_CLOSED')
      const alreadySubmitted = message.includes('PREDICTION_ALREADY_SUBMITTED')
      const socialGateIncomplete = message.includes('SOCIAL_GATE_INCOMPLETE')
      const unavailableGate = message.includes('SOCIAL_GATE_UNAVAILABLE')
      const status = closed || alreadySubmitted ? 409 : socialGateIncomplete || unavailableGate ? 400 : 503
      const errorText = closed ? 'Les pronostics sont fermés depuis le coup d’envoi.'
        : alreadySubmitted ? 'Un pronostic existe déjà pour ce numéro.'
          : socialGateIncomplete ? 'Ouvre et confirme le suivi de chaque page obligatoire.'
            : unavailableGate ? 'Aucune page obligatoire n’est configurée pour le moment.'
              : 'Impossible d’enregistrer ton pronostic pour le moment.'
      return Response.json({ error: errorText }, { status, headers: { 'Cache-Control': 'no-store' } })
    }
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'Le service des pronostics est momentanément indisponible.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
