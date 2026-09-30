import type { MetadataRoute } from 'next'
import { publicPages } from '../data/public-pages'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) return []

  const baseUrl = siteUrl.replace(/\/$/, '')
  const routes = ['/', ...publicPages.map(({ path }) => path)]

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }))
}