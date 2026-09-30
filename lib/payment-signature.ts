import { createHmac, timingSafeEqual } from 'node:crypto'

export function signPayment(body: string, timestamp: string, secret: string) {
  return createHmac('sha256', secret).update(timestamp + '.' + body).digest('hex')
}
export function verifyPayment(body: string, timestamp: string | null, signature: string | null, secret: string, now = Date.now()) {
  if (!timestamp || !/^\d{10}$/.test(timestamp) || !signature || !/^[a-f0-9]{64}$/.test(signature)) return false
  if (Math.abs(now / 1000 - Number(timestamp)) > 300) return false
  return timingSafeEqual(Buffer.from(signPayment(body, timestamp, secret), 'hex'), Buffer.from(signature, 'hex'))
}
