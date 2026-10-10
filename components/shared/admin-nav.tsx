import Link from 'next/link'
import { currentEdition } from '../../data/current-edition'
import { getRoleAccess, getStaffAccess } from '../../lib/auth'

export async function AdminNav() {
  const manager = await getRoleAccess(currentEdition.id, ['admin', 'manager'])
  const canManageInquiries = manager ? true : Boolean(await getStaffAccess(currentEdition.id))
  const canCheckIn = Boolean(await getRoleAccess(currentEdition.id, ['checkin']))
  return <nav className="admin-command-nav no-print" aria-label="Navigation de l’administration">
    {manager && <><Link href="/admin">Vue d’ensemble</Link><Link href="/admin/tickets">Billetterie</Link><Link href="/admin/votes">Votes</Link><Link href="/admin/tombola">Tombola</Link><Link href="/admin/players">Joueurs</Link><Link href="/admin/quiz">Quiz quotidien</Link></>}
    {canManageInquiries && <Link href="/admin/demandes">Demandes</Link>}
    {canCheckIn && <Link href="/admin/check-in">Contrôle d’accès</Link>}
    <Link href="/admin/security">Sécurité du compte</Link>
  </nav>
}
