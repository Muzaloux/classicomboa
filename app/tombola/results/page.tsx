import { PageHero, EmptyState } from '../../../components/shared/page'
import { createAdminSupabase } from '../../../lib/supabase/admin'
import { currentEdition } from '../../../data/current-edition'
import { tombolaEnabled } from '../../../lib/tombola'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Gagnants de la tombola' }
export default async function TombolaResults() {
  let rows: { draw_name: string; prize: string; rank: number; entry_number: number; winner: string }[] = []
  if (tombolaEnabled()) {
    const { data, error } = await createAdminSupabase().rpc('tombola_winners_public', { p_edition: currentEdition.id })
    if (error) console.error('tombola results unavailable', error.code)
    else rows = data
  }
  const draws = [...new Set(rows.map(r => r.draw_name))]
  return <main id="main-content" className="page-container">
    <PageHero eyebrow="TOMBOLA" title="Les gagnants." description="Le tirage est réalisé par le système parmi les numéros payés. Chaque personne ne peut gagner qu’une fois par tirage. Vérifiez votre numéro sur la page de votre commande." status={draws.length ? undefined : 'Aucun tirage publié'} />
    {draws.length === 0 && <EmptyState title="Pas encore de gagnants" description="Revenez après le tirage." />}
    {draws.map(name => <section className="content-section" key={name}><h2>{name}</h2><ol className="results-list">{rows.filter(r => r.draw_name === name).map(r => <li key={r.rank}><strong>N° {r.entry_number}</strong> — {r.winner} · {r.prize}</li>)}</ol></section>)}
  </main>
}
