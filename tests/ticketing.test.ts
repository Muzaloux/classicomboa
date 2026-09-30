import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite()
const type = '10000000-0000-4000-8000-000000000001'
const admin = randomUUID(), checker = randomUUID(), outsider = randomUUID()
const hash = 'a'.repeat(64)
before(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;`)
  const dir = new URL('../supabase/migrations/', import.meta.url)
  for (const file of (await readdir(dir)).filter(f => f.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, dir), 'utf8'))
  await db.query('insert into auth.users values ($1),($2),($3)', [admin, checker, outsider])
  await db.query("insert into edition_staff(user_id,edition_id,role) values($1,'edition-8','admin'),($2,'edition-8','checkin')", [admin, checker])
})
after(() => db.close())
async function asUser<T>(id: string, fn: () => Promise<T>) {
  await db.exec('set role authenticated')
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id])
  try { return await fn() } finally { await db.exec('reset role') }
}
async function reserve(qty = 1, request = randomUUID(), access = hash) {
  const result = await db.query<{ reference: string }>("select reserve_ticket_order($1,$2,'Ticket Tester',$3,'+237699123456',$4,$5,true) reference", [type, qty, request + '@example.com', request, access])
  return { reference: result.rows[0].reference, request }
}
async function settle(reference: string, amount: number, event = randomUUID(), outcome = 'successful') {
  return (await db.query<{ status: string }>("select settle_test_payment($1,$2,$3,'XAF',$4) status", [reference, event, amount, outcome])).rows[0].status
}
test('reservation uses authoritative prices and retries reuse one order', async () => {
  const order = await reserve(2)
  assert.equal((await reserve(2, order.request)).reference, order.reference)
  await assert.rejects(reserve(3, order.request), /REQUEST_CONFLICT/)
  await assert.rejects(reserve(2, order.request, 'b'.repeat(64)), /REQUEST_CONFLICT/)
  const rows = await db.query<{ total_xaf: number }>('select total_xaf from ticket_orders where reference=$1', [order.reference])
  assert.equal(rows.rows[0].total_xaf, 2000)
  await assert.rejects(settle(order.reference, 1), /AMOUNT_MISMATCH/)
  const event = randomUUID()
  assert.equal(await settle(order.reference, 2000, event), 'paid')
  assert.equal(await settle(order.reference, 2000, event), 'paid')
  assert.equal(await settle(order.reference, 2000), 'paid')
  const tickets = await db.query('select id from tickets where order_id=(select id from ticket_orders where reference=$1)', [order.reference])
  assert.equal(tickets.rows.length, 2)
  await assert.rejects(settle(order.reference, 2000, event, 'failed'), /EVENT_CONFLICT/)
})
test('expired reservations release stock and cannot issue tickets', async () => {
  const order = await reserve()
  await db.query("update ticket_orders set expires_at=now()-interval '1 minute' where reference=$1", [order.reference])
  assert.equal(await settle(order.reference, 1000), 'expired')
  assert.equal(await settle(order.reference, 1000), 'expired')
  const tickets = await db.query('select id from tickets where order_id=(select id from ticket_orders where reference=$1)', [order.reference])
  assert.equal(tickets.rows.length, 0)
})
test('capacity cannot be oversold or reduced below paid and reserved tickets', async () => {
  const count = await db.query<{ total: number }>("select sum(quantity)::integer total from ticket_orders where status in ('pending','paid')")
  await db.query('update ticket_types set capacity=$1 where id=$2', [count.rows[0].total + 1, type])
  const outcomes = await Promise.allSettled([reserve(), reserve()])
  assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1)
  assert.match(String(outcomes.find(r => r.status === 'rejected')?.reason), /SOLD_OUT/)
  await asUser(admin, () => assert.rejects(db.query("select configure_ticket_type($1,'edition-8','Test',1000,0,'active')", [type]), /CAPACITY_BELOW_ALLOCATED/))
  await db.query('update ticket_types set capacity=100 where id=$1', [type])
})
test('RLS and RPC privileges deny customers and non-staff', async () => {
  await db.exec('set role anon')
  try {
    await assert.rejects(db.query('select * from ticket_orders'), /permission denied/)
    await assert.rejects(reserve(), /permission denied/)
  } finally { await db.exec('reset role') }
  await asUser(outsider, async () => {
    assert.equal((await db.query('select * from tickets')).rows.length, 0)
    assert.equal((await db.query('select * from payment_transactions')).rows.length, 0)
    await assert.rejects(db.query("select check_in_ticket('edition-8','bad','Gate',true)"), /FORBIDDEN/)
    await assert.rejects(settle('anything', 1000), /permission denied/)
  })
})
test('check-in is single-use, enforces test mode and rejects suspended staff', async () => {
  const order = await reserve()
  await settle(order.reference, 1000)
  const ticket = (await db.query<{ qr_token: string; ticket_code: string }>('select qr_token,ticket_code from tickets where order_id=(select id from ticket_orders where reference=$1)', [order.reference])).rows[0]
  await asUser(checker, async () => {
    const scan = async (input: string, mode: boolean) => (await db.query<{ result: { result: string } }>("select check_in_ticket('edition-8',$1,'Gate A',$2) result", [input, mode])).rows[0].result.result
    assert.equal(await scan(ticket.ticket_code, false), 'wrong_mode')
    assert.equal(await scan('CM-TICKET:' + ticket.qr_token, true), 'accepted')
    assert.equal(await scan(ticket.ticket_code, true), 'already_used')
    assert.equal(await scan('TKT-NOT-REAL', true), 'invalid')
  })
  await db.query("update user_profiles set status='suspended' where id=$1", [checker])
  await asUser(checker, () => assert.rejects(db.query("select check_in_ticket('edition-8',$1,'Gate',true)", [ticket.ticket_code]), /FORBIDDEN/))
  await db.query("update user_profiles set status='active' where id=$1", [checker])
  await asUser(admin, () => assert.rejects(db.query("select void_ticket($1,'edition-8')", [ticket.ticket_code]), /ALREADY_USED/))
})
test('failed payments never issue tickets and void tickets cannot enter', async () => {
  const failed = await reserve()
  assert.equal(await settle(failed.reference, 1000, randomUUID(), 'failed'), 'failed')
  await assert.rejects(settle(failed.reference, 1000), /PAYMENT_STATE_CONFLICT/)
  const order = await reserve()
  await settle(order.reference, 1000)
  const code = (await db.query<{ ticket_code: string }>('select ticket_code from tickets where order_id=(select id from ticket_orders where reference=$1)', [order.reference])).rows[0].ticket_code
  await asUser(admin, () => db.query("select void_ticket($1,'edition-8')", [code]))
  await asUser(checker, async () => {
    const result = await db.query<{ result: { result: string } }>("select check_in_ticket('edition-8',$1,'Gate',true) result", [code])
    assert.equal(result.rows[0].result.result, 'void')
  })
})
