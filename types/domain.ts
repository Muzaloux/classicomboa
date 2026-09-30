export interface EventEdition {
  id: string
  editionNumber: number
  name: string
  slug: string
  eventDate: string
  venue: string
  city: string
  country: string
  timezone: string
  locale: string
  currency: 'XAF'
  status: 'draft' | 'planning' | 'announced' | 'upcoming' | 'sales_open' | 'live' | 'completed' | 'archived' | 'cancelled'
}

export interface Team {
  id: string
  editionId: string
  name: string
  slug: string
  accent: string
  description?: string
  logoUrl?: string
}

export interface Player {
  id: string
  editionId: string
  teamId: string
  name: string
  number?: number
  position?: string
  imageUrl?: string
  public: boolean
}

export interface ProgrammeItem {
  id: string
  editionId: string
  title: string
  description?: string
  startsAt?: string
  location?: string
  category: string
  status: 'draft' | 'published' | 'cancelled'
}

export interface NewsArticle {
  id: string
  editionId?: string
  title: string
  slug: string
  excerpt: string
  publishedAt?: string
  status: 'draft' | 'published' | 'archived'
}

export interface Sponsor {
  id: string
  editionId: string
  name: string
  logoUrl?: string
  website?: string
  visibility: 'private' | 'public'
  status: 'prospect' | 'confirmed' | 'archived'
}

export interface Activity {
  id: string
  editionId: string
  title: string
  description: string
  status: 'planned' | 'confirmed' | 'cancelled'
}

export interface TicketType {
  id: string
  editionId: string
  name: string
  priceXaf: number
  status: 'draft' | 'active' | 'paused' | 'closed' | 'sold_out'
}

export interface VoteCategory {
  id: string
  editionId: string
  name: string
  slug: string
  status: 'draft' | 'active' | 'archived'
}

export interface VoteCandidate {
  id: string
  editionId: string
  categoryId: string
  name: string
  imageUrl?: string
  status: 'draft' | 'active' | 'withdrawn' | 'disqualified'
}

export interface Vendor {
  id: string
  editionId: string
  businessName: string
  categoryId: string
  description: string
  public: boolean
}

export interface Artist {
  id: string
  editionId: string
  name: string
  public: boolean
}

export interface MediaItem {
  id: string
  editionId?: string
  url: string
  alt: string
  type: 'image' | 'video'
  public: boolean
}
