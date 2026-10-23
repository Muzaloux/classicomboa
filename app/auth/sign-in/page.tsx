import type { Metadata } from 'next'
import { AuthForm } from '../../../components/forms/auth-form'
import { PageHero } from '../../../components/shared/page'
import { supabaseConfig } from '../../../lib/supabase/config'

export const metadata: Metadata = { title: 'Connexion', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return <main id="main-content" className="page-container"><PageHero eyebrow="ORGANISATION" title="Accès organisateur." description="Connectez-vous avec votre adresse e-mail et votre mot de passe. Première connexion ? Recevez un code e-mail, puis définissez votre mot de passe dans la sécurité du compte." />
    {error && <p className="form-feedback error" role="alert">{error === 'access' ? 'Cet accès est réservé aux organisateurs autorisés pour cette édition.' : 'Lien de confirmation invalide ou expiré. Réessayez la connexion ou demandez un nouveau code.'}</p>}
    <AuthForm enabled={Boolean(supabaseConfig())} />
  </main>
}
