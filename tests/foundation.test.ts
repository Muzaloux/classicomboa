import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { inquirySchema, normalizeCameroonPhone, profileSchema } from '../lib/validation'

const db = new PGlite()
const attendee = '00000000-0000-4000-8000-000000000001'
const staff = '00000000-0000-4000-8000-000000000002'
const otherStaff = '00000000-0000-4000-8000-000000000003'
let inquiryId: string

before(async () => {
  // Emulate only Supabase's auth schema and roles; migrations and RLS run in PostgreSQL.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `)
  const migrations = new URL('../supabase/migrations/', import.meta.url)
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, migrations), 'utf8'))
  }
  await db.query('insert into auth.users(id) values ($1),($2),($3)', [attendee, staff, otherStaff])
  await db.exec(`insert into public.event_editions(id,slug,edition_number,name,event_date,venue,city,status)
    values ('edition-9','9',9,'Next edition','2027-12-12','TBC','Douala','draft');`)
  await db.query("insert into public.edition_staff(user_id,edition_id,role) values ($1,'edition-8','support'),($2,'edition-9','admin')", [staff, otherStaff])
})
after(async () => { await db.close() })

async function asUser<T>(id: string, callback: () => Promise<T>) {
  await db.exec('set role authenticated')
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id])
  try { return await callback() } finally { await db.exec('reset role') }
}

test('Cameroon phone formats normalize and invalid inputs are rejected', () => {
  for (const phone of ['699123456', '237699123456', '+237 699 123 456']) assert.equal(normalizeCameroonPhone(phone), '+237699123456')
  for (const phone of ['+33699123456', '69912345', 'text699123456', '237237699123456']) assert.equal(normalizeCameroonPhone(phone), null)
  assert.equal(profileSchema.safeParse({ display_name: 'Valid name', phone: '', city: '' }).success, true)
})

test('Inquiry validation requires consent, meaningful message and business identity', () => {
  const valid = { kind: 'contact', name: 'Test Person', email: 'Person@Example.com', phone: '', organization: '', message: 'A detailed question about the event.', consent: 'on', website: '' }
  assert.equal(inquirySchema.parse(valid).email, 'person@example.com')
  for (const patch of [{ consent: '' }, { message: 'short' }, { website: 'spam' }, { kind: 'partner' }, { kind: 'exhibitor' }]) assert.equal(inquirySchema.safeParse({ ...valid, ...patch }).success, false)
})

test('Anonymous visitors can read published editions but cannot read private data or call mutations', async () => {
  await db.exec('set role anon')
  try {
    const editions = await db.query('select id from public.event_editions')
    assert.deepEqual(editions.rows, [{ id: 'edition-8' }])
    await assert.rejects(db.query('select * from public.inquiries'), /permission denied/)
    await assert.rejects(db.query("select public.submit_inquiry('edition-8','contact','Test','x@example.com','','','A sufficiently detailed message')"), /permission denied/)
  } finally { await db.exec('reset role') }
})

test('Profile creation is automatic; profile access cannot expose another user or escalate privileges', async () => {
  await asUser(attendee, async () => {
    const profiles = await db.query<{ id: string }>('select id from public.user_profiles')
    assert.deepEqual(profiles.rows, [{ id: attendee }])
    await db.query("update public.user_profiles set display_name = 'My name' where id = $1", [attendee])
    await assert.rejects(db.query("update public.user_profiles set status = 'disabled' where id = $1", [attendee]), /permission denied/)
    await assert.rejects(db.query("insert into public.edition_staff(user_id,edition_id,role) values ($1,'edition-8','admin')", [attendee]), /permission denied/)
    assert.equal((await db.query('select * from public.edition_staff')).rows.length, 0)
  })
})

test('Submission persists data and enforces the hourly quota atomically', async () => {
  await db.exec('set role service_role')
  try {
    const sql = "select public.submit_inquiry('edition-8','contact','Test Person','person@example.com','','','A detailed inquiry about this event.') as id"
    inquiryId = (await db.query<{ id: string }>(sql)).rows[0].id
    await db.query(sql)
    await db.query(sql)
    await assert.rejects(db.query(sql), /RATE_LIMITED/)
    await assert.rejects(db.query("select public.submit_inquiry('edition-9','contact','Test','new@example.com','','','A detailed inquiry about this event.')"), /INQUIRIES_CLOSED/)
  } finally { await db.exec('reset role') }
  assert.equal((await db.query('select * from public.inquiries')).rows.length, 3)
})

test('Stand reservation requests hold at most 10 places until an organizer closes one', async () => {
  await db.exec('set role service_role')
  try {
    for (let slot = 1; slot <= 10; slot++) {
      await db.query(
        "select public.submit_stand_reservation('edition-8',$1,$2,'','Vendor','Interested in renting a stand at the event.')",
        [`Vendor ${slot}`, `vendor${slot}@example.com`],
      )
    }
    await assert.rejects(db.query(
      "select public.submit_stand_reservation('edition-8','Vendor 11','vendor11@example.com','','Vendor','Interested in renting a stand at the event.')",
    ), /STANDS_FULL/)
    await assert.rejects(db.query(
      "select public.submit_inquiry('edition-8','exhibitor','Vendor 11','vendor11@example.com','','Vendor','Interested in renting a stand at the event.')",
    ), /STANDS_FULL/)
  } finally { await db.exec('reset role') }

  const held = await db.query<{ id: string }>("select id from public.inquiries where kind = 'exhibitor' and status = 'new' order by created_at, id limit 1")
  await asUser(staff, async () => {
    await db.query("select public.set_inquiry_status($1,'edition-8','closed')", [held.rows[0].id])
  })

  await db.exec('set role service_role')
  try {
    await db.query("select public.submit_stand_reservation('edition-8','Vendor 11','vendor11@example.com','','Vendor','Interested in renting a stand at the event.')")
  } finally { await db.exec('reset role') }
})

test('Attendees and staff from another edition cannot see or modify inquiries', async () => {
  for (const id of [attendee, otherStaff]) await asUser(id, async () => {
    assert.equal((await db.query("select * from public.inquiries where kind = 'contact'")).rows.length, 0)
    await assert.rejects(db.query("select public.set_inquiry_status($1,'edition-8','closed')", [inquiryId]), /FORBIDDEN/)
  })
})

test('Authorized status changes are audited and retries do not duplicate audit entries', async () => {
  await asUser(staff, async () => {
    assert.equal((await db.query("select * from public.inquiries where kind = 'contact'")).rows.length, 3)
    await assert.rejects(db.query("update public.inquiries set status = 'closed'"), /permission denied/)
    await db.query("select public.set_inquiry_status($1,'edition-8','in_review')", [inquiryId])
    await db.query("select public.set_inquiry_status($1,'edition-8','in_review')", [inquiryId])
    const audit = await db.query('select actor_id,old_status,new_status from public.audit_events where entity_id = $1', [inquiryId])
    assert.deepEqual(audit.rows, [{ actor_id: staff, old_status: 'new', new_status: 'in_review' }])
    await assert.rejects(db.query("select public.set_inquiry_status($1,'edition-8','invalid')", [inquiryId]), /INVALID_STATUS/)
  })
})

test('Suspended staff immediately lose inquiry permissions and profile mutation access', async () => {
  await db.query("update public.user_profiles set status = 'suspended' where id = $1", [staff])
  await asUser(staff, async () => {
    assert.equal((await db.query('select * from public.inquiries')).rows.length, 0)
    await assert.rejects(db.query("select public.set_inquiry_status($1,'edition-8','closed')", [inquiryId]), /FORBIDDEN/)
    const update = await db.query("update public.user_profiles set display_name = 'Changed' returning id")
    assert.equal(update.rows.length, 0)
  })
})
