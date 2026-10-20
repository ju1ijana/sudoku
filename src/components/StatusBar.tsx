import { formatTime } from '../game/format'
import { MAX_MISTAKES, type GameState } from '../game/types'
import { PauseIcon, PlayIcon } from './Icons'

interface StatusBarProps {
  game: GameState
  onTogglePause?: () => void
  /** Show the difficulty instead of mistakes (in races, mistakes are on the race track). */
  showDifficulty?: boolean
}

export function StatusBar({ game, onTogglePause, showDifficulty = false }: StatusBarProps) {
  return (
    <div className="status-bar">
      {showDifficulty ? (
        <div className="stat">
          <span className="stat-label">Difficulty</span>
          <span className="stat-value">{game.puzzle.difficulty}</span>
        </div>
      ) : (
        <div className="stat">
          <span className="stat-label">Mistakes</span>
          <span className={game.mistakes > 0 ? 'stat-value mistakes' : 'stat-value'}>
            {game.mistakes}/{MAX_MISTAKES}
          </span>
        </div>
      )}
      <div className="stat time">
        <div>
          <span className="stat-label">Time</span>
          <span className="stat-value">{formatTime(game.elapsed)}</span>
        </div>
        {onTogglePause && (
          <button
            className="pause"
            onClick={onTogglePause}
            disabled={game.status !== 'playing'}
            aria-label={game.paused ? 'Resume' : 'Pause'}
            title={game.paused ? 'Resume' : 'Pause'}
          >
            {game.paused ? <PlayIcon /> : <PauseIcon />}
          </button>
        )}
      </div>
    </div>
  )
}
