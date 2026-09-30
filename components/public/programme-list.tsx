'use client'
import { useState } from 'react'
import type { ProgrammeItem } from '../../types/domain'
import { EmptyState } from '../shared/page'

export function ProgrammeList({ items }: { items: ProgrammeItem[] }) {
  const [category, setCategory] = useState('Tout')
  const categories = ['Tout', ...new Set(items.map((item) => item.category))]
  const visible = items.filter((item) => category === 'Tout' || item.category === category)
  return <><div className="filter-bar" aria-label="Filtrer le programme">{categories.map((name) => <button key={name} aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>)}</div><p className="muted">Aperçu prévisionnel : ordre et horaires à confirmer.</p><ol className="programme-timeline">{visible.map((item) => <li key={item.id}><span className="timeline-time">Horaire<br />à confirmer</span><div><span className="eyebrow">{item.category}</span><h3>{item.title}</h3><p>{item.description}</p>{item.location && <p>{item.location}</p>}</div></li>)}</ol>{visible.length === 0 && <EmptyState title="Aucune activité publiée" description="Le programme sera actualisé après validation." />}</>
}
