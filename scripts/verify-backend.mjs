import { createClient } from '@supabase/supabase-js'
import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd(), true)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !publicKey || !secret || !process.env.NEXT_PUBLIC_SITE_URL) {
  console.error('Missing local configuration. Follow docs/supabase-setup.md. Credentials are never printed.')
  process.exit(1)
}
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const publicClient = createClient(url, publicKey, options)
const serverClient = createClient(url, secret, options)
const { data, error } = await publicClient.from('event_editions').select('id').eq('id', 'edition-8').single()
if (error || !data) {
  console.error('Public edition check failed. Check project URL/key and apply the foundation migration.')
  process.exit(1)
}
const { error: accessError } = await publicClient.from('inquiries').select('id').limit(1)
if (!accessError) {
  console.error('Security check failed: anonymous inquiry access should be denied.')
  process.exit(1)
}
// A nonexistent edition raises before any inserts; verifies RPC setup without creating data.
const { error: rpcError } = await serverClient.rpc('submit_inquiry', {
  p_edition: '__connection_check__', p_kind: 'contact', p_name: 'Connection check',
  p_email: 'connection-check@example.invalid', p_phone: '', p_organization: '',
  p_message: 'Read-only setup check. This inquiry must never be stored.',
})
if (!rpcError?.message.includes('INQUIRIES_CLOSED')) {
  console.error('Server RPC check failed. Check the server key and migration permissions.')
  process.exit(1)
}
const { error: standError } = await serverClient.rpc('submit_stand_reservation', {
  p_edition: '__connection_check__', p_name: 'Connection check',
  p_email: 'connection-check@example.invalid', p_phone: '', p_organization: 'Connection check',
  p_message: 'Read-only setup check. This stand reservation must never be stored.',
})
if (!standError?.message.includes('INQUIRIES_CLOSED')) {
  console.error('Stand reservation RPC check failed. Apply the latest linked migration and check server credentials.')
  process.exit(1)
}
console.log('PASS: edition readable, anonymous inquiry access denied, inquiry and stand reservation RPCs configured. No records created.')
console.log('Next: test email signup, confirmation, profile saving and the organizer inbox in your browser.')
