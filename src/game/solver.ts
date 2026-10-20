// Exhaustive solver used to check that every bundled puzzle has exactly one
// solution, and a "singles only" solver used as a sanity check on difficulty.
// Grids are 81 numbers in row-major order with 0 for empty cells.

const ALL = 0b11_1111_1110 // bits 1-9

const boxIndex = (i: number) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3)

function popcount(mask: number): number {
  let n = 0
  for (; mask; mask &= mask - 1) n++
  return n
}

export interface SolveResult {
  /** Number of solutions found, capped at the requested limit. */
  count: number
  /** The first solution found, or null if there is none. */
  solution: number[] | null
}

export function solve(givens: readonly number[], limit = 2): SolveResult {
  const grid = givens.slice()
  const rows = Array<number>(9).fill(0)
  const cols = Array<number>(9).fill(0)
  const boxes = Array<number>(9).fill(0)

  for (let i = 0; i < 81; i++) {
    const v = grid[i]
    if (v === 0) continue
    const bit = 1 << v
    const r = Math.floor(i / 9), c = i % 9, b = boxIndex(i)
    if ((rows[r] | cols[c] | boxes[b]) & bit) return { count: 0, solution: null } // givens clash
    rows[r] |= bit
    cols[c] |= bit
    boxes[b] |= bit
  }

  let count = 0
  let solution: number[] | null = null

  // Depth-first search, always branching on the cell with the fewest candidates.
  const search = (): boolean => {
    let best = -1
    let bestMask = 0
    let bestCount = 10
    for (let i = 0; i < 81; i++) {
      if (grid[i] !== 0) continue
      const mask = ALL & ~(rows[Math.floor(i / 9)] | cols[i % 9] | boxes[boxIndex(i)])
      const n = popcount(mask)
      if (n === 0) return false
      if (n < bestCount) {
        best = i
        bestMask = mask
        bestCount = n
        if (n === 1) break
      }
    }
    if (best === -1) {
      count++
      solution ??= grid.slice()
      return count >= limit
    }

    const r = Math.floor(best / 9), c = best % 9, b = boxIndex(best)
    for (let v = 1; v <= 9; v++) {
      const bit = 1 << v
      if (!(bestMask & bit)) continue
      grid[best] = v
      rows[r] |= bit
      cols[c] |= bit
      boxes[b] |= bit
      const done = search()
      grid[best] = 0
      rows[r] &= ~bit
      cols[c] &= ~bit
      boxes[b] &= ~bit
      if (done) return true
    }
    return false
  }

  search()
  return { count, solution }
}

const UNITS: number[][] = [
  ...Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, b) =>
    Array.from({ length: 9 }, (_, k) => (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3)),
  ),
]
const UNITS_OF: number[][][] = Array.from({ length: 81 }, (_, i) => UNITS.filter((u) => u.includes(i)))

/**
 * Fills the grid using only naked singles (a cell with one candidate) and hidden
 * singles (a digit with one possible cell in a unit) — the techniques an "easy"
 * puzzle should need. Returns true if that completes the grid.
 */
export function solvableWithSingles(givens: readonly number[]): boolean {
  const grid = givens.slice()
  const candidates = (i: number) => {
    let mask = ALL
    for (const unit of UNITS_OF[i]) for (const j of unit) mask &= ~(1 << grid[j])
    return mask
  }

  for (let progress = true; progress; ) {
    progress = false
    for (let i = 0; i < 81; i++) {
      if (grid[i] !== 0) continue
      const mask = candidates(i)
      if (popcount(mask) === 1) {
        grid[i] = Math.log2(mask)
        progress = true
      }
    }
    for (const unit of UNITS) {
      for (let v = 1; v <= 9; v++) {
        if (unit.some((i) => grid[i] === v)) continue
        const spots = unit.filter((i) => grid[i] === 0 && candidates(i) & (1 << v))
        if (spots.length === 1) {
          grid[spots[0]] = v
          progress = true
        }
      }
    }
  }
  return grid.every((v) => v !== 0)
}
