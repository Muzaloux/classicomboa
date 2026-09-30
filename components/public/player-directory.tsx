'use client'
import { useState } from 'react'
import type { Player, Team } from '../../types/domain'
import { EmptyState } from '../shared/page'

export function PlayerDirectory({ players, teams }: { players: Player[]; teams: Team[] }) {
  const [teamId, setTeamId] = useState('all')
  const visible = players.filter((player) => player.public && (teamId === 'all' || player.teamId === teamId))
  return <><div className="filter-bar" aria-label="Filtrer les joueurs par équipe">{[{ id: 'all', name: 'Tous les joueurs' }, ...teams].map((team) => <button key={team.id} aria-pressed={teamId === team.id} onClick={() => setTeamId(team.id)}>{team.name}</button>)}</div><div aria-live="polite">{visible.length ? <div className="info-grid">{visible.map((player) => <article className="info-card" key={player.id}><span className="eyebrow">{teams.find((team) => team.id === player.teamId)?.name}</span><h3>{player.name}</h3><p>{player.position || 'Poste à confirmer'}{player.number !== undefined && ` · N° ${player.number}`}</p></article>)}</div> : <EmptyState title="Effectif à annoncer" description={teamId === 'all' ? 'Les profils seront publiés après confirmation des équipes.' : `Les joueurs de ${teams.find((team) => team.id === teamId)?.name} seront présentés ici après confirmation.`} />}</div></>
}
