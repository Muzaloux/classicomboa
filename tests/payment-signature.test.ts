import assert from 'node:assert/strict'
import { test } from 'node:test'
import { signPayment, verifyPayment } from '../lib/payment-signature'
import { checkoutSchema } from '../lib/ticketing-validation'
test('payment signature rejects altered bodies, old timestamps and malformed signatures', () => {
  const secret = 'test-secret'.repeat(4), timestamp = '1790000000', body = '{"amount":1000}'
  const signature = signPayment(body, timestamp, secret)
  assert.equal(verifyPayment(body, timestamp, signature, secret, Number(timestamp) * 1000), true)
  assert.equal(verifyPayment(body + ' ', timestamp, signature, secret, Number(timestamp) * 1000), false)
  assert.equal(verifyPayment(body, timestamp, signature, secret, (Number(timestamp) + 301) * 1000), false)
  assert.equal(verifyPayment(body, timestamp, 'bad', secret), false)
  assert.equal(verifyPayment(body, null, signature, secret), false)
})
test('checkout rejects invalid quantities, missing consent and invalid guest details', () => {
  const valid = { type: '10000000-0000-4000-8000-000000000001', request: '10000000-0000-4000-8000-000000000002', access: 'a'.repeat(64), name: 'Test Visitor', email: 'test@example.com', phone: '699123456', quantity: '2', consent: 'on', website: '' }
  assert.equal(checkoutSchema.parse(valid).phone, '+237699123456')
  for (const patch of [{ quantity: '11' }, { quantity: '-1' }, { quantity: '1.5' }, { consent: '' }, { phone: '+33123456789' }, { website: 'spam' }, { access: 'short' }]) assert.equal(checkoutSchema.safeParse({ ...valid, ...patch }).success, false)
})
