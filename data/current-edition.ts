import type { EventEdition, Team } from '../types/domain'

export const currentEdition: EventEdition = {
  id: 'edition-8',
  editionNumber: 8,
  name: 'Classico Mboa — 8e édition',
  slug: '8',
  eventDate: '2026-12-19',
  venue: 'Omnisports Bépanda',
  city: 'Douala',
  country: 'Cameroun',
  timezone: 'Africa/Douala',
  locale: 'fr-CM',
  currency: 'XAF',
  status: 'upcoming',
}

export const editionTeams: Team[] = [
  {
    id: 'real-mboa',
    editionId: currentEdition.id,
    name: 'Real Mboa',
    slug: 'real-mboa',
    accent: '#d8b65f',
  },
  {
    id: 'barca-mboa',
    editionId: currentEdition.id,
    name: 'Barça Mboa',
    slug: 'barca-mboa',
    accent: '#c83a45',
  },
]