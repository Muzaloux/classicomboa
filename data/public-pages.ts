export interface PublicPageCopy {
  path: string
  eyebrow: string
  title: string
  description: string
  status: string
  facts?: string[]
  sections?: { title: string; description: string }[]
  links?: { label: string; href: string }[]
  kind?: 'teams'
}

export const publicPages: PublicPageCopy[] = [
  { path: '/legal', eyebrow: 'INFORMATIONS LÉGALES', title: 'Mentions légales.', description: 'Les informations sur l’éditeur, l’hébergement et les contacts officiels seront publiées avant l’ouverture des services.', status: 'Informations en préparation' },
  { path: '/privacy', eyebrow: 'VIE PRIVÉE', title: 'Vos données.', description: 'La politique de confidentialité détaillera les finalités, la conservation et vos droits avant l’ouverture des formulaires et services transactionnels.', status: 'Politique en préparation' },
  {
    path: '/classico',
    eyebrow: 'CLASSICO MBOA',
    title: 'Plus qu’un match.',
    description:
      'Classico Mboa rassemble football, culture, gaming et communauté autour du Classico version Mboa.',
    status: 'Découvrir le projet',
    sections: [
      {
        title: 'Le football au centre',
        description: 'Real Mboa face à Barça Mboa, dans une rivalité réinventée.',
      },
      {
        title: 'Une expérience collective',
        description:
          'Culture, gaming, divertissement et participation du public font partie de l’univers Classico Mboa.',
      },
    ],
    links: [
      { label: 'Voir les équipes', href: '/teams' },
      { label: 'Découvrir le programme', href: '/programme' },
    ],
  },
  {
    path: '/edition/8',
    eyebrow: '8E ÉDITION',
    title: 'Le rendez-vous de Douala.',
    description:
      'Le 19 décembre 2026 à Omnisports Bépanda. Les informations officielles seront publiées ici.',
    status: 'Édition à venir',
    facts: ['19 décembre 2026', 'Omnisports Bépanda', 'Douala, Cameroun'],
    links: [
      { label: 'Programme', href: '/programme' },
      { label: 'Billetterie', href: '/tickets' },
      { label: 'Classico FIFA Cup', href: '/fifa-cup' },
    ],
  },
  {
    path: '/teams',
    eyebrow: 'LES ÉQUIPES',
    title: 'Real Mboa face à Barça Mboa.',
    description:
      'Les équipes de la 8e édition. Les effectifs seront publiés après confirmation par l’organisation.',
    status: 'Effectifs à venir',
    kind: 'teams',
  },
  {
    path: '/players',
    eyebrow: 'LES JOUEURS',
    title: 'Les visages du Classico.',
    description:
      'Les profils des joueurs seront affichés lorsque les effectifs officiels seront confirmés.',
    status: 'Profils à venir',
    sections: [
      {
        title: 'Effectifs en préparation',
        description:
          'Les noms, numéros et profils seront ajoutés après validation des équipes.',
      },
    ],
  },
  {
    path: '/programme',
    eyebrow: 'LE 12 DÉCEMBRE',
    title: 'Le programme.',
    description:
      'Les activités et horaires détaillés seront publiés dès leur confirmation par l’organisation.',
    status: 'Programme à venir',
    sections: [
      {
        title: 'Horaires non publiés',
        description:
          'Aucune heure de passage n’est confirmée. Le programme officiel sera mis à jour ici.',
      },
    ],
  },
  {
    path: '/tickets',
    eyebrow: 'BILLETTERIE',
    title: 'Les billets arrivent.',
    description:
      'Les catégories, tarifs et modalités de vente seront communiqués officiellement avant l’ouverture des ventes.',
    status: 'Ventes non ouvertes',
    links: [{ label: 'Découvrir la 8e édition', href: '/edition/8' }],
  },
  {
    path: '/vote',
    eyebrow: 'VOTES & DISTINCTIONS',
    title: 'La parole au public.',
    description:
      'Les campagnes, catégories et dates de vote seront annoncées ici. Aucun vote n’est ouvert pour le moment.',
    status: 'Campagnes à venir',
    links: [{ label: 'Voir les équipes', href: '/teams' }],
  },
  {
    path: '/tombola',
    eyebrow: 'TOMBOLA',
    title: 'Informations à venir.',
    description:
      'Les modalités de participation, les lots confirmés et la date du tirage seront publiés par l’organisation.',
    status: 'Participation non ouverte',
  },
  {
    path: '/fifa-cup',
    eyebrow: 'CLASSICO FIFA CUP',
    title: 'Le tournoi gaming.',
    description:
      'Le jeu, le format, les inscriptions et les règles seront communiqués dès leur confirmation.',
    status: 'Informations à venir',
    links: [
      { label: 'Consulter les règles', href: '/fifa-cup/rules' },
      { label: 'Voir le tableau', href: '/fifa-cup/bracket' },
    ],
  },
  {
    path: '/village',
    eyebrow: 'CLASSICO VILLAGE',
    title: 'Le village de l’événement.',
    description:
      'Découvrez les exposants et activités du Village lorsque les candidatures et sélections seront finalisées.',
    status: 'Ouverture à annoncer',
    links: [{ label: 'Informations exposants', href: '/stands' }],
  },
  {
    path: '/sponsors',
    eyebrow: 'PARTENAIRES',
    title: 'Ils accompagnent le Classico.',
    description:
      'Les partenaires seront présentés ici après confirmation et validation de leur visibilité publique.',
    status: 'Partenaires à annoncer',
    links: [{ label: 'Proposer un partenariat', href: '/partner' }],
  },
  {
    path: '/news',
    eyebrow: 'ACTUALITÉS',
    title: 'Les nouvelles du Classico.',
    description:
      'Retrouvez les annonces et contenus officiels de Classico Mboa.',
    status: 'Actualités à venir',
  },
  {
    path: '/gallery',
    eyebrow: 'GALERIE',
    title: 'En images.',
    description:
      'Retrouvez le football, les équipes et l’ambiance du Classico à travers une sélection de photos de nos archives.',
    status: 'Les archives en images',
  },
  {
    path: '/contact',
    eyebrow: 'CONTACT',
    title: 'Restons en contact.',
    description:
      'Une question sur le Classico Mboa ? Contactez l’organisation par e-mail ou sur WhatsApp.',
    status: 'E-mail & WhatsApp',
    links: [
      { label: 'Partenariats', href: '/partner' },
      { label: 'Exposer au Village', href: '/stands' },
    ],
  },
  {
    path: '/partner',
    eyebrow: 'PARTENARIATS',
    title: 'Associez votre organisation au Classico.',
    description:
      'Les informations de partenariat sont disponibles auprès de l’organisation. Les offres ne sont pas encore publiées.',
    status: 'Dossier à venir',
  },
  {
    path: '/stands',
    eyebrow: 'EXPOSANTS',
    title: 'Devenez exposant au Village.',
    description:
      'Les candidatures, catégories et offres de stands seront annoncées lorsque les modalités seront définies.',
    status: 'Candidatures non ouvertes',
    sections: [
      {
        title: 'Candidatures à venir',
        description:
          'Les catégories, packages et conditions seront publiés avant l’ouverture du formulaire.',
      },
    ],
  },
  {
    path: '/fifa-cup/bracket',
    eyebrow: 'CLASSICO FIFA CUP',
    title: 'Tableau du tournoi.',
    description: 'Le tableau sera publié après validation des participants et du format.',
    status: 'Tableau non généré',
  },
  {
    path: '/fifa-cup/rules',
    eyebrow: 'CLASSICO FIFA CUP',
    title: 'Règlement.',
    description: 'Les règles officielles seront publiées avant l’ouverture des inscriptions.',
    status: 'Règlement à venir',
  },
  {
    path: '/fifa-cup/live',
    eyebrow: 'CLASSICO FIFA CUP',
    title: 'Suivi du tournoi.',
    description: 'Aucun match n’est actuellement programmé ou en cours.',
    status: 'Tournoi non démarré',
  },
  {
    path: '/fifa-cup/players',
    eyebrow: 'CLASSICO FIFA CUP',
    title: 'Participants.',
    description: 'La liste des participants sera publiée après confirmation des inscriptions.',
    status: 'Participants à venir',
  },
  {
    path: '/fifa-cup/display',
    eyebrow: 'CLASSICO FIFA CUP',
    title: 'Affichage du tournoi.',
    description: 'Les informations du tournoi apparaîtront ici lorsqu’il sera configuré.',
    status: 'Affichage non actif',
  },
  {
    path: '/vote/results',
    eyebrow: 'VOTES & DISTINCTIONS',
    title: 'Résultats.',
    description: 'Les résultats seront publiés conformément aux règles des campagnes officielles.',
    status: 'Aucun résultat publié',
  },
  {
    path: '/tickets/checkout',
    eyebrow: 'BILLETTERIE',
    title: 'Aucune vente en cours.',
    description: 'Le paiement sera disponible lorsque la billetterie officielle ouvrira.',
    status: 'Paiement indisponible',
  },
]
