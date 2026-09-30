// Trusted operator only. Creates no password, sends no email, and does not bypass email verification.
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import nextEnv from '@next/env'
import { z } from 'zod'

nextEnv.loadEnvConfig(process.cwd(), true)
const [projectRef, inputEmail] = process.argv.slice(2)
assert.match(projectRef ?? '', /^[a-z]{20}$/, 'Supply the target project reference')
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, `https://${projectRef}.supabase.co`, 'Project mismatch')
const email = z.email().parse(inputEmail?.trim().toLowerCase())
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
function checked(result) { if (result.error) throw new Error(result.error.message); return result.data }
let user
for (let page = 1; ; page++) {
  const data = checked(await client.auth.admin.listUsers({ page, perPage: 100 }))
  user = data.users.find((item) => item.email?.toLowerCase() === email)
  if (user || data.users.length < 100) break
}
if (!user) {
  user = checked(await client.auth.admin.createUser({ email, email_confirm: false })).user
}
const profile = checked(await client.from('user_profiles').select('status').eq('id', user.id).single())
assert.equal(profile.status, 'active', 'Refuse to override an account restriction')
checked(await client.from('edition_staff').upsert({ user_id: user.id, edition_id: 'edition-8', role: 'admin' }, { onConflict: 'user_id,edition_id' }))
const membership = checked(await client.from('edition_staff').select('role,edition_id').eq('user_id', user.id).eq('edition_id', 'edition-8').single())
assert.equal(membership.role, 'admin')
console.log(JSON.stringify({ email, edition: membership.edition_id, role: membership.role, emailVerified: Boolean(user.email_confirmed_at), emailSent: false }))
