import { getEventPhoto } from './event-photos'
import { getAdditionalEventPhoto } from './additional-event-photos'
import type { EventPhotoData } from './event-photos'
import tombolaImage from '../public/images/events/tombola.webp'
export interface ExperienceCardData {
  id: string
  className: string
  photo?: EventPhotoData
  category: string
  eyebrow: string
  title: string
  action: string
  href: string
  icon: 'football' | 'culture' | 'community' | 'gaming' | 'chance' | 'vote' | 'village' | 'partners'
}

export const experienceCards: ExperienceCardData[] = [
  {
    id: 'football',
    className: 'experience-match',
    photo: getEventPhoto('goalkeeper'),
    category: 'FOOTBALL',
    eyebrow: 'REAL MBOA FACE À BARÇA MBOA',
    title: 'LE FOOTBALL,\nVERSION MBOA.',
    action: 'Voir les équipes',
    href: '/teams',
    icon: 'football',
  },
  {
    id: 'culture',
    className: 'experience-culture',
    photo: getAdditionalEventPhoto('archive-6663'),
    category: 'CULTURE',
    eyebrow: 'UNE EXPÉRIENCE À DOUALA',
    title: 'FOOTBALL\nET CULTURE.',
    action: 'Découvrir le programme',
    href: '/programme',
    icon: 'culture',
  },
  {
    id: 'gaming',
    className: 'experience-gaming',

    category: 'GAMING',
    eyebrow: 'CLASSICO FIFA CUP',
    title: 'LE JEU\nCONTINUE.',
    action: 'Voir le tournoi',
    href: '/fifa-cup',
    icon: 'gaming',
  },
  {
    id: 'tombola',
    className: 'experience-chance',
    photo: {
      id: 'tombola',
      src: tombolaImage.src,
      source: 'Tombola.jpg',
      category: 'Tombola',
      alt: 'Illustration de la tombola avec des cadeaux et des tickets dorés.',
      caption: 'La tombola du Classico',
      position: '50% 40%',
      width: tombolaImage.width,
      height: tombolaImage.height,
      blurDataURL: tombolaImage.blurDataURL!,
    },
    category: 'TOMBOLA',
    eyebrow: 'PARTICIPATION DU PUBLIC',
    title: 'LE TIRAGE\nÀ VENIR.',
    action: 'Infos tombola',
    href: '/tombola',
    icon: 'chance',
  },
  {
    id: 'votes',
    className: 'experience-vote',
    photo: getEventPhoto('rivalry'),
    category: 'VOTES',
    eyebrow: 'LES DISTINCTIONS DU PUBLIC',
    title: 'À VOUS\nDE VOTER.',
    action: 'Découvrir les votes',
    href: '/vote',
    icon: 'vote',
  },
  {
    id: 'village',
    className: 'experience-village',

    category: 'VILLAGE',
    eyebrow: 'CLASSICO VILLAGE',
    title: 'DÉCOUVRIR\nLE VILLAGE.',
    action: 'Voir le Village',
    href: '/village',
    icon: 'village',
  },
  {
    id: 'community',
    className: 'experience-community',
    photo: getEventPhoto('crowd'),
    category: 'COMMUNAUTÉ',
    eyebrow: 'UN ÉVÉNEMENT POUR LE PUBLIC',
    title: 'ENSEMBLE,\nÀ DOUALA.',
    action: 'Nous contacter',
    href: '/contact',
    icon: 'community',
  },
  {
    id: 'partners',
    className: 'experience-partners',
    photo: getEventPhoto('teams-together'),
    category: 'PARTENAIRES',
    eyebrow: 'SOUTENIR LE CLASSICO',
    title: 'CONSTRUIRE\nENSEMBLE.',
    action: 'Devenir partenaire',
    href: '/partner',
    icon: 'partners',
  },
]

export const programmePreview = [
  { id: 'match', title: 'Le Classico', description: 'Real Mboa face à Barça Mboa', icon: 'football' },
  { id: 'culture', title: 'Culture & divertissement', description: 'Détails à confirmer par l’organisation', icon: 'culture' },
  { id: 'public', title: 'Expériences pour le public', description: 'Informations à venir', icon: 'community' },
] as const
