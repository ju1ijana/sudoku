import { MAX_MISTAKES } from '../game/types'
import type { Player } from '../multiplayer/players'

export interface Racer {
  player: Player
  isMe: boolean
  solved: number
  total: number
  mistakes: number
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      <path d="M3 1.5v13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M3.7 2h10v7h-10z" fill="#fff" stroke="currentColor" strokeWidth="1" />
      <path
        d="M3.7 2h2.5v2.33H3.7zM8.7 2h2.5v2.33H8.7zM6.2 4.33h2.5v2.34H6.2zM11.2 4.33h2.5v2.34h-2.5zM3.7 6.67h2.5V9H3.7zM8.7 6.67h2.5V9H8.7z"
        fill="currentColor"
      />
    </svg>
  )
}

export function RaceTrack({ racers }: { racers: Racer[] }) {
  return (
    <div className="race" aria-label="Race progress">
      {racers.map(({ player, isMe, solved, total, mistakes }) => {
        const pct = total === 0 ? 0 : (solved / total) * 100
        return (
          <div className="race-row" key={isMe ? 'me' : 'opponent'}>
            <span className="race-name" title={player.name}>
              {player.name}
              {isMe && <span className="muted"> (you)</span>}
            </span>
            <div className="race-track">
              <div className="race-fill" style={{ width: `${pct}%`, background: player.color }} />
              <div className="race-marker" style={{ left: `${pct}%`, background: player.color }} />
            </div>
            <span className="race-flag">
              <FlagIcon />
            </span>
            <span className="race-count">
              {solved}/{total}
            </span>
            <span className={mistakes > 0 ? 'race-mistakes has-mistakes' : 'race-mistakes'}>
              Mistakes {mistakes}/{MAX_MISTAKES}
            </span>
          </div>
        )
      })}
    </div>
  )
}
