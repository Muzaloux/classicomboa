import 'server-only'
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminSupabase, inquiriesConfigured } from './supabase/admin'

export type QuizAvailability = {
  status: 'locked' | 'open'
  localDate: string
  opensAt: string
  closesAt: string
  nextOpenAt: string
  serverNow: string
  override: 'auto' | 'disabled' | 'paused' | 'reopen'
}

export type QuizChannel = {
  id: string
  platform: 'instagram' | 'tiktok' | 'facebook' | 'whatsapp'
  name: string
  username: string
  url: string
  icon: 'instagram' | 'tiktok' | 'facebook' | 'whatsapp'
  is_required: boolean
  is_active: boolean
  sort_order: number
}

const fallbackChannels: QuizChannel[] = [
  { id: '00000000-0000-4000-8000-000000000101', platform: 'instagram', name: 'Instagram officiel', username: '@el_classico237', url: 'https://www.instagram.com/el_classico237?utm_source=qr&stkn=Ynk1cG9mazl5azUx', icon: 'instagram', is_required: true, is_active: true, sort_order: 10 },
  { id: '00000000-0000-4000-8000-000000000102', platform: 'tiktok', name: 'TikTok officiel', username: 'Classico Mboa', url: 'https://vm.tiktok.com/ZSqJo89mk/', icon: 'tiktok', is_required: true, is_active: true, sort_order: 20 },
  { id: '00000000-0000-4000-8000-000000000103', platform: 'whatsapp', name: 'Groupe WhatsApp officiel', username: 'Communauté Classico Mboa', url: 'https://chat.whatsapp.com/DDxxaFkKmHQESyVQW96W9i', icon: 'whatsapp', is_required: true, is_active: true, sort_order: 30 },
  { id: '00000000-0000-4000-8000-000000000104', platform: 'tiktok', name: 'Sponsor officiel · Pris-K Events Grill', username: '@priskeventsgrill20', url: 'https://www.tiktok.com/@priskeventsgrill20?_r=1&_t=ZS-9AJFCQ0sjaP', icon: 'tiktok', is_required: true, is_active: true, sort_order: 40 },
]

export function getQuizDb() {
  return createAdminSupabase() as unknown as SupabaseClient
}

function cameroonDateParts(now: Date) {
  const values = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Douala', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now)
  const part = (type: string) => values.find((value) => value.type === type)?.value ?? '00'
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    hour: Number(part('hour')),
    minute: Number(part('minute')),
    second: Number(part('second')),
  }
}

function addLocalDay(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10)
}

export async function getQuizAvailability(now = new Date()): Promise<QuizAvailability> {
  const { date, hour } = cameroonDateParts(now)
  const opensAt = new Date(`${date}T20:00:00+01:00`)
  const closesAt = new Date(`${addLocalDay(date)}T00:00:00+01:00`)
  const automaticOpen = hour >= 20
  let override: QuizAvailability['override'] = 'auto'

  if (inquiriesConfigured()) {
    const db = getQuizDb()
    await db.from('quiz_daily_sessions').upsert({
      quiz_date: date,
      opens_at: opensAt.toISOString(),
      closes_at: closesAt.toISOString(),
      status: automaticOpen ? 'open' : 'scheduled',
    }, { onConflict: 'quiz_date', ignoreDuplicates: true })
    const { data } = await db.from('quiz_daily_sessions').select('override_status').eq('quiz_date', date).maybeSingle()
    if (data?.override_status) override = data.override_status as QuizAvailability['override']
    const status = override === 'reopen' || (override === 'auto' && automaticOpen) ? 'open' : override === 'auto' && !automaticOpen ? 'scheduled' : 'closed'
    await db.from('quiz_daily_sessions').update({ status }).eq('quiz_date', date)
  }

  const status = override === 'reopen' || (override === 'auto' && automaticOpen) ? 'open' : 'locked'
  const nextOpen = status === 'open' || (hour < 20 && override === 'auto')
    ? opensAt
    : new Date(`${addLocalDay(date)}T20:00:00+01:00`)
  return {
    status,
    localDate: date,
    opensAt: opensAt.toISOString(),
    closesAt: closesAt.toISOString(),
    nextOpenAt: nextOpen.toISOString(),
    serverNow: now.toISOString(),
    override,
  }
}

export async function getQuizChannels() {
  if (!inquiriesConfigured()) return fallbackChannels
  const { data, error } = await getQuizDb().from('social_channels')
    .select('id,platform,name,username,url,icon,is_required,is_active,sort_order')
    .eq('is_active', true).order('sort_order')
  return error || !data ? fallbackChannels : data as QuizChannel[]
}

export function requestBucketHash(request: Request) {
  const forwarded = request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  const ip = forwarded.split(',')[0]?.trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') ?? ''
  return createHash('sha256').update(`${ip}:${userAgent}`).digest('hex')
}

export async function consumeQuizRateLimit(request: Request, limit: number) {
  const { data, error } = await getQuizDb().rpc('consume_quiz_rate_limit', {
    p_bucket_hash: requestBucketHash(request), p_limit: limit,
  })
  return !error && data === true
}

export function normalizeCameroonPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (/^6\d{8}$/.test(digits)) return `+237${digits}`
  if (/^2376\d{8}$/.test(digits)) return `+${digits}`
  if (/^002376\d{8}$/.test(digits)) return `+${digits.slice(2)}`
  if (/^\+2376\d{8}$/.test(value.trim())) return value.trim()
  return null
}
