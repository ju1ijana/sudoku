import { MAX_MISTAKES, type Cell, type GameState, type Puzzle } from './types'

export type GameAction =
  | { type: 'select'; index: number }
  | { type: 'move'; dRow: number; dCol: number }
  | { type: 'input'; digit: number }
  | { type: 'erase' }
  | { type: 'toggleNotes' }
  | { type: 'togglePause' }
  | { type: 'tick' }
  | { type: 'restart' }

export const rowOf = (i: number) => Math.floor(i / 9)
export const colOf = (i: number) => i % 9
export const boxOf = (i: number) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3)

/** True when two different cells share a row, column or 3x3 box. */
export function isPeer(a: number, b: number): boolean {
  return a !== b && (rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b))
}

export function newGame(puzzle: Puzzle): GameState {
  return {
    puzzle,
    cells: puzzle.givens.map((v) => ({ value: v, given: v !== 0, notes: [], error: false })),
    selected: null,
    notesMode: false,
    mistakes: 0,
    elapsed: 0,
    paused: false,
    status: 'playing',
  }
}

/** Correctly placed digits count towards completion; wrong ones do not. */
export function isSolved(cells: Cell[], solution: number[]): boolean {
  return cells.every((c, i) => c.value === solution[i])
}

/** How many correct placements of each digit (index 1-9) are on the board. */
export function digitCounts(state: GameState): number[] {
  const counts = Array<number>(10).fill(0)
  state.cells.forEach((c, i) => {
    if (c.value !== 0 && c.value === state.puzzle.solution[i]) counts[c.value]++
  })
  return counts
}

/** A cell can be edited unless it is a given or already holds the correct digit. */
function isEditable(state: GameState, i: number): boolean {
  const cell = state.cells[i]
  return !cell.given && !(cell.value !== 0 && !cell.error)
}

function canPlay(state: GameState): boolean {
  return state.status === 'playing' && !state.paused
}

function updateCell(cells: Cell[], i: number, patch: Partial<Cell>): Cell[] {
  return cells.map((c, j) => (j === i ? { ...c, ...patch } : c))
}

function toggleNote(state: GameState, i: number, digit: number): GameState {
  const cell = state.cells[i]
  if (cell.value !== 0) return state
  const notes = cell.notes.includes(digit)
    ? cell.notes.filter((n) => n !== digit)
    : [...cell.notes, digit].sort((a, b) => a - b)
  return { ...state, cells: updateCell(state.cells, i, { notes }) }
}

function placeDigit(state: GameState, i: number, digit: number): GameState {
  if (state.cells[i].value === digit) return state

  if (digit !== state.puzzle.solution[i]) {
    const mistakes = state.mistakes + 1
    return {
      ...state,
      cells: updateCell(state.cells, i, { value: digit, notes: [], error: true }),
      mistakes,
      status: mistakes >= MAX_MISTAKES ? 'lost' : state.status,
    }
  }

  // Correct digit: also clear it from the notes of every peer cell.
  const cells = state.cells.map((c, j) => {
    if (j === i) return { ...c, value: digit, notes: [], error: false }
    if (isPeer(i, j) && c.notes.includes(digit)) return { ...c, notes: c.notes.filter((n) => n !== digit) }
    return c
  })
  return { ...state, cells, status: isSolved(cells, state.puzzle.solution) ? 'won' : state.status }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'select':
      return { ...state, selected: action.index }

    case 'move': {
      if (state.selected === null) return { ...state, selected: 0 }
      const row = (rowOf(state.selected) + action.dRow + 9) % 9
      const col = (colOf(state.selected) + action.dCol + 9) % 9
      return { ...state, selected: row * 9 + col }
    }

    case 'input': {
      const i = state.selected
      if (i === null || !canPlay(state) || !isEditable(state, i)) return state
      return state.notesMode ? toggleNote(state, i, action.digit) : placeDigit(state, i, action.digit)
    }

    case 'erase': {
      const i = state.selected
      if (i === null || !canPlay(state) || !isEditable(state, i)) return state
      return { ...state, cells: updateCell(state.cells, i, { value: 0, notes: [], error: false }) }
    }

    case 'toggleNotes':
      return { ...state, notesMode: !state.notesMode }

    case 'togglePause':
      return state.status === 'playing' ? { ...state, paused: !state.paused } : state

    case 'tick':
      return canPlay(state) ? { ...state, elapsed: state.elapsed + 1 } : state

    case 'restart':
      return newGame(state.puzzle)
  }
}
