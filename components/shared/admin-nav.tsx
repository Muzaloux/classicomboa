import Link from 'next/link'
export function AdminNav() {
  return <nav className="account-actions no-print" aria-label="Outils organisateur"><Link href="/admin">Demandes</Link><Link href="/admin/tickets">Billetterie</Link><Link href="/admin/votes">Votes</Link><Link href="/admin/tombola">Tombola</Link><Link href="/admin/players">Joueurs</Link><Link href="/admin/check-in">Contrôle des billets</Link><Link href="/admin/security">Mon mot de passe</Link></nav>
}
