import { ArrowUpRight, Instagram, Mail, MessageCircle, Music2 } from 'lucide-react'

const contacts = [
  { name: 'E-mail', detail: 'info@classicomboa.com', href: 'mailto:info@classicomboa.com', icon: Mail },
  { name: 'Manoel · WhatsApp', detail: '+237 658 846 124', href: 'https://wa.me/237658846124', icon: MessageCircle },
  { name: 'Youana · WhatsApp', detail: '+237 699 051 046', href: 'https://wa.me/237699051046', icon: MessageCircle },
  { name: 'Instagram', detail: '@el_classico237', href: 'https://www.instagram.com/el_classico237?utm_source=qr&stkn=Ynk1cG9mazl5azUx', icon: Instagram },
  { name: 'TikTok', detail: 'Classico Mboa', href: 'https://vm.tiktok.com/ZSqJo89mk/', icon: Music2 },
] as const

export function ContactLinks({ includeSocials = true, compact = false }: { includeSocials?: boolean; compact?: boolean }) {
  const visibleContacts = includeSocials ? contacts : contacts.filter(({ name }) => name === 'E-mail' || name.endsWith('WhatsApp'))
  return <div className={`contact-links${compact ? ' contact-links-compact' : ''}`}>
    {visibleContacts.map(({ name, detail, href, icon: Icon }) => <a className="contact-link" key={href} href={href}>
      <Icon size={22} aria-hidden="true" />
      <span><strong>{name}</strong><span>{detail}</span></span>
      <ArrowUpRight size={17} aria-hidden="true" />
    </a>)}
  </div>
}
