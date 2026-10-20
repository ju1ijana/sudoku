import { formatTime } from '../game/format'
import { DIFFICULTIES, MAX_MISTAKES, type Difficulty, type GameState } from '../game/types'
import { PauseIcon, PlayIcon } from './Icons'

interface StatusBarProps {
  game: GameState
  onTogglePause?: () => void
  /** Show the difficulty instead of mistakes (in races, mistakes are on the race track). */
  showDifficulty?: boolean
  /** A dropdown for the next game's difficulty, shown on narrow screens. */
  difficultyPicker?: { current: Difficulty; onSelect: (difficulty: Difficulty) => void }
}

export function StatusBar({ game, onTogglePause, showDifficulty = false, difficultyPicker }: StatusBarProps) {
  return (
    <div className="status-bar">
      {difficultyPicker && (
        <label className="stat difficulty-picker">
          <span className="stat-label">Difficulty</span>
          <select
            className="stat-value"
            value={difficultyPicker.current}
            onChange={(e) => {
              e.target.blur() // hand keyboard input back to the board
              difficultyPicker.onSelect(e.target.value as Difficulty)
            }}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
      )}
      {showDifficulty ? (
        <div className="stat">
          <span className="stat-label">Difficulty</span>
          <span className="stat-value">{game.puzzle.difficulty}</span>
        </div>
      ) : (
        <div className="stat mistakes-stat">
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
