import type { Metadata } from 'next'

const pageKeys: Record<string, string> = {
  '/': 'home',
  '/edition/8': 'edition',
  '/tickets/checkout': 'tickets',
  '/vote/results': 'vote-results',
  '/tombola/results': 'tombola',
  '/joueurs': 'players',
}

export function socialPageKey(path: string) {
  if (pageKeys[path]) return pageKeys[path]
  if (path.startsWith('/edition/')) return 'edition'
  if (path.startsWith('/tickets')) return 'tickets'
  if (path.startsWith('/vote')) return 'vote'
  if (path.startsWith('/tombola')) return 'tombola'
  if (path === '/players') return 'players'
  return path.replace(/^\/+|\/+$/g, '').replace(/\//g, '-') || 'home'
}

export function socialImageFor(path = '/', title?: string) {
  const key = socialPageKey(path)
  const params = new URLSearchParams({ page: key, v: '4' })
  return {
    url: `https://classicomboa.com/share-image?${params.toString()}`,
    width: 1200,
    height: 630,
    type: 'image/jpeg',
    alt: `Aperçu Classico Mboa — ${title || 'football, culture et communauté à Douala'}.`,
  }
}

export function socialOpenGraphFor(path: string, title: string, description: string): Metadata['openGraph'] {
  return {
    siteName: 'Classico Mboa',
    locale: 'fr_CM',
    type: 'website',
    title,
    description,
    images: [socialImageFor(path, title)],
  }
}

export function socialTwitterFor(path: string, title: string, description: string): Metadata['twitter'] {
  return {
    card: 'summary_large_image',
    title,
    description,
    images: [socialImageFor(path, title)],
  }
}

export const socialOpenGraph = socialOpenGraphFor('/', 'Classico Mboa | Le Classico Version Mboa', 'Classico Mboa rassemble football, culture, musique et divertissement autour du Classico version Mboa au Cameroun.')
export const socialTwitter = socialTwitterFor('/', 'Classico Mboa', 'Le Classico Version Mboa — football, culture et communauté à Douala.')
