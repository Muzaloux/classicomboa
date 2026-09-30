import nextEnv from '@next/env'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs/promises'
import { randomUUID, createHash } from 'node:crypto'
import assert from 'node:assert/strict'
nextEnv.loadEnvConfig(process.cwd(), true)
if (process.argv[3] !== 'omzfphciqhiqavpsxlxg' || process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://omzfphciqhiqavpsxlxg.supabase.co') throw new Error('Correct project reference required')
const path = 'artifacts/manual-checkout-fixture.json'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const unwrap = result => { if (result.error) throw result.error; return result.data }
if (process.argv[2] === 'setup') {
  try { await fs.access(path); throw new Error('Existing fixture') } catch (error) { if (error.code !== 'ENOENT') throw error }
  const run = randomUUID()
  await fs.mkdir('artifacts', { recursive: true })
  await fs.writeFile(path, JSON.stringify({ run, email: `manual-smoke-${run}@example.com` }))
  console.log('Temporary guest identity prepared. No email sent.')
} else {
  const f = JSON.parse(await fs.readFile(path, 'utf8'))
  assert.equal(f.email, `manual-smoke-${f.run}@example.com`)
  const orders = unwrap(await db.from('ticket_orders').select('id,reference,status,total_xaf,quantity,customer_name').eq('customer_email', f.email))
  assert.ok(orders.length > 0)
  for (const order of orders) {
    assert.equal(order.customer_name, 'Manual Checkout Smoke')
    assert.ok(['pending', 'expired'].includes(order.status), 'Never remove paid orders')
    assert.equal(unwrap(await db.from('tickets').select('id').eq('order_id', order.id)).length, 0)
  }
  if (process.argv[2] === 'verify') {
    const ids = orders.map(o => o.id)
    const payments = unwrap(await db.from('payment_transactions').select('provider,status,contact').in('order_id', ids))
    assert.ok(payments.every(p => p.provider === 'manual_mobile_money' && p.status === 'pending'))
    assert.ok(payments.some(p => p.contact === 'youana'))
    assert.ok(orders.every(o => o.total_xaf === o.quantity * 1000))
    console.log('PASS: WhatsApp checkout saved unpaid orders with correct amount/contact and no tickets.')
  } else if (process.argv[2] === 'cleanup') {
    const ids = orders.map(o => o.id)
    unwrap(await db.from('payment_transactions').delete().in('order_id', ids))
    unwrap(await db.from('ticket_order_items').delete().in('order_id', ids))
    unwrap(await db.from('ticket_orders').delete().in('id', ids))
    unwrap(await db.from('submission_limits').delete().eq('bucket', 'order:' + createHash('md5').update(f.email).digest('hex')))
    await fs.unlink(path)
    console.log('Only tagged unpaid smoke-test orders removed.')
  } else throw new Error('Unknown mode')
}
