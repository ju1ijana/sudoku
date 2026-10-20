import { describe, expect, it } from 'vitest'
import type { BankEntry } from './puzzles'
import { solvableWithSingles, solve } from './solver'
import { DIFFICULTIES } from './types'

const grid = (digits: string) => [...digits].map(Number)

describe('solve', () => {
  it('solves a puzzle with a unique solution', () => {
    const puzzle = grid('530070000600195000098000060800060003400803001700020006060000280000419005000080079')
    const { count, solution } = solve(puzzle)
    expect(count).toBe(1)
    expect(solution?.join('')).toBe('534678912672195348198342567859761423426853791713924856961537284287419635345286179')
  })

  it('detects multiple solutions', () => {
    // Cells 32, 35, 41, 44 hold 1 3 / 3 1 across two rows and two boxes, so with
    // them emptied the swapped arrangement 3 1 / 1 3 is equally valid.
    const holed = grid('534678912672195348198342567859761423426853791713924856961537284287419635345286179')
    for (const i of [32, 35, 41, 44]) holed[i] = 0
    expect(solve(holed).count).toBe(2)
    expect(solve(Array(81).fill(0)).count).toBe(2)
  })

  it('reports no solution for clashing givens', () => {
    const puzzle = Array(81).fill(0)
    puzzle[0] = 5
    puzzle[1] = 5
    expect(solve(puzzle).count).toBe(0)
  })
})

describe('solvableWithSingles', () => {
  it('needs more than singles for an empty grid', () => {
    expect(solvableWithSingles(Array(81).fill(0))).toBe(false)
  })
})

const banks = import.meta.glob<BankEntry[]>('/public/puzzles/*.json', { eager: true, import: 'default' })

// Re-verifies every bundled puzzle on each test run.
describe.each(DIFFICULTIES)('bundled %s puzzles', (difficulty) => {
  const bank = banks[`/public/puzzles/${difficulty.toLowerCase()}.json`]

  it('are present', () => {
    expect(bank.length).toBeGreaterThanOrEqual(500)
  })

  it('each have exactly one solution, matching the stored one', () => {
    for (const p of bank) {
      const { count, solution } = solve(grid(p.givens))
      expect(count, p.id).toBe(1)
      expect(solution?.join(''), p.id).toBe(p.solution)
    }
  })
})

// Sanity checks on the bank's difficulty ratings.
describe('bundled puzzle difficulty', () => {
  const load = (d: string) => banks[`/public/puzzles/${d}.json`].map((p) => grid(p.givens))

  it('Easy puzzles can all be solved with singles only', () => {
    expect(load('easy').every(solvableWithSingles)).toBe(true)
  })

  it('Hard and Extreme puzzles all need more than singles', () => {
    expect([...load('hard'), ...load('extreme')].some(solvableWithSingles)).toBe(false)
  })
})
