import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite()
const admin = randomUUID(), outsider = randomUUID()
const hash = 'b'.repeat(64)
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
async function candidate() { return (await db.query<{ id: string }>("select k.id from vote_candidates k join vote_categories c on c.id=k.category_id where c.slug='mvp' order by k.sort_order limit 1")).rows[0].id }
async function reserve(quantity: number, request = randomUUID()) {
  return (await db.query<{ reference: string }>("select reserve_vote_order('edition-8',$1,$2,'Fan Voter','+237699123456',$3,$4,'manuel') reference", [await candidate(), quantity, request, hash])).rows[0].reference
}

test('seeded categories carry the squads as candidates', async () => {
  const rows = (await db.query<{ slug: string; n: number }>("select c.slug, count(*)::int n from vote_categories c join vote_candidates k on k.category_id=c.id group by c.slug")).rows
  assert.deepEqual(Object.fromEntries(rows.map(r => [r.slug, r.n])), { mvp: 38, 'meilleur-real': 20, 'meilleur-barca': 18 })
})
test('votes are priced by the server and retries reuse one order', async () => {
  const request = randomUUID()
  const reference = await reserve(3, request)
  assert.equal(await reserve(3, request), reference)
  assert.equal((await db.query<{ total_xaf: number }>('select total_xaf from vote_orders where reference=$1', [reference])).rows[0].total_xaf, 300)
  await assert.rejects(reserve(101), /INVALID_ORDER/)
  await assert.rejects(reserve(0), /INVALID_ORDER/)
  await assert.rejects(reserve(2, request), /REQUEST_CONFLICT/)
})
test('only organizers confirm payments and only paid votes are counted', async () => {
  const reference = await reserve(5)
  await asUser(outsider, () => assert.rejects(db.query("select confirm_vote_payment('edition-8',$1,500,'VOTE-RECEIPT-1')", [reference]), /FORBIDDEN/))
  await asUser(admin, async () => {
    await assert.rejects(db.query("select confirm_vote_payment('edition-8',$1,400,'VOTE-RECEIPT-1')", [reference]), /AMOUNT_MISMATCH/)
    assert.equal((await db.query<{ s: string }>("select confirm_vote_payment('edition-8',$1,500,'VOTE-RECEIPT-1') s", [reference])).rows[0].s, 'paid')
    assert.equal((await db.query<{ s: string }>("select confirm_vote_payment('edition-8',$1,500,'VOTE-RECEIPT-1') s", [reference])).rows[0].s, 'paid')
  })
  const other = await reserve(1)
  await asUser(admin, () => assert.rejects(db.query("select confirm_vote_payment('edition-8',$1,100,'vote-receipt-1')", [other]), /duplicate key/))
  const tally = (await db.query<{ votes: number }>("select votes::int from vote_results('edition-8', false) where candidate_id=$1", [await candidate()])).rows[0].votes
  assert.equal(tally, 5)
})
test('public results stay hidden until the organizers publish them', async () => {
  assert.equal((await db.query('select 1 from vote_results($1, true)', ['edition-8'])).rows.length, 0)
  await db.exec("update vote_categories set results_public = true where slug='mvp'")
  assert.equal((await db.query<{ n: number }>("select count(distinct category_name)::int n from vote_results('edition-8', true)")).rows[0].n, 1)
})
test('anonymous clients cannot read voters or call vote functions', async () => {
  await db.exec('set role anon')
  try {
    await assert.rejects(db.query('select * from vote_orders'), /permission denied/)
    await assert.rejects(db.query("select vote_results('edition-8', false)"), /permission denied/)
  } finally { await db.exec('reset role') }
})
test('full tallies are limited to organizers', async () => {
  await asUser(outsider, async () => {
    await assert.rejects(db.query("select * from vote_results('edition-8', false)"), /FORBIDDEN/)
    assert.ok((await db.query("select * from vote_results('edition-8', true)")).rows.length > 0)
  })
  await asUser(admin, async () => assert.ok((await db.query("select * from vote_results('edition-8', false)")).rows.length === 76))
})
