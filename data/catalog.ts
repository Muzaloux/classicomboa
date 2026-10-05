import { eventPhotos } from './event-photos'
import type { Artist, MediaItem, NewsArticle, Player, Sponsor, Vendor } from '../types/domain'

// Squad names and numbers supplied for Edition 8. Photos will be added later.
export const players: Player[] = [
  { id: 'edition-8-barca-1', editionId: 'edition-8', teamId: 'barca-mboa', name: "LUC", number: 1, public: true },
  { id: 'edition-8-barca-2', editionId: 'edition-8', teamId: 'barca-mboa', name: "RUDY", number: 18, public: true },
  { id: 'edition-8-barca-3', editionId: 'edition-8', teamId: 'barca-mboa', name: "MANOEL (c)", number: 10, public: true },
  { id: 'edition-8-barca-4', editionId: 'edition-8', teamId: 'barca-mboa', name: "LA BRÉSILIENNE", number: 6, public: true },
  { id: 'edition-8-barca-5', editionId: 'edition-8', teamId: 'barca-mboa', name: "SYLVANO", number: 24, public: true },
  { id: 'edition-8-barca-6', editionId: 'edition-8', teamId: 'barca-mboa', name: "DILANE KAD", number: 8, public: true },
  { id: 'edition-8-barca-7', editionId: 'edition-8', teamId: 'barca-mboa', name: "POLLO~G", number: 17, public: true },
  { id: 'edition-8-barca-8', editionId: 'edition-8', teamId: 'barca-mboa', name: "NSANGOU", number: 5, public: true },
  { id: 'edition-8-barca-9', editionId: 'edition-8', teamId: 'barca-mboa', name: "TAMETA", number: 14, public: true },
  { id: 'edition-8-barca-10', editionId: 'edition-8', teamId: 'barca-mboa', name: "LE MONSTRE BANGBIA", number: 99, public: true },
  { id: 'edition-8-barca-11', editionId: 'edition-8', teamId: 'barca-mboa', name: "WILLIAM", number: 30, public: true },
  { id: 'edition-8-barca-12', editionId: 'edition-8', teamId: 'barca-mboa', name: "KAPRISKI", number: 3, public: true },
  { id: 'edition-8-barca-13', editionId: 'edition-8', teamId: 'barca-mboa', name: "OPIC", number: 25, public: true },
  { id: 'edition-8-barca-14', editionId: 'edition-8', teamId: 'barca-mboa', name: "NGWEN", number: 11, public: true },
  { id: 'edition-8-barca-15', editionId: 'edition-8', teamId: 'barca-mboa', name: "MANITOU", number: 95, public: true },
  { id: 'edition-8-barca-16', editionId: 'edition-8', teamId: 'barca-mboa', name: "ADRIEL", number: 19, public: true },
  { id: 'edition-8-barca-17', editionId: 'edition-8', teamId: 'barca-mboa', name: "PA'A BONGUE", number: 27, public: true },
  { id: 'edition-8-barca-18', editionId: 'edition-8', teamId: 'barca-mboa', name: "MUSA", number: 23, public: true },
  { id: 'edition-8-real-1', editionId: 'edition-8', teamId: 'real-mboa', name: "LOÏC MOURAD", position: 'Défenseur', number: 1, public: true },
  { id: 'edition-8-real-2', editionId: 'edition-8', teamId: 'real-mboa', name: "STEPHEN", position: 'Défenseur', number: 22, public: true },
  { id: 'edition-8-real-3', editionId: 'edition-8', teamId: 'real-mboa', name: "TRÉSOR", position: 'Milieu', number: 47, public: true },
  { id: 'edition-8-real-4', editionId: 'edition-8', teamId: 'real-mboa', name: "BANGUI", position: 'Milieu', number: 19, public: true },
  { id: 'edition-8-real-5', editionId: 'edition-8', teamId: 'real-mboa', name: "TCHAMI", position: 'Milieu', number: 5, public: true },
  { id: 'edition-8-real-6', editionId: 'edition-8', teamId: 'real-mboa', name: "BABIDI (C)", position: 'Milieu', number: 8, public: true },
  { id: 'edition-8-real-7', editionId: 'edition-8', teamId: 'real-mboa', name: "STÉPHANE", position: 'Attaquant', number: 20, public: true },
  { id: 'edition-8-real-8', editionId: 'edition-8', teamId: 'real-mboa', name: "THAURESS", position: 'Attaquant', number: 7, public: true },
  { id: 'edition-8-real-9', editionId: 'edition-8', teamId: 'real-mboa', name: "ALEXANDRE", position: 'Attaquant', number: 17, public: true },
  { id: 'edition-8-real-10', editionId: 'edition-8', teamId: 'real-mboa', name: "BORRIS", position: 'Attaquant', number: 11, public: true },
  { id: 'edition-8-real-11', editionId: 'edition-8', teamId: 'real-mboa', name: "HUGO", position: 'Défenseur', number: 96, public: true },
  { id: 'edition-8-real-12', editionId: 'edition-8', teamId: 'real-mboa', name: "PDB BOSS", position: 'Attaquant', number: 10, public: true },
  { id: 'edition-8-real-13', editionId: 'edition-8', teamId: 'real-mboa', name: "KYLIAN", position: 'Milieu', number: 6, public: true },
  { id: 'edition-8-real-14', editionId: 'edition-8', teamId: 'real-mboa', name: "D. GENEVIÈVE", number: 14, public: true },
  { id: 'edition-8-real-15', editionId: 'edition-8', teamId: 'real-mboa', name: "JORDAN", position: 'Défenseur', number: 2, public: true },
  { id: 'edition-8-real-16', editionId: 'edition-8', teamId: 'real-mboa', name: "BEROL", position: 'Défenseur', number: 15, public: true },
  { id: 'edition-8-real-17', editionId: 'edition-8', teamId: 'real-mboa', name: "WILLY NAMASSO", position: 'Milieu', number: 12, public: true },
  { id: 'edition-8-real-18', editionId: 'edition-8', teamId: 'real-mboa', name: "MR DOUKOURÉ", position: 'Gardien', number: 13, public: true },
  { id: 'edition-8-real-19', editionId: 'edition-8', teamId: 'real-mboa', name: "YOAN .K", position: 'Défenseur', number: 4, public: true },
  { id: 'edition-8-real-20', editionId: 'edition-8', teamId: 'real-mboa', name: "K. SMOKE", position: 'Attaquant', number: 9, public: true },
]
export const news: NewsArticle[] = []
export const sponsors: Sponsor[] = []
export const artists: Artist[] = []
export const media: MediaItem[] = eventPhotos.map((photo) => ({ id: photo.id, url: photo.src, alt: photo.alt, type: 'image', public: true }))
export const vendors: Vendor[] = []

export const standCategories = ['Restauration', 'Boissons', 'Gourmandises', 'Maillots', 'Mode', 'Beauté', 'Téléphones & accessoires', 'Photographie', 'Autres activités']
export const voteCategories = ['Meilleur joueur', 'MVP du Classico', 'Meilleur gardien', 'Meilleur défenseur', 'Meilleur buteur', 'Meilleur but', 'Révélation', 'Fair-Play', 'Meilleur supporter', 'Meilleur look', 'Coup de cœur du public']
export const sponsorTiers = ['Partenaire principal', 'Partenaires officiels', 'Partenaires de soutien', 'Partenaires médias', 'Partenaires produits']
export const proposedPrices = { classique: 1000, vip: 2000, tombola: 500, vote: 100 } as const
