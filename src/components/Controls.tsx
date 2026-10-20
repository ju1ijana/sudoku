import { digitCounts } from '../game/state'
import type { GameState } from '../game/types'

interface ControlsProps {
  game: GameState
  onInput: (digit: number) => void
  onErase: () => void
  onToggleNotes: () => void
  onNewGame: () => void
}

export function Controls({ game, onInput, onErase, onToggleNotes, onNewGame }: ControlsProps) {
  const counts = digitCounts(game)
  const disabled = game.status !== 'playing' || game.paused

  return (
    <div className="controls">
      <div className="actions">
        <button className="action" onClick={onErase} disabled={disabled} title="Erase (Delete / Backspace)">
          <span className="action-icon" aria-hidden>⌫</span>
          Erase
        </button>
        <button
          className={game.notesMode ? 'action active' : 'action'}
          onClick={onToggleNotes}
          disabled={disabled}
          title="Notes (N)"
        >
          <span className="action-icon" aria-hidden>✎</span>
          Notes <span className="badge">{game.notesMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      <div className="numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <button
            key={d}
            className="num"
            onClick={() => onInput(d)}
            disabled={disabled}
            style={{ visibility: counts[d] === 9 ? 'hidden' : 'visible' }}
          >
            {d}
          </button>
        ))}
      </div>

      <button className="new-game" onClick={onNewGame}>
        New Game
      </button>
    </div>
  )
}
