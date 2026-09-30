'use client'
import { useEffect, useRef, useState } from 'react'
import { eventPhotos } from '../../data/event-photos'
import { EventPhoto } from '../shared/event-photo'
const categories = ['Tout', 'Football', 'Équipes', 'Ambiance']
export function EventGallery() {
 const [category, setCategory] = useState('Tout')
 const [selected, setSelected] = useState<number | null>(null)
 const dialog = useRef<HTMLDialogElement>(null)
 const visible = eventPhotos.filter((photo) => category === 'Tout' || photo.category === category)
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
  <div className="event-gallery">{visible.map((item,index) => <figure key={item.id}><button className="gallery-photo" aria-label={'Agrandir : ' + item.caption} onClick={() => setSelected(index)}><EventPhoto photo={item} sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" /><span className="gallery-expand" aria-hidden="true">↗</span></button><figcaption><span className="eyebrow">{item.category}</span><h3>{item.caption}</h3></figcaption></figure>)}</div>
  <dialog ref={dialog} className="photo-dialog" aria-label="Photo agrandie" onClose={() => setSelected(null)} onClick={(event) => { if(event.target === event.currentTarget) close() }} onKeyDown={(event) => { if(event.key === 'ArrowLeft'){event.preventDefault();move(-1)} if(event.key === 'ArrowRight'){event.preventDefault();move(1)} }}>
   {photo && <div className="photo-dialog-content"><button autoFocus className="photo-dialog-close" onClick={close} aria-label="Fermer la photo">Fermer ×</button><div className="photo-dialog-image"><EventPhoto key={photo.id} photo={photo} contain sizes="90vw" /></div><div className="photo-dialog-controls"><button onClick={() => move(-1)} aria-label="Photo précédente">←</button><p>{photo.caption}<small>{(selected ?? 0)+1} / {visible.length}</small></p><button onClick={() => move(1)} aria-label="Photo suivante">→</button></div></div>}
  </dialog>
 </>
}
