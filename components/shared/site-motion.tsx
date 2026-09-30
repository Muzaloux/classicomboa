'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** Content stays visible without JavaScript or motion. */
export function SiteMotion() {
  const pathname = usePathname()
  useEffect(() => {
    if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const animations = new Set<Animation>()
    const seen = new WeakSet<Element>()
    const selector = '.reveal, .page-hero, .content-section, .content-cta, .experience-card, .info-card, .gallery-photo'
    const observer = new IntersectionObserver((entries) => {
      let stagger = 0
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        observer.unobserve(entry.target)
        if (preference.matches || entry.target.contains(document.activeElement)) continue
        const node = entry.target as HTMLElement
        const delay = Number.parseFloat(getComputedStyle(node).getPropertyValue('--reveal-delay')) || 0
        const animation = node.animate([
          { opacity: 0.25, transform: 'translateY(20px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 620, delay: Math.min(delay + stagger++ * 65, 260), easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' })
        animations.add(animation)
        animation.onfinish = () => animations.delete(animation)
      }
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' })
    const register = () => {
      document.querySelectorAll<HTMLElement>(`main :is(${selector})`).forEach((node) => {
        if (seen.has(node)) return
        seen.add(node)
        if (node.matches('.reveal, .content-section') && node.querySelector('.experience-card, .info-card, .gallery-photo')) return
        observer.observe(node)
      })
    }
    const cancel = () => { for (const animation of animations) animation.cancel(); animations.clear() }
    const onPreference = () => { if (preference.matches) cancel() }
    const onFocus = (event: FocusEvent) => {
      for (const animation of animations) {
        const target = (animation.effect as KeyframeEffect | null)?.target
        if (target instanceof Element && event.target instanceof Node && target.contains(event.target)) {
          animation.cancel()
          animations.delete(animation)
        }
      }
    }
    register()
    // Register content that Next streams after a route change.
    const mutations = new MutationObserver(register)
    mutations.observe(document.body, { childList: true, subtree: true })
    preference.addEventListener('change', onPreference)
    document.addEventListener('focusin', onFocus)
    return () => {
      observer.disconnect()
      mutations.disconnect()
      preference.removeEventListener('change', onPreference)
      document.removeEventListener('focusin', onFocus)
      cancel()
    }
  }, [pathname])
  return <div className="scroll-progress" aria-hidden="true" />
}
