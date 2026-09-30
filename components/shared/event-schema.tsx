import type { EventEdition } from '../../types/domain'

export function EventSchema({ edition }: { edition: EventEdition }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const schema = {
    '@context': 'https://schema.org', '@type': 'SportsEvent', name: edition.name,
    startDate: edition.eventDate,
    ...(siteUrl ? { url: `${siteUrl.replace(/\/$/, '')}/edition/${edition.slug}` } : {}),
    location: { '@type': 'Place', name: edition.venue, address: { '@type': 'PostalAddress', addressLocality: edition.city, addressCountry: 'CM' } },
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
}
