export const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Extreme'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

/** A puzzle as 81 numbers in row-major order; 0 marks an empty cell. */
export interface Puzzle {
  id: string
  givens: number[]
  solution: number[]
  difficulty: Difficulty
}

export interface Cell {
  value: number // 0 when empty
  given: boolean
  notes: number[] // sorted digits 1-9
  error: boolean // value does not match the solution
}

export type GameStatus = 'playing' | 'won' | 'lost'

export interface GameState {
  puzzle: Puzzle
  cells: Cell[]
  selected: number | null
  notesMode: boolean
  mistakes: number
  elapsed: number // seconds
  paused: boolean
  status: GameStatus
}

export const MAX_MISTAKES = 3
