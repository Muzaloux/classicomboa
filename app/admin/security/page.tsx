import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRoleAccess } from '../../../lib/auth'
import { currentEdition } from '../../../data/current-edition'
import { PageHero } from '../../../components/shared/page'
import { PasswordForm } from '../../../components/forms/password-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Sécurité organisateur', robots: { index: false, follow: false } }
export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ recovery?: string }> }) {
  const { recovery } = await searchParams
  const identity = await getRoleAccess(currentEdition.id, ['admin', 'manager', 'support', 'checkin', 'editor'])
  if (!identity) redirect('/auth/sign-in?error=access')
  return <main id="main-content" className="page-container">
    <PageHero eyebrow="ORGANISATION · SÉCURITÉ" title={recovery === '1' ? 'Nouveau mot de passe.' : 'Votre mot de passe.'} description={recovery === '1' ? 'Choisissez un nouveau mot de passe sécurisé pour votre compte organisateur.' : 'Définissez ou modifiez votre mot de passe personnel. En cas d’oubli, demandez un lien de réinitialisation depuis la page de connexion.'} />
    <Link className="text-link" href="/admin">← Retour à l’espace organisateur</Link>
    <PasswordForm />
  </main>
}
