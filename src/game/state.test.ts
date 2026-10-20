import { describe, expect, it } from 'vitest'
import { digitCounts, gameReducer, isPeer, newGame, type GameAction } from './state'
import type { GameState, Puzzle } from './types'

const SOLUTION = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
]

// Everything given except the first two cells (solutions 5 and 3) and cell 80 (solution 9).
const EMPTY = new Set([0, 1, 80])
const puzzle: Puzzle = {
  givens: SOLUTION.map((v, i) => (EMPTY.has(i) ? 0 : v)),
  solution: SOLUTION,
  difficulty: 'Easy',
  id: 'test',
}

const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state)

describe('isPeer', () => {
  it('matches row, column and box but not the cell itself', () => {
    expect(isPeer(0, 8)).toBe(true) // same row
    expect(isPeer(0, 72)).toBe(true) // same column
    expect(isPeer(0, 20)).toBe(true) // same box
    expect(isPeer(0, 30)).toBe(false)
    expect(isPeer(0, 0)).toBe(false)
  })
})

describe('gameReducer', () => {
  it('places a correct digit', () => {
    const s = run(newGame(puzzle), { type: 'select', index: 0 }, { type: 'input', digit: 5 })
    expect(s.cells[0]).toMatchObject({ value: 5, error: false })
    expect(s.mistakes).toBe(0)
  })

  it('marks a wrong digit as an error and counts the mistake', () => {
    const s = run(newGame(puzzle), { type: 'select', index: 0 }, { type: 'input', digit: 7 })
    expect(s.cells[0]).toMatchObject({ value: 7, error: true })
    expect(s.mistakes).toBe(1)
    expect(s.status).toBe('playing')
  })

  it('does not count the same wrong digit twice', () => {
    const s = run(newGame(puzzle), { type: 'select', index: 0 }, { type: 'input', digit: 7 }, { type: 'input', digit: 7 })
    expect(s.mistakes).toBe(1)
  })

  it('ends the game on the third mistake', () => {
    const s = run(
      newGame(puzzle),
      { type: 'select', index: 0 },
      { type: 'input', digit: 7 },
      { type: 'input', digit: 8 },
      { type: 'input', digit: 9 },
    )
    expect(s.mistakes).toBe(3)
    expect(s.status).toBe('lost')
    expect(run(s, { type: 'input', digit: 5 })).toBe(s)
  })

  it('does not change givens or correct digits', () => {
    const start = run(newGame(puzzle), { type: 'select', index: 2 })
    expect(run(start, { type: 'input', digit: 1 })).toBe(start)
    expect(run(start, { type: 'erase' })).toBe(start)

    const placed = run(start, { type: 'select', index: 0 }, { type: 'input', digit: 5 })
    expect(run(placed, { type: 'erase' })).toBe(placed)
  })

  it('erases a wrong digit', () => {
    const s = run(newGame(puzzle), { type: 'select', index: 0 }, { type: 'input', digit: 7 }, { type: 'erase' })
    expect(s.cells[0]).toMatchObject({ value: 0, error: false })
    expect(s.mistakes).toBe(1)
  })

  it('toggles notes in notes mode and erases them', () => {
    let s = run(newGame(puzzle), { type: 'select', index: 0 }, { type: 'toggleNotes' })
    s = run(s, { type: 'input', digit: 5 }, { type: 'input', digit: 2 }, { type: 'input', digit: 7 }, { type: 'input', digit: 2 })
    expect(s.cells[0].notes).toEqual([5, 7])
    expect(s.cells[0].value).toBe(0)
    expect(run(s, { type: 'erase' }).cells[0].notes).toEqual([])
  })

  it('removes a correctly placed digit from peer notes', () => {
    let s = run(newGame(puzzle), { type: 'toggleNotes' }, { type: 'select', index: 1 }, { type: 'input', digit: 5 }, { type: 'input', digit: 3 })
    s = run(s, { type: 'toggleNotes' }, { type: 'select', index: 0 }, { type: 'input', digit: 5 })
    expect(s.cells[1].notes).toEqual([3])
  })

  it('wins when every cell is correct', () => {
    const s = run(
      newGame(puzzle),
      { type: 'select', index: 0 },
      { type: 'input', digit: 5 },
      { type: 'select', index: 1 },
      { type: 'input', digit: 3 },
      { type: 'select', index: 80 },
      { type: 'input', digit: 9 },
    )
    expect(s.status).toBe('won')
  })

  it('moves the selection with wrap-around', () => {
    let s = run(newGame(puzzle), { type: 'move', dRow: 0, dCol: 1 })
    expect(s.selected).toBe(0) // first move just selects the top-left cell
    s = run(s, { type: 'move', dRow: -1, dCol: 0 })
    expect(s.selected).toBe(72)
    s = run(s, { type: 'move', dRow: 0, dCol: -1 })
    expect(s.selected).toBe(80)
  })

  it('only ticks the timer while playing and not paused', () => {
    let s = run(newGame(puzzle), { type: 'tick' }, { type: 'tick' })
    expect(s.elapsed).toBe(2)
    s = run(s, { type: 'togglePause' }, { type: 'tick' })
    expect(s.elapsed).toBe(2)
    expect(run(s, { type: 'select', index: 0 }, { type: 'input', digit: 5 }).cells[0].value).toBe(0)
  })

  it('counts correctly placed digits', () => {
    const s = run(newGame(puzzle), { type: 'select', index: 0 }, { type: 'input', digit: 7 })
    const counts = digitCounts(s)
    expect(counts[5]).toBe(8)
    expect(counts[7]).toBe(9) // the wrong 7 is not counted
  })
})
