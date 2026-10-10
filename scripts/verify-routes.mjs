import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const origin = process.env.VERIFY_ORIGIN || 'http://localhost:3100'
const paths = ['/', '/classico', '/edition/8', '/teams', '/players', '/programme', '/tickets', '/vote', '/tombola', '/sponsors', '/news', '/gallery', '/nos-pages', '/contact', '/partner', '/stands', '/legal', '/privacy', '/auth/sign-in']
for (const path of paths) {
  const response = await fetch(origin + path)
  assert.equal(response.status, 200, path)
  const html = await response.text()
  assert.doesNotMatch(html, /fifa-cup|gaming|FIFA Cup/i, path + ': removed gaming feature')
  assert.match(html, /id="main-content"/, path + ': skip target')
  assert.match(html, /<h1[ >]/, path + ': heading')
  assert.match(html, /<title>[^<]+<\/title>/, path + ': title')
  assert.equal((html.match(/<main[ >]/g) || []).length, 1, path + ': single main')
}
const oldStandsPath = await fetch(origin + '/village', { redirect: 'manual' })
assert.equal(oldStandsPath.status, 308, 'old stands path permanently redirects')
assert.equal(oldStandsPath.headers.get('location'), '/stands')
for (const path of ['/edition/999', '/unknown-page', '/account', '/fifa-cup', '/fifa-cup/rules', '/fifa-cup/bracket', '/fifa-cup/live', '/fifa-cup/players', '/fifa-cup/display']) {
  const response = await fetch(origin + path)
  assert.equal(response.status, 404, path)
}
const edition = await (await fetch(origin + '/edition/8')).text()
assert.match(edition, /application\/ld\+json/)
const configuredDate = (await readFile(new URL('../data/current-edition.ts', import.meta.url), 'utf8')).match(/eventDate:\s*'([^']+)'/)?.[1]
assert.ok(configuredDate && edition.includes(configuredDate), 'structured data matches configured edition date')
console.log('Passed: ' + paths.length + ' public routes, 9 unavailable-route checks, metadata and event schema.')
const login = await (await fetch(origin + '/auth/sign-in')).text()
assert.doesNotMatch(login, /Créer un compte|Créer mon compte/, 'No public signup UI')
for (const path of ['/admin', '/admin/security', '/admin/tickets', '/admin/check-in']) {
  const response = await fetch(origin + path, { redirect: 'manual' })
  if (response.status === 307) {
    assert.match(response.headers.get('location'), /\/auth\/sign-in$/, path + ': safe redirect')
  } else {
    // Next.js redirects after streaming begins use a refresh meta tag with HTTP 200.
    assert.equal(response.status, 200, path + ': streamed redirect status')
    const html = await response.text()
    assert.match(html, /<meta[^>]+http-equiv="refresh"[^>]+content="\d+;url=\/auth\/sign-in"/, path + ': streamed sign-in redirect')
    assert.doesNotMatch(html, /name="display_name"|class="inquiry-card"/, path + ': no private content')
  }
}
const callback = await fetch(origin + '/auth/callback?next=https://example.com', { redirect: 'manual' })
assert.match(callback.headers.get('location'), /\/auth\/sign-in\?error=confirmation$/, 'invalid callback stays on the site')
console.log('Passed: organizer-only login, protected admin route and invalid auth callback protections.')
