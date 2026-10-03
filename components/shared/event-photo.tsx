'use client'
import Image from 'next/image'
import { useState } from 'react'
import type { EventPhotoData } from '../../data/event-photos'

export function EventPhoto({ photo, sizes, preload = false, className = '', contain = false }: { photo: EventPhotoData; sizes: string; preload?: boolean; className?: string; contain?: boolean }) {
 const [failed, setFailed] = useState(false)
 if (failed) return <div className={'event-photo-fallback ' + className} role="img" aria-label={photo.alt}><span>CLASSICO MBOA</span></div>
 const image = <Image className={className} src={photo.src} alt={photo.alt} fill sizes={sizes} preload={preload} placeholder="blur" blurDataURL={photo.blurDataURL} style={{objectFit: contain ? 'contain' : 'cover', objectPosition: contain ? 'center' : photo.position}} onError={() => setFailed(true)} />
 if (!contain) return image
 return <><Image className="event-photo-backdrop" src={photo.src} alt="" aria-hidden fill sizes="25vw" placeholder="blur" blurDataURL={photo.blurDataURL} style={{objectFit: 'cover'}} />{image}</>
}
