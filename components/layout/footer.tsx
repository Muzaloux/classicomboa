import Link from 'next/link'
import { currentEdition } from '../../data/current-edition'
import { formatEventDate } from '../../lib/formatting'
import { ContactLinks } from '../shared/contact-links'
import { BrandLogo } from '../shared/brand-logo'
import { CameroonFlag } from '../shared/cameroon-flag'

export function Footer() {
  return <>
    <footer className="site-footer"><div className="footer-main"><Link className="brand" href="/" aria-label="Accueil Classico Mboa"><BrandLogo /></Link><p>Le football est universel.<br />L’émotion est Mboa.</p><nav className="footer-links" aria-label="Liens utiles">{[['/players', 'Joueurs'], ['/village', 'Village'], ['/stands', 'Exposants'], ['/partner', 'Partenariats'], ['/news', 'Actualités'], ['/gallery', 'Galerie'], ['/contact', 'Contact'], ['/legal', 'Mentions légales'], ['/privacy', 'Confidentialité']].map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</nav></div><section className="footer-contact" aria-labelledby="footer-contact-title"><h2 id="footer-contact-title">Contactez-nous</h2><ContactLinks /></section><div className="footer-bottom"><span>© CLASSICO MBOA</span><span><CameroonFlag /> {currentEdition.city}, {currentEdition.country}</span><Link href={`/edition/${currentEdition.slug}`}>{formatEventDate(currentEdition.eventDate)}</Link></div></footer>
  </>
}
