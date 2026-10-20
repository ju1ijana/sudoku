import { digitCounts } from '../game/state'
import type { GameState } from '../game/types'
import { CheckIcon, EraserIcon, PencilIcon } from './Icons'

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
    <>
      <div className="actions">
        <button className="action" onClick={onErase} disabled={disabled} aria-label="Erase" title="Erase (Delete)">
          <EraserIcon />
        </button>
        <button
          className="action"
          onClick={onToggleNotes}
          disabled={disabled}
          aria-label="Notes"
          aria-pressed={game.notesMode}
          title="Notes (N)"
        >
          <PencilIcon />
          <span className={game.notesMode ? 'badge on' : 'badge'}>{game.notesMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      <div className="numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) =>
          counts[d] === 9 ? (
            <div key={d} className="num done" aria-label={`All ${d}s placed`}>
              <CheckIcon />
            </div>
          ) : (
            <button key={d} className="num" onClick={() => onInput(d)} disabled={disabled}>
              {d}
            </button>
          ),
        )}
      </div>

      <button className="new-game" onClick={onNewGame}>
        New Game
      </button>
    </>
  )
}
