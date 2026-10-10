'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getRoleAccess } from '../../../lib/auth'
import { currentEdition } from '../../../data/current-edition'
import { getQuizAvailability, getQuizDb } from '../../../lib/quiz'

const roles = ['admin', 'manager']
const platformSchema = z.enum(['instagram','tiktok','facebook','whatsapp'])

export async function saveQuizQuestion(form: FormData) {
  const identity = await getRoleAccess(currentEdition.id, roles)
  if (!identity) redirect('/admin')
  const id = String(form.get('questionId') ?? '').trim()
  const correct = Number(form.get('correctOption'))
  const options = [0, 1, 2, 3].map((index) => ({ label: String(form.get(`option${index}`) ?? '').trim(), isCorrect: index === correct }))
  const parsed = z.object({
    question: z.string().trim().min(8).max(600), category: z.string().trim().min(2).max(80),
    difficulty: z.enum(['easy','medium','hard','boss']), explanation: z.string().trim().max(1200), status: z.enum(['draft','active','archived']),
  }).safeParse({
    question: form.get('question'), category: form.get('category'), difficulty: form.get('difficulty'),
    explanation: form.get('explanation') ?? '', status: form.get('status'),
  })
  if (!parsed.success || options.some(({ label }) => label.length < 1 || label.length > 400) || !Number.isInteger(correct) || correct < 0 || correct > 3) {
    redirect('/admin/quiz/questions?error=invalid')
  }
  const { error } = await getQuizDb().rpc('admin_save_quiz_question', {
    p_question_id: id || null,
    p_question: parsed.data.question,
    p_category: parsed.data.category,
    p_difficulty: parsed.data.difficulty,
    p_explanation: parsed.data.explanation || null,
    p_status: parsed.data.status,
    p_options: options,
  })
  if (error) redirect('/admin/quiz/questions?error=save')
  revalidatePath('/admin/quiz')
  revalidatePath('/admin/quiz/questions')
  redirect('/admin/quiz/questions?saved=1')
}

export async function saveQuizChannel(form: FormData) {
  const identity = await getRoleAccess(currentEdition.id, roles)
  if (!identity) redirect('/admin')
  const id = String(form.get('channelId') ?? '').trim()
  const parsed = z.object({
    platform: platformSchema,
    name: z.string().trim().min(2).max(100),
    username: z.string().trim().max(120),
    url: z.string().url().refine((url) => url.startsWith('https://')),
    sortOrder: z.coerce.number().int().min(0).max(10000),
  }).safeParse({
    platform: form.get('platform'), name: form.get('name'), username: form.get('username') ?? '',
    url: form.get('url'), sortOrder: form.get('sortOrder'),
  })
  if (!parsed.success || (id && !z.string().uuid().safeParse(id).success)) redirect('/admin/quiz?error=channel')
  const channel = {
    platform: parsed.data.platform, name: parsed.data.name, username: parsed.data.username,
    url: parsed.data.url, icon: parsed.data.platform,
    is_required: form.get('isRequired') === 'on', is_active: form.get('isActive') === 'on', sort_order: parsed.data.sortOrder,
  }
  const db = getQuizDb()
  const result = id ? await db.from('social_channels').update(channel).eq('id', id) : await db.from('social_channels').insert(channel)
  if (result.error) redirect('/admin/quiz?error=channel')
  revalidatePath('/admin/quiz')
  revalidatePath('/quiz')
  redirect('/admin/quiz?saved=channel')
}

export async function saveQuizSettings(form: FormData) {
  const identity = await getRoleAccess(currentEdition.id, roles)
  if (!identity) redirect('/admin')
  const { error } = await getQuizDb().from('quiz_settings').update({
    require_boss_question: form.get('requireBoss') === 'on',
    reveal_answers_after_close: form.get('revealAnswers') === 'on',
  }).eq('id', true)
  if (error) redirect('/admin/quiz?error=settings')
  revalidatePath('/admin/quiz')
  redirect('/admin/quiz?saved=settings')
}

export async function setQuizOverride(form: FormData) {
  const identity = await getRoleAccess(currentEdition.id, roles)
  if (!identity) redirect('/admin')
  const override = z.enum(['auto','disabled','paused','reopen']).safeParse(form.get('override'))
  if (!override.success) redirect('/admin/quiz?error=override')
  const state = await getQuizAvailability()
  const db = getQuizDb()
  const automaticOpen = Date.parse(state.serverNow) >= Date.parse(state.opensAt) && Date.parse(state.serverNow) < Date.parse(state.closesAt)
  const { error } = await db.from('quiz_daily_sessions').update({
    override_status: override.data,
    status: override.data === 'reopen' || (override.data === 'auto' && automaticOpen) ? 'open' : override.data === 'auto' && !automaticOpen && Date.parse(state.serverNow) < Date.parse(state.opensAt) ? 'scheduled' : 'closed',
  }).eq('quiz_date', state.localDate)
  if (error) redirect('/admin/quiz?error=override')
  revalidatePath('/admin/quiz')
  revalidatePath('/quiz')
  redirect('/admin/quiz?saved=override')
}
