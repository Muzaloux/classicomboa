'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'

export function ExperienceCarousel({ slides }: { slides: ReactNode[] }) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(() => slides.length > 1 ? 1 : 0)
  const [playing, setPlaying] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [visible, setVisible] = useState(false)
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const count = slides.length
  const currentIndex = count > 1 ? (active - 1 + count) % count : active
  const loopedSlides = count > 1 ? [slides[count - 1], ...slides, slides[0]] : slides

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    updatePreference()
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const element = carouselRef.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!playing || hovered || focused || reducedMotion || !visible || count < 2) return
    const timer = window.setInterval(() => setActive(current => {
      const currentReal = current === 0 ? count : current === count + 1 ? 1 : current
      return currentReal + 1
    }), 3000)
    return () => window.clearInterval(timer)
  }, [count, focused, hovered, playing, reducedMotion, visible])

  const move = (direction: -1 | 1) => setActive(current => {
    if (count < 2) return 0
    const currentReal = current === 0 ? count : current === count + 1 ? 1 : current
    return currentReal + direction
  })

  return <div
    ref={carouselRef}
    className="experience-carousel"
    role="region"
    aria-roledescription="carousel"
    aria-label="Les expériences du Classico Mboa"
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
    }}
  >
    <div
      className={`experience-carousel-track${transitionEnabled ? '' : ' is-resetting'}`}
      style={{ transform: `translateX(-${active * 100}%)` }}
      onTransitionEnd={event => {
        if (event.target !== event.currentTarget || event.propertyName !== 'transform' || count < 2) return
        if (active !== 0 && active !== count + 1) return
        setTransitionEnabled(false)
        setActive(active === 0 ? count : 1)
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => setTransitionEnabled(true)))
      }}
    >
      {loopedSlides.map((slide, position) => {
        const logicalIndex = count > 1 ? (position - 1 + count) % count : position
        const isActive = position === active
        return <div
          className="experience-carousel-slide"
          key={`experience-slide-${position}`}
          role="group"
          aria-roledescription="slide"
          aria-label={`${logicalIndex + 1} sur ${count}`}
          aria-hidden={!isActive}
          inert={!isActive}
        >{slide}</div>
      })}
    </div>
    <div className="experience-carousel-controls">
      <span className="experience-carousel-count" aria-hidden="true">{String(currentIndex + 1).padStart(2, '0')} <i>/</i> {String(count).padStart(2, '0')}</span>
      <div className="experience-carousel-dots" aria-label="Choisir une expérience">
        {slides.map((_, index) => <button
          className={index === currentIndex ? 'is-active' : ''}
          key={index}
          type="button"
          aria-label={`Afficher la diapositive ${index + 1} sur ${count}`}
          aria-current={index === currentIndex ? 'true' : undefined}
          onClick={() => setActive(count > 1 ? index + 1 : index)}
        />)}
      </div>
      <div className="experience-carousel-actions">
        <button type="button" aria-label="Diapositive précédente" onClick={() => move(-1)}><ArrowLeft size={17} /></button>
        <button type="button" aria-label={playing ? 'Mettre le diaporama en pause' : 'Reprendre le diaporama'} onClick={() => setPlaying(value => !value)}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>
        <button type="button" aria-label="Diapositive suivante" onClick={() => move(1)}><ArrowRight size={17} /></button>
      </div>
    </div>
  </div>
}
