'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getRoleAccess } from '../../../../lib/auth'
import { currentEdition } from '../../../../data/current-edition'
import { getQuizAvailability, getQuizDb } from '../../../../lib/quiz'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((date) => {
  const parsed = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date
})

export async function savePrizeStatus(form: FormData) {
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  if (!identity) redirect('/admin')

  const date = dateSchema.safeParse(String(form.get('date') ?? ''))
  const reference = z.string().regex(/^[a-f0-9]{32}$/).safeParse(String(form.get('reference') ?? ''))
  const status = z.enum(['pending', 'given']).safeParse(String(form.get('status') ?? ''))
  const note = z.string().trim().max(300).safeParse(String(form.get('note') ?? ''))
  if (!date.success || !reference.success || !status.success || !note.success) redirect('/admin/quiz/winners?error=invalid')

  const state = await getQuizAvailability()
  if (date.data >= state.localDate) redirect(`/admin/quiz/winners?date=${date.data}&error=notfinal`)

  const db = getQuizDb()
  const { data: leaders, error: leadersError } = await db.from('quiz_attempts')
    .select('public_reference')
    .eq('quiz_date', date.data)
    .eq('status', 'completed')
    .order('score', { ascending: false })
    .order('completion_seconds', { ascending: true })
    .order('completed_at', { ascending: true })
    .limit(2)
  if (leadersError || !leaders?.some((leader) => leader.public_reference === reference.data)) {
    redirect(`/admin/quiz/winners?date=${date.data}&error=notwinner`)
  }

  const given = status.data === 'given'
  const { error } = await db.from('quiz_attempts').update({
    prize_awarded_at: given ? new Date().toISOString() : null,
    prize_awarded_by: given ? identity.user.id : null,
    prize_note: note.data || null,
  }).eq('public_reference', reference.data).eq('quiz_date', date.data)
  if (error) redirect(`/admin/quiz/winners?date=${date.data}&error=save`)

  revalidatePath('/admin/quiz/winners')
  redirect(`/admin/quiz/winners?date=${date.data}&saved=1`)
}
