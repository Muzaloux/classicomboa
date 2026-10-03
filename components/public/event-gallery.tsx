'use client'
import { useEffect, useRef, useState } from 'react'
import { eventPhotos } from '../../data/event-photos'
import { additionalEventPhotos } from '../../data/additional-event-photos'
import { EventPhoto } from '../shared/event-photo'
import { photoRatio } from '../../lib/photo-ratio'
const categories = ['Tout', 'Sélection archives', 'Football', 'Équipes', 'Ambiance', 'Célébrations']
const allPhotos = [...additionalEventPhotos, ...eventPhotos]
const archiveIds = new Set(additionalEventPhotos.map((photo) => photo.id))
export function EventGallery() {
 const [category, setCategory] = useState('Tout')
 const [selected, setSelected] = useState<number | null>(null)
 const dialog = useRef<HTMLDialogElement>(null)
 const touchStart = useRef<{ x: number; y: number } | null>(null)
 const visible = allPhotos.filter((photo) => category === 'Tout' || (category === 'Sélection archives' ? archiveIds.has(photo.id) : photo.category === category))
 const photo = selected === null ? null : visible[selected]
 useEffect(() => {
  if (selected === null) return
  const previous = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.current?.showModal()
  return () => { document.body.style.overflow = previous }
 }, [selected])
 function close() { dialog.current?.close(); setSelected(null) }
 function move(direction: number) { setSelected((index) => index === null ? null : (index + direction + visible.length) % visible.length) }
 return <>
  <div className="filter-bar" aria-label="Filtrer les photos">{categories.map((name) => <button key={name} aria-pressed={category === name} onClick={() => { close(); setCategory(name) }}>{name}</button>)}</div>
  <p className="muted" aria-live="polite">{visible.length} photos · Sélectionnez une image pour l’agrandir.</p>
  <div className="event-gallery">{visible.map((item,index) => <figure key={item.id}><button className="gallery-photo" style={photoRatio(item)} aria-label={'Agrandir : ' + item.caption} onClick={() => setSelected(index)}><EventPhoto photo={item} sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" /><span className="gallery-expand" aria-hidden="true">↗</span></button><figcaption><span className="eyebrow">{item.category}</span><h3>{item.caption}</h3></figcaption></figure>)}</div>
  <dialog ref={dialog} className="photo-dialog" aria-label="Photo agrandie" onClose={() => setSelected(null)} onClick={(event) => { if(event.target === event.currentTarget) close() }} onKeyDown={(event) => { if(event.key === 'ArrowLeft'){event.preventDefault();move(-1)} if(event.key === 'ArrowRight'){event.preventDefault();move(1)} }}>
   {photo && <div className="photo-dialog-content"><button autoFocus className="photo-dialog-close" onClick={close} aria-label="Fermer la photo">Fermer ×</button><div className="photo-dialog-image" onTouchStart={(event) => { const touch = event.touches[0]; touchStart.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null }} onTouchEnd={(event) => { const start = touchStart.current; touchStart.current = null; const end = event.changedTouches[0]; if (start && Math.abs(end.clientX - start.x) > 60 && Math.abs(end.clientY - start.y) < 50) move(end.clientX < start.x ? 1 : -1) }}><EventPhoto key={photo.id} photo={photo} contain sizes="90vw" /></div><div className="photo-dialog-controls"><button onClick={() => move(-1)} aria-label="Photo précédente">←</button><p aria-live="polite">{photo.caption}<small>{(selected ?? 0)+1} / {visible.length}</small></p><button onClick={() => move(1)} aria-label="Photo suivante">→</button></div></div>}
  </dialog>
 </>
}
