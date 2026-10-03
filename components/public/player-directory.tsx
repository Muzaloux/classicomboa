'use client'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { UserRound } from 'lucide-react'
import type { Player, Team } from '../../types/domain'
import { EmptyState } from '../shared/page'

export function PlayerCard({ player, team }: { player: Player; team?: Team }) {
  return <article className="info-card player-card" style={{ '--player-accent': team?.accent ?? 'var(--green)' } as CSSProperties}>
    <span className="player-avatar" role="img" aria-label={`Photo de ${player.name} à venir`}><UserRound size={30} strokeWidth={1.5} aria-hidden="true" /></span>
    <div className="player-card-copy">
      <span className="eyebrow">{team?.name ?? 'Classico Mboa'}</span>
      <h3>{player.name}</h3>
      <p>{player.position || 'Poste à confirmer'}{player.number !== undefined && ` · N° ${player.number}`}</p>
    </div>
  </article>
}

export function PlayerDirectory({ players, teams }: { players: Player[]; teams: Team[] }) {
  const [teamId, setTeamId] = useState('all')
  const visible = players.filter((player) => player.public && (teamId === 'all' || player.teamId === teamId))
  const selectedTeam = teams.find((team) => team.id === teamId)
  return <><div className="filter-bar" aria-label="Filtrer les joueurs par équipe">{[{ id: 'all', name: 'Tous les joueurs' }, ...teams].map((team) => <button key={team.id} aria-pressed={teamId === team.id} onClick={() => setTeamId(team.id)}>{team.name}</button>)}</div><div aria-live="polite">{visible.length ? <div className="player-grid">{visible.map((player) => <PlayerCard key={player.id} player={player} team={teams.find((team) => team.id === player.teamId)} />)}</div> : <EmptyState title="Effectif à annoncer" description={teamId === 'all' ? 'Les profils seront publiés après confirmation des équipes.' : `Les joueurs de ${selectedTeam?.name ?? 'cette équipe'} seront présentés ici après confirmation.`} />}</div></>
}
