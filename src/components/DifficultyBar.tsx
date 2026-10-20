import { DIFFICULTIES, type Difficulty } from '../game/types'

interface DifficultyBarProps {
  current: Difficulty
  onSelect: (difficulty: Difficulty) => void
}

export function DifficultyBar({ current, onSelect }: DifficultyBarProps) {
  return (
    <nav className="difficulty-bar" aria-label="Difficulty">
      <span className="difficulty-label">Difficulty:</span>
      {DIFFICULTIES.map((d) => (
        <button
          key={d}
          className={d === current ? 'difficulty active' : 'difficulty'}
          aria-current={d === current}
          onClick={() => onSelect(d)}
        >
          {d}
        </button>
      ))}
    </nav>
  )
}
