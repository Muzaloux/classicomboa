import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite()
const admin = randomUUID(), outsider = randomUUID()
const hash = 'c'.repeat(64)
const draw = '30000000-0000-4000-8000-000000000001'
before(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;`)
  const dir = new URL('../supabase/migrations/', import.meta.url)
  for (const file of (await readdir(dir)).filter(f => f.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, dir), 'utf8'))
  await db.query('insert into auth.users values ($1),($2)', [admin, outsider])
  await db.query("insert into edition_staff(user_id,edition_id,role) values($1,'edition-8','admin')", [admin])
})
after(() => db.close())
async function asUser<T>(id: string, fn: () => Promise<T>) {
  await db.exec('set role authenticated')
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id])
  try { return await fn() } finally { await db.exec('reset role') }
}
async function reserve(quantity: number, name = 'Marie Claire Ngo', request = randomUUID()) {
  return (await db.query<{ reference: string }>("select reserve_tombola_order('edition-8',$1,$2,$3,'+237699123456',$4,$5,'manuel') reference", [draw, quantity, name, request, hash])).rows[0].reference
}
const confirm = (reference: string, amount: number, receipt: string) => db.query("select confirm_tombola_payment('edition-8',$1,$2,$3)", [reference, amount, receipt])

test('entries are priced by the server and retries reuse one order', async () => {
  const request = randomUUID()
  const reference = await reserve(4, 'Marie Claire Ngo', request)
  assert.equal(await reserve(4, 'Marie Claire Ngo', request), reference)
  assert.equal((await db.query<{ total_xaf: number }>('select total_xaf from tombola_orders where reference=$1', [reference])).rows[0].total_xaf, 2000)
  await assert.rejects(reserve(101), /INVALID_ORDER/)
  await assert.rejects(reserve(2, 'Marie Claire Ngo', request), /REQUEST_CONFLICT/)
})
test('only organizers confirm; confirmed entries get unique consecutive numbers', async () => {
  const a = await reserve(3, 'Paul Biya'), b = await reserve(2, 'Jean Kamga')
  await asUser(outsider, () => assert.rejects(confirm(a, 1500, 'TOMB-RECEIPT-A'), /FORBIDDEN/))
  await asUser(admin, async () => {
    await assert.rejects(confirm(a, 1000, 'TOMB-RECEIPT-A'), /AMOUNT_MISMATCH/)
    await confirm(a, 1500, 'TOMB-RECEIPT-A'); await confirm(a, 1500, 'TOMB-RECEIPT-A')
    await assert.rejects(confirm(b, 1000, 'tomb-receipt-a'), /duplicate key/)
    await confirm(b, 1000, 'TOMB-RECEIPT-B')
  })
  const numbers = (await db.query<{ entry_number: number }>('select entry_number from tombola_entries order by entry_number')).rows.map(r => r.entry_number)
  assert.deepEqual(numbers, [1, 2, 3, 4, 5])
})
test('the draw needs a closed tombola, is final and gives one win per buyer', async () => {
  await asUser(outsider, () => assert.rejects(db.query("select draw_tombola('edition-8',$1)", [draw]), /FORBIDDEN/))
  await asUser(admin, async () => {
    await assert.rejects(db.query("select draw_tombola('edition-8',$1)", [draw]), /CLOSE_FIRST/)
    await db.query("update tombola_draws set status='closed', winners_count=5 where id=$1", [draw])
  })
  assert.ok(await reserveWhileClosedFails())
  await asUser(admin, () => assert.rejects(db.query("select draw_tombola('edition-8',$1)", [draw]), /PENDING_PAYMENTS/))
  await db.exec("update tombola_orders set status='expired' where status='pending'")
  await asUser(admin, async () => {
    const won = (await db.query<{ n: number }>("select draw_tombola('edition-8',$1) n", [draw])).rows[0].n
    assert.equal(won, 2)
    await assert.rejects(db.query("select draw_tombola('edition-8',$1)", [draw]), /ALREADY_DRAWN/)
    await assert.rejects(confirm(randomUUID().toString(), 1, 'XXXXXXXX'), /NOT_FOUND/)
  })
  const winners = (await db.query<{ o: string }>('select distinct e.order_id o from tombola_winners w join tombola_entries e on e.id=w.entry_id')).rows
  assert.equal(winners.length, 2)
})
async function reserveWhileClosedFails() { try { await reserve(1); return false } catch (error) { return /TOMBOLA_CLOSED/.test(String(error)) } }
test('public winners are masked and hidden until published', async () => {
  assert.equal((await db.query('select * from tombola_winners_public($1)', ['edition-8'])).rows.length, 0)
  await db.exec('update tombola_draws set results_public = true')
  const names = (await db.query<{ winner: string }>("select winner from tombola_winners_public('edition-8')")).rows.map(r => r.winner).sort()
  assert.deepEqual(names, ['Jean K.', 'Paul B.'])
  await db.exec('set role anon')
  try { await assert.rejects(db.query("select * from tombola_winners_public('edition-8')"), /permission denied/); await assert.rejects(db.query('select * from tombola_orders'), /permission denied/) } finally { await db.exec('reset role') }
})
