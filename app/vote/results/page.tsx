import { PageHero, EmptyState } from '../../../components/shared/page'
import { createAdminSupabase } from '../../../lib/supabase/admin'
import { currentEdition } from '../../../data/current-edition'
import { votingEnabled } from '../../../lib/voting'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Résultats des votes' }
export default async function VoteResults() {
  let rows: { category_id: string; category_name: string; candidate_id: string; candidate_name: string; votes: number }[] = []
  if (votingEnabled()) {
    const { data, error } = await createAdminSupabase().rpc('vote_results', { p_edition: currentEdition.id, p_public_only: true })
    if (error) console.error('vote results unavailable', error.code)
    else rows = data
  }
  const groups = [...new Map(rows.map(r => [r.category_id, r.category_name])).entries()]
  return <main id="main-content" className="page-container">
    <PageHero eyebrow="VOTES & DISTINCTIONS" title="Résultats." description="Les résultats sont publiés par l’organisation, catégorie par catégorie." status={groups.length ? undefined : 'Aucun résultat publié'} />
    {groups.length === 0 && <EmptyState title="Pas encore de résultats" description="Revenez après la clôture des votes." />}
    {groups.map(([id, name]) => <section className="content-section" key={id}><h2>{name}</h2><ol className="results-list">{rows.filter(r => r.category_id === id).slice(0, 10).map(r => <li key={r.candidate_id}><strong>{r.candidate_name}</strong> — {Number(r.votes)} vote(s)</li>)}</ol></section>)}
  </main>
}
