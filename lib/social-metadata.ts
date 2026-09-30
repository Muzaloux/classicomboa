import type { Metadata } from 'next'
import { currentEdition } from '../data/current-edition'
import { formatEventDate } from './formatting'

// Keep the preview asset reachable while the custom domain's DNS is configured.
export const socialImage = {
  url: 'https://classicomboa.vercel.app/share-image?v=1',
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: `Classico Mboa : les joueurs réunis, le logo officiel et le rendez-vous du ${formatEventDate(currentEdition.eventDate)} à ${currentEdition.city}.`,
}
export const socialOpenGraph: Metadata['openGraph'] = {
  siteName: 'Classico Mboa', locale: 'fr_CM', type: 'website', images: [socialImage],
}
export const socialTwitter: Metadata['twitter'] = {
  card: 'summary_large_image', images: [socialImage],
}
