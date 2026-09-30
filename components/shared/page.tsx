import Link from 'next/link'
import type { ReactNode } from 'react'

export function PageHero({ eyebrow, title, description, status }: { eyebrow: string; title: string; description: string; status?: string }) {
  return <header className="page-hero"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p>{status && <span className="public-page-status">{status}</span>}</header>
}
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="content-section"><h2>{title}</h2>{children}</section>
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><span className="eyebrow">À SUIVRE</span><h3>{title}</h3><p>{description}</p></div>
}
export function InfoCards({ items }: { items: { title: string; description: string }[] }) {
  return <div className="info-grid">{items.map((item, index) => <article className="info-card" key={item.title}><span className="eyebrow">{String(index + 1).padStart(2, '0')}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
}
export function CTASection({ title, description, href, label }: { title: string; description: string; href: string; label: string }) {
  return <section className="content-cta"><div><h2>{title}</h2><p>{description}</p></div><Link className="button button-primary" href={href}>{label} →</Link></section>
}
