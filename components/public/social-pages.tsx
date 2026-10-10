import { ArrowUpRight, Handshake } from 'lucide-react'
import Link from 'next/link'

function PlatformLogo({ platform }: { platform: 'instagram' | 'tiktok' | 'whatsapp' }) {
  if (platform === 'instagram') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="platform-logo-dot" cx="17.5" cy="6.8" r="1" /></svg>
  if (platform === 'tiktok') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.6 3c.3 2.3 1.6 3.8 4.4 4v3.4a8.7 8.7 0 0 1-4.4-1.3v6.6a6.2 6.2 0 1 1-6.2-6.2c.4 0 .8 0 1.2.1V13a2.8 2.8 0 1 0 1.7 2.6V3h3.3Z" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a9.8 9.8 0 0 0-8.4 14.9L2.3 22l5.3-1.4A10 10 0 1 0 12 2Zm0 17.9a8 8 0 0 1-4.1-1.1l-.3-.2-3.1.8.8-3-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8.9-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4c0-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.4c.1.2 1.6 2.4 3.8 3.4.5.2.9.4 1.2.5.5.2 1 .2 1.3.1.4-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1 0-.1-.2-.2-.4-.3Z" /></svg>
}

const pages: { group: string; name: string; handle: string; href: string; description: string; platform: 'instagram' | 'tiktok' | 'whatsapp'; color: string; contacts?: string[] }[] = [
  { group: 'CLASSICO MBOA', name: 'Instagram', handle: '@el_classico237', href: 'https://www.instagram.com/el_classico237?utm_source=qr&stkn=Ynk1cG9mazl5azUx', description: 'Les annonces, les images et toute l’énergie du Classico.', platform: 'instagram' as const, color: 'instagram' },
  { group: 'CLASSICO MBOA', name: 'TikTok', handle: 'Classico Mboa', href: 'https://vm.tiktok.com/ZSqJo89mk/', description: 'Les moments forts et les coulisses en vidéo.', platform: 'tiktok' as const, color: 'tiktok' },
  { group: 'LA COMMUNAUTÉ', name: 'Groupe WhatsApp officiel', handle: 'Rejoindre le groupe principal', href: 'https://chat.whatsapp.com/DDxxaFkKmHQESyVQW96W9i', description: 'Rejoignez les supporters et recevez les nouvelles directement dans WhatsApp.', platform: 'whatsapp' as const, color: 'whatsapp' },
  { group: 'INVITÉE', name: 'Pris K · TikTok', handle: '@priskeventsgrill20', href: 'https://www.tiktok.com/@priskeventsgrill20?_r=1&_t=ZS-9AJFCQ0sjaP', description: 'Suivez Pris K sur TikTok et découvrez ses contenus.', platform: 'tiktok', color: 'tiktok', contacts: ['+237 697 599 555', '+237 679 227 804'] },
]

export function SocialPages() {
  return <section className="social-pages-section" aria-labelledby="social-pages-title">
    <div className="social-pages-heading"><div><span className="eyebrow">RESTONS CONNECTÉS</span><h2 id="social-pages-title">Suivez le Classico Mboa</h2></div><p className="muted">Retrouvez nos actualités, nos vidéos et la communauté sur vos plateformes préférées.</p></div>
    <div className="social-pages-grid">{pages.map(({ group, name, handle, href, description, platform, color, contacts }) => <article className={`social-page-card social-${color}`} key={href}>
      <a className="social-page-main-link" href={href} target="_blank" rel="noreferrer"><span className="social-page-icon"><PlatformLogo platform={platform} /></span><span className="social-page-copy"><span className="social-page-group">{group}</span><strong>{name}</strong><span className="social-page-handle">{handle}</span><span className="social-page-description">{description}</span></span><span className="social-page-action">Suivre <ArrowUpRight size={17} aria-hidden="true" /></span></a>
      {contacts && <div className="social-page-contacts"><span>Contacter Pris K sur WhatsApp</span>{contacts.map((phone) => <a href={`https://wa.me/${phone.replace(/\D/g, '')}`} key={phone} target="_blank" rel="noreferrer">{phone}</a>)}</div>}
    </article>)}</div>
    <section className="social-sponsors" aria-labelledby="social-sponsors-title"><span className="social-sponsors-icon"><Handshake size={24} aria-hidden="true" /></span><div><span className="eyebrow">ILS FONT PARTIE DE L’AVENTURE</span><h3 id="social-sponsors-title">Suivez aussi nos partenaires.</h3><p className="muted">Découvrez les marques qui accompagnent le Classico Mboa et retrouvez leurs pages depuis notre espace partenaires.</p></div><Link className="button button-outline" href="/sponsors">Voir nos partenaires <ArrowUpRight size={17} /></Link></section>
    <p className="social-pages-note">Les pages des sponsors seront ajoutées ici au fur et à mesure de leur confirmation.</p>
  </section>
}
