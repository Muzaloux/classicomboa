// Explicitly invoked hosted verification. Creates only a tagged disposable account;
// never sends email. Run cleanup even if a browser assertion fails.
import assert from 'node:assert/strict'
import { randomUUID, randomBytes, createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd(), true)
const [mode, projectRef] = process.argv.slice(2)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
assert.match(projectRef ?? '', /^[a-z]{20}$/, 'Supply the exact target project ref')
assert.equal(url, `https://${projectRef}.supabase.co`, 'Target project must match local configuration')
const settings = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, settings)
const fixturePath = new URL('../artifacts/live-foundation-fixture.json', import.meta.url)
function checked(result) { if (result.error) throw new Error(result.error.message); return result.data }

if (mode === 'setup') {
  await assert.rejects(fs.access(fixturePath), 'Clean up the previous fixture before creating another')
  const run = randomUUID()
  const fixture = { run, projectRef, email: `classico-smoke-${run}@example.com`, password: randomBytes(32).toString('base64url') }
  const { user } = checked(await admin.auth.admin.createUser({ email: fixture.email, password: fixture.password, email_confirm: true, app_metadata: { verification_run: run } }))
  fixture.userId = user.id
  await fs.mkdir(new URL('../artifacts/', import.meta.url), { recursive: true })
  await fs.writeFile(fixturePath, JSON.stringify(fixture), { mode: 0o600 })
  console.log('Created tagged disposable test account. Credentials stored only in ignored artifacts; no email sent.')
} else {
  const fixture = JSON.parse(await fs.readFile(fixturePath, 'utf8'))
  assert.equal(fixture.projectRef, projectRef)
  const { user } = checked(await admin.auth.admin.getUserById(fixture.userId))
  assert.equal(user.app_metadata.verification_run, fixture.run, 'Refuse to operate on an untagged account')
  if (mode === 'issue-code') {
    const result = checked(await admin.auth.admin.generateLink({ type: 'magiclink', email: fixture.email }))
    fixture.otp = result.properties.email_otp
    await fs.writeFile(fixturePath, JSON.stringify(fixture), { mode: 0o600 })
    console.log('Generated one-time verification code without sending email; stored in ignored fixture only.')
  } else if (mode === 'promote') {
    checked(await admin.from('edition_staff').insert({ user_id: user.id, edition_id: 'edition-8', role: 'support' }))
    console.log('Granted disposable account the edition-8 support role for inbox verification.')
  } else if (mode === 'verify') {
    const client = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, settings)
    checked(await client.auth.signInWithPassword({ email: fixture.email, password: fixture.password }))
    const inquiries = checked(await client.from('inquiries').select('id,status,message').eq('email', fixture.email))
    assert.equal(inquiries.length, 1)
    assert.equal(inquiries[0].status, 'closed')
    assert.equal(inquiries[0].message, 'Temporary live verification of the Classico Mboa inquiry flow. This record will be removed.')
    const audits = checked(await client.from('audit_events').select('actor_id,new_status').eq('entity_id', inquiries[0].id).order('created_at'))
    assert.equal(audits.length, 2)
    assert.ok(audits.every((entry) => entry.actor_id === user.id))
    assert.deepEqual(audits.map((entry) => entry.new_status), ['in_review', 'closed'])
    const escalation = await client.from('user_profiles').update({ status: 'disabled' }).eq('id', user.id)
    assert.ok(escalation.error, 'Profile status must not be self-editable')
    checked(await admin.from('user_profiles').update({ status: 'suspended' }).eq('id', user.id))
    assert.equal(checked(await client.rpc('can_manage_inquiries', { target_edition: 'edition-8' })), false)
    assert.equal(checked(await client.from('inquiries').select('id')).length, 0)
    checked(await admin.from('user_profiles').update({ status: 'active' }).eq('id', user.id))
    checked(await client.auth.signOut({ scope: 'local' }))
    console.log('PASS: hosted organizer auth, browser inquiry persistence, audited status change, escalation denial, and immediate suspension enforcement.')
  } else if (mode === 'cleanup') {
    const inquiries = checked(await admin.from('inquiries').select('id').eq('email', fixture.email))
    if (inquiries.length) {
      const ids = inquiries.map(({ id }) => id)
      checked(await admin.from('audit_events').delete().in('entity_id', ids))
      checked(await admin.from('inquiries').delete().eq('email', fixture.email).in('id', ids))
    }
    checked(await admin.from('submission_limits').delete().eq('bucket', createHash('md5').update(fixture.email.toLowerCase()).digest('hex')))
    checked(await admin.auth.admin.deleteUser(user.id))
    await fs.unlink(fixturePath)
    console.log('Removed this run’s test account, profile, staff membership, inquiry, audit event, quota and local credentials.')
  } else throw new Error('Expected setup, issue-code, promote, verify, or cleanup')
}
