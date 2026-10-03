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
const reserve = (phone: string, club = 'barca-mboa', request: string = randomUUID()) => db.query<{ reference: string }>("select reserve_player_registration('edition-8',$1,'Joueur Test',$2,$3,$4,'manuel') reference", [club, phone, request, hash]).then(r => r.rows[0].reference)

test('player fee is fixed by the server at 16000 and one phone registers once', async () => {
  const request = randomUUID()
  const reference = await reserve('+237699000001', 'real-mboa', request)
  assert.match(reference, /^[A-HJ-NP-Z2-9]{6}$/)
  assert.equal(await reserve('+237699000001', 'real-mboa', request), reference)
  assert.equal((await db.query<{ amount_xaf: number }>('select amount_xaf from player_registrations where reference=$1', [reference])).rows[0].amount_xaf, 16000)
  await assert.rejects(reserve('+237699000001', 'barca-mboa'), /ALREADY_REGISTERED/)
  await assert.rejects(reserve('+237699000002', 'psg'), /INVALID_ORDER/)
})
test('only organizers confirm, and only the full amount', async () => {
  const reference = await reserve('+237699000003')
  await asUser(outsider, () => assert.rejects(db.query("select confirm_player_payment('edition-8',$1,16000,'PLAYER-RCPT-1')", [reference]), /FORBIDDEN/))
  await asUser(admin, async () => {
    await assert.rejects(db.query("select confirm_player_payment('edition-8',$1,8000,'PLAYER-RCPT-1')", [reference]), /AMOUNT_MISMATCH/)
    assert.equal((await db.query<{ s: string }>("select confirm_player_payment('edition-8',$1,16000,'PLAYER-RCPT-1') s", [reference])).rows[0].s, 'paid')
    assert.equal((await db.query<{ s: string }>("select confirm_player_payment('edition-8',$1,16000,'PLAYER-RCPT-1') s", [reference])).rows[0].s, 'paid')
  })
  const other = await reserve('+237699000004')
  await asUser(admin, () => assert.rejects(db.query("select confirm_player_payment('edition-8',$1,16000,'player-rcpt-1')", [other]), /duplicate key/))
})
test('closed registration is refused and anonymous clients see nothing', async () => {
  await db.exec("update player_registration_settings set is_open=false")
  await assert.rejects(reserve('+237699000005'), /REGISTRATION_CLOSED/)
  await db.exec("update player_registration_settings set is_open=true")
  await db.exec('set role anon')
  try { await assert.rejects(db.query('select * from player_registrations'), /permission denied/) } finally { await db.exec('reset role') }
})
test('Musa is a candidate in the Barça categories', async () => {
  assert.equal((await db.query<{ n: number }>("select count(*)::int n from vote_candidates where name='MUSA'")).rows[0].n, 2)
})
