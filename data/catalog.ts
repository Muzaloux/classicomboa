import { eventPhotos } from './event-photos'
import type { Artist, MediaItem, NewsArticle, Player, Sponsor, Vendor } from '../types/domain'

// Empty until official publication. Never substitute invented identities or partners.
export const players: Player[] = []
export const news: NewsArticle[] = []
export const sponsors: Sponsor[] = []
export const artists: Artist[] = []
export const media: MediaItem[] = eventPhotos.map((photo) => ({ id: photo.id, url: photo.src, alt: photo.alt, type: 'image', public: true }))
export const vendors: Vendor[] = []

export const villageCategories = ['Restauration', 'Boissons', 'Gourmandises', 'Maillots', 'Mode', 'Beauté', 'Téléphones & accessoires', 'Photographie', 'Autres activités']
export const voteCategories = ['Meilleur joueur', 'MVP du Classico', 'Meilleur gardien', 'Meilleur défenseur', 'Meilleur buteur', 'Meilleur but', 'Révélation', 'Fair-Play', 'Meilleur supporter', 'Meilleur look', 'Coup de cœur du public']
export const sponsorTiers = ['Partenaire principal', 'Partenaires officiels', 'Partenaires de soutien', 'Partenaires médias', 'Partenaires produits']
export const proposedPrices = { classique: 1000, vip: 2000, tombola: 500, vote: 100 } as const
