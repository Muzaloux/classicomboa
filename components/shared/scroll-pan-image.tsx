'use client'

import Image, { type StaticImageData } from 'next/image'
import { useEffect, useRef, useState } from 'react'

export function ScrollPanImage({ slides }: { slides: { src: StaticImageData; alt: string }[] }) {
  const image = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setActive(i => (i + 1) % slides.length), 5500)
    return () => window.clearInterval(timer)
  }, [slides.length])

  useEffect(() => {
    const node = image.current
    const hero = node?.closest('.hero')
    if (!node || !(hero instanceof HTMLElement)) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const update = () => {
      if (reducedMotion.matches) {
        node.querySelectorAll('img').forEach(img => { img.style.objectPosition = '50% 50%' })
        return
      }
      const bounds = hero.getBoundingClientRect()
      const travel = Math.max(hero.offsetHeight - window.innerHeight, window.innerHeight * 0.35)
      const progress = Math.min(1, Math.max(0, -bounds.top / travel))
      const horizontalPosition = 24 + progress * 52
      node.querySelectorAll('img').forEach(img => { img.style.objectPosition = `${horizontalPosition}% 50%` })
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

  return <div ref={image} className="hero-slides">{slides.map((slide, index) => <Image key={index} className={index === active ? 'hero-slide is-active' : 'hero-slide'} src={slide.src} alt={slide.alt} fill sizes="100vw" preload={index === 0} placeholder="blur" aria-hidden={index === active ? undefined : true} style={{ objectFit: 'cover', objectPosition: '24% 50%' }} />)}</div>
}
