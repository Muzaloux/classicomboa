import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CLASSICO_KICKOFF_AT,
  CLASSICO_TEAMS,
  getClassicoPredictionAvailability,
} from '../lib/classico-prediction'

test('Classico predictions open on the event day and close at the 20:30 Cameroon kickoff', () => {
  assert.equal(getClassicoPredictionAvailability(new Date('2026-10-25T14:39:59.000Z')).isOpen, true)
  assert.equal(getClassicoPredictionAvailability(new Date(CLASSICO_KICKOFF_AT)).isOpen, false)
  assert.equal(getClassicoPredictionAvailability(new Date('2026-10-24T22:59:59.000Z')).isEventDay, false)
  assert.equal(getClassicoPredictionAvailability(new Date('2026-10-26T00:00:00.000Z')).isEventDay, false)
})

test('player choices contain each supplied starting lineup player once', () => {
  assert.equal(CLASSICO_TEAMS[0].players.length, 11)
  assert.equal(CLASSICO_TEAMS[1].players.length, 11)
  const players: string[] = CLASSICO_TEAMS.flatMap((team) => [...team.players])
  assert.equal(new Set(players).size, 22)
  assert.ok(players.includes('K. Mbappé'))
  assert.ok(players.includes('Raphinha'))
  assert.ok(!players.includes('V. Junior'))
})
