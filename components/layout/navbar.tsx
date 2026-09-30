'use client'

import Link from 'next/link'
import { BrandLogo } from '../shared/brand-logo'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Gamepad2, Handshake, House, Menu, Ticket, Trophy, Users, Vote, X } from 'lucide-react'

const links = [['/classico', 'Le Classico'], ['/teams', 'Équipes'], ['/programme', 'Programme'], ['/vote', 'Vote'], ['/fifa-cup', 'FIFA Cup'], ['/sponsors', 'Partenaires']] as const
const linkIcons = [Trophy, Users, CalendarDays, Vote, Gamepad2, Handshake]
const mobileLinks = [
  { href: '/', title: 'Accueil', icon: House },
  { href: '/tickets', title: 'Billets', icon: Ticket },
  { href: '/programme', title: 'Programme', icon: CalendarDays },
  { href: '/vote', title: 'Vote', icon: Vote },
] as const

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
  return <><header className={`site-header ${pathname !== '/' || scrolled ? 'is-solid' : ''}`} onKeyDown={(event) => { if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus() } }}>
    <Link className="brand" href="/" aria-label="Accueil Classico Mboa" onClick={() => setOpen(false)}><BrandLogo /></Link>
    <button ref={toggle} className="menu-toggle icon-button" aria-expanded={open} aria-controls="main-navigation" aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
    <nav id="main-navigation" className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Navigation principale" onBlur={(event) => { if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) setOpen(false) }}>{links.map(([href, title], index) => {
      const Icon = linkIcons[index]
      return <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} onClick={() => setOpen(false)}><Icon size={16} aria-hidden="true" /><span>{title}</span></Link>
    })}</nav>
    <Link className="header-ticket" href="/tickets" onClick={() => setOpen(false)}><Ticket size={15} /> Billetterie</Link>
  </header>
    <nav className="mobile-bottom-nav" aria-label="Accès rapides">
      {mobileLinks.map(({ href, title, icon: Icon }) => <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} onClick={() => setOpen(false)}><Icon size={21} strokeWidth={1.8} aria-hidden="true" /><span>{title}</span></Link>)}
    </nav>
  </>
}
