import { currentEdition } from './current-edition'
import type { EventEdition } from '../types/domain'

export const editions: EventEdition[] = [currentEdition]
export function getPublicEdition(slug: string) {
  return editions.find((edition) => edition.slug === slug && !['draft', 'planning'].includes(edition.status))
}
