import { processTestPayment, testTicketingEnabled } from '../../../../../lib/ticketing'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  if (!testTicketingEnabled()) return Response.json({ error: 'Unavailable' }, { status: 404 })
  if (Number(request.headers.get('content-length') || 0) > 4096) return new Response(null, { status: 413 })
  const reader = request.body?.getReader()
  if (!reader) return new Response(null, { status: 400 })
  const chunks: Uint8Array[] = []; let size = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.length
    if (size > 4096) { await reader.cancel(); return new Response(null, { status: 413 }) }
    chunks.push(value)
  }
  const result = await processTestPayment(Buffer.concat(chunks).toString('utf8'), request.headers.get('x-payment-timestamp'), request.headers.get('x-payment-signature'))
  return Response.json(result.ok ? { status: result.result } : { error: result.message }, { status: result.status, headers: { 'Cache-Control': 'no-store' } })
}
