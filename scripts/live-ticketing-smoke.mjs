import nextEnv from '@next/env'
import { createClient } from '@supabase/supabase-js'
import { randomBytes, randomUUID, createHash, createHmac } from 'node:crypto'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
nextEnv.loadEnvConfig(process.cwd(), true)
const expected = 'omzfphciqhiqavpsxlxg'
if (process.argv[3] !== expected || process.env.NEXT_PUBLIC_SUPABASE_URL !== `https://${expected}.supabase.co`) throw new Error('Explicit correct project reference required')
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const path = 'artifacts/live-ticketing-fixture.json'
const mode = process.argv[2]
const unwrap = result => { if (result.error) throw result.error; return result.data }
if (mode === 'setup') {
  try { await fs.access(path); throw new Error('Existing fixture must be cleaned first') } catch (e) { if (e.code !== 'ENOENT') throw e }
  const run = randomUUID(), email = `ticket-smoke-${run}@example.com`, password = randomBytes(24).toString('base64url') + '!A1'
  const user = unwrap(await db.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { ticketing_verification: run } })).user
  const fixture = { project: expected, run, email, password, userId: user.id, typeId: randomUUID() }
  await fs.mkdir('artifacts', { recursive: true }); await fs.writeFile(path, JSON.stringify(fixture))
  unwrap(await db.from('edition_staff').insert({ user_id: user.id, edition_id: 'edition-8', role: 'admin' }))
  console.log('Tagged temporary organizer created. No email sent.')
} else {
  const f = JSON.parse(await fs.readFile(path, 'utf8'))
  assert.equal(f.project, expected)
  const user = unwrap(await db.auth.admin.getUserById(f.userId)).user
  assert.equal(user.app_metadata.ticketing_verification, f.run)
  if (mode === 'capture') {
    const orders = unwrap(await db.from('ticket_orders').select('id,reference,is_test').eq('customer_email', f.email).neq('ticket_type_id', f.typeId))
    assert.equal(orders.length, 1); assert.equal(orders[0].is_test, true)
    f.order = orders[0]
    f.tickets = unwrap(await db.from('tickets').select('ticket_code,qr_token,status').eq('order_id', f.order.id).order('unit_number'))
    await fs.writeFile(path, JSON.stringify(f))
    console.log('Fixture order captured: ' + f.order.reference + ', tickets: ' + f.tickets.length)
  } else if (mode === 'verify') {
    const order = unwrap(await db.from('ticket_orders').select('status,quantity,total_xaf').eq('id', f.order.id).single())
    assert.equal(order.status, 'paid'); assert.equal(order.quantity, 2); assert.equal(order.total_xaf, 2000)
    const tickets = unwrap(await db.from('tickets').select('status').eq('order_id', f.order.id))
    assert.deepEqual(tickets.map(t => t.status).sort(), ['used', 'void'])
    const checkins = unwrap(await db.from('ticket_checkins').select('result').eq('scanned_by', f.userId))
    for (const result of ['accepted', 'already_used', 'wrong_mode']) assert.ok(checkins.some(c => c.result === result), result)
    console.log('PASS: browser checkout, paid order, single-use check-in, test-mode rejection and voiding persisted.')
  } else if (mode === 'webhooks') {
    unwrap(await db.from('ticket_types').insert({ id: f.typeId, edition_id: 'edition-8', name: 'Isolated smoke test', price_xaf: 1234, capacity: 1, is_test: true, status: 'active' }))
    const reserve = () => db.rpc('reserve_ticket_order', { p_type: f.typeId, p_quantity: 1, p_name: 'Isolated test', p_email: f.email, p_phone: '+237699123456', p_request: randomUUID(), p_access_hash: createHash('sha256').update(randomBytes(32)).digest('hex'), p_test: true })
    const attempts = await Promise.all([reserve(), reserve()])
    assert.equal(attempts.filter(a => !a.error).length, 1)
    assert.ok(attempts.some(a => a.error?.message.includes('SOLD_OUT')))
    const reference = attempts.find(a => !a.error).data
    const origin = process.env.VERIFY_ORIGIN || 'http://localhost:3002'
    const secret = process.env.TEST_PAYMENT_WEBHOOK_SECRET
    const post = async (amount, event, signatureOverride) => {
      const body = JSON.stringify({ reference, event, amount, currency: 'XAF', outcome: 'successful' })
      const timestamp = String(Math.floor(Date.now() / 1000))
      const signature = signatureOverride ?? createHmac('sha256', secret).update(timestamp + '.' + body).digest('hex')
      return fetch(origin + '/api/payments/test/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'x-payment-timestamp': timestamp, 'x-payment-signature': signature }, body })
    }
    assert.equal((await post(1234, randomUUID(), '0'.repeat(64))).status, 401)
    assert.equal((await post(1, randomUUID())).status, 409)
    const event = randomUUID()
    assert.equal((await post(1234, event)).status, 200)
    assert.equal((await post(1234, event)).status, 200)
    const order = unwrap(await db.from('ticket_orders').select('id').eq('reference', reference).single())
    assert.equal(unwrap(await db.from('tickets').select('id').eq('order_id', order.id)).length, 1)
    console.log('PASS: hosted concurrent stock requests, webhook signature/amount rejection and retry-safe issuance.')
  } else if (mode === 'cleanup') {
    const orders = unwrap(await db.from('ticket_orders').select('id,is_test').eq('customer_email', f.email))
    assert.ok(orders.every(o => o.is_test))
    const ids = orders.map(o => o.id)
    if (ids.length) {
      const tickets = unwrap(await db.from('tickets').select('id').in('order_id', ids))
      if (tickets.length) unwrap(await db.from('ticket_checkins').delete().in('ticket_id', tickets.map(t => t.id)))
      unwrap(await db.from('ticket_checkins').delete().eq('scanned_by', f.userId))
      const payments = unwrap(await db.from('payment_transactions').select('id').in('order_id', ids))
      if (payments.length) unwrap(await db.from('payment_events').delete().in('payment_id', payments.map(p => p.id)))
      unwrap(await db.from('tickets').delete().in('order_id', ids))
      unwrap(await db.from('payment_transactions').delete().in('order_id', ids))
      unwrap(await db.from('ticket_order_items').delete().in('order_id', ids))
      unwrap(await db.from('ticket_orders').delete().in('id', ids))
    }
    unwrap(await db.from('ticket_types').delete().eq('id', f.typeId).eq('is_test', true))
    unwrap(await db.from('audit_events').delete().eq('actor_id', f.userId))
    unwrap(await db.from('submission_limits').delete().in('bucket', ['order:' + createHash('md5').update(f.email).digest('hex'), 'scan:' + f.userId]))
    unwrap(await db.auth.admin.deleteUser(f.userId))
    await fs.unlink(path)
    console.log('Only tagged smoke-test records and temporary credentials removed.')
  } else throw new Error('Unknown mode')
}
