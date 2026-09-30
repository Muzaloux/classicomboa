'use client'

import Image, { type StaticImageData } from 'next/image'
import { useEffect, useRef } from 'react'

export function ScrollPanImage({ src, alt }: { src: StaticImageData; alt: string }) {
  const image = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const node = image.current
    const hero = node?.closest('.hero')
    if (!node || !(hero instanceof HTMLElement)) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const update = () => {
      if (reducedMotion.matches) {
        node.style.objectPosition = '50% 50%'
        return
      }
      const bounds = hero.getBoundingClientRect()
      const travel = Math.max(hero.offsetHeight - window.innerHeight, window.innerHeight * 0.35)
      const progress = Math.min(1, Math.max(0, -bounds.top / travel))
      const horizontalPosition = 24 + progress * 52
      node.style.objectPosition = `${horizontalPosition}% 50%`
    }
    const onScroll = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(update)
    }
    const onPreferenceChange = () => update()

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    reducedMotion.addEventListener('change', onPreferenceChange)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      reducedMotion.removeEventListener('change', onPreferenceChange)
    }
  }, [])

  return <Image ref={image} src={src} alt={alt} fill sizes="100vw" preload placeholder="blur" style={{ objectFit: 'cover', objectPosition: '24% 50%' }} />
}
