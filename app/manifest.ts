import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Classico Mboa',
    short_name: 'Classico Mboa',
    description: 'Le Classico version Mboa au Cameroun.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#121212',
    theme_color: '#121212',
    icons: [
      { src: '/icons/classico-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/classico-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
