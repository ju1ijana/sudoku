import { boxOf, colOf, rowOf } from '../game/state'
import type { GameState } from '../game/types'

interface BoardProps {
  game: GameState
  onSelect: (index: number) => void
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function Board({ game, onSelect }: BoardProps) {
  const { cells, selected } = game
  const selectedValue = selected === null ? 0 : cells[selected].value

  return (
    <div className="board" role="grid" aria-label="Sudoku board">
      {cells.map((cell, i) => {
        const related =
          selected !== null &&
          (rowOf(i) === rowOf(selected) || colOf(i) === colOf(selected) || boxOf(i) === boxOf(selected))
        const classes = [
          'cell',
          cell.given ? 'given' : 'entered',
          cell.error && 'error',
          related && 'related',
          selectedValue !== 0 && cell.value === selectedValue && 'same-value',
          i === selected && 'selected',
          colOf(i) % 3 === 2 && colOf(i) !== 8 && 'box-right',
          rowOf(i) % 3 === 2 && rowOf(i) !== 8 && 'box-bottom',
        ]
        return (
          <div
            key={i}
            role="gridcell"
            aria-selected={i === selected}
            className={classes.filter(Boolean).join(' ')}
            onMouseDown={() => onSelect(i)}
          >
            {cell.value !== 0 ? (
              cell.value
            ) : (
              cell.notes.length > 0 && (
                <div className="notes">
                  {DIGITS.map((d) => (
                    <span key={d} className={d === selectedValue ? 'note same-value' : 'note'}>
                      {cell.notes.includes(d) ? d : ''}
                    </span>
                  ))}
                </div>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}
