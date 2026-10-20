import { formatTime } from '../game/format'
import { MAX_MISTAKES, type GameState } from '../game/types'

interface StatusBarProps {
  game: GameState
  onTogglePause: () => void
}

export function StatusBar({ game, onTogglePause }: StatusBarProps) {
  return (
    <div className="status-bar">
      <span>
        Difficulty: <strong>{game.puzzle.difficulty}</strong>
      </span>
      <span>
        Mistakes:{' '}
        <strong className={game.mistakes > 0 ? 'mistakes' : undefined}>
          {game.mistakes}/{MAX_MISTAKES}
        </strong>
      </span>
      <span className="timer">
        <strong>{formatTime(game.elapsed)}</strong>
        <button
          className="pause"
          onClick={onTogglePause}
          disabled={game.status !== 'playing'}
          aria-label={game.paused ? 'Resume' : 'Pause'}
          title={game.paused ? 'Resume' : 'Pause'}
        >
          {game.paused ? '▶' : '❚❚'}
        </button>
      </span>
    </div>
  )
}
