import type { ProgrammeItem } from '../types/domain'
import { currentEdition } from './current-edition'

// Editorial preview only: no official running order or times have been supplied.
export const programme: ProgrammeItem[] = [
  { id: 'welcome', title: 'Accueil du public', category: 'Public', description: 'Retrouver la communauté et découvrir les espaces de l’événement.' },
  { id: 'entertainment', title: 'Animations & ambiance', category: 'Culture', description: 'Une place pour la musique, les animations et la participation du public.' },
  { id: 'match', title: 'Real Mboa vs Barça Mboa', category: 'Football', description: 'Le Classico version Mboa, au cœur du rendez-vous.' },
  { id: 'awards', title: 'Distinctions du Classico', category: 'Distinctions', description: 'Les catégories et modalités seront annoncées par l’organisation.' },
].map((item) => ({ ...item, editionId: currentEdition.id, status: 'draft' }))
