import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPuzzle } from './dosuku'

const SOLUTION_ROWS = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
]

const grid = (difficulty: string) => ({
  value: SOLUTION_ROWS.map((row) => row.map((v, c) => (c === 0 ? 0 : v))),
  solution: SOLUTION_ROWS,
  difficulty,
})

const response = (...difficulties: string[]) =>
  new Response(JSON.stringify({ newboard: { grids: difficulties.map(grid) } }))

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchPuzzle', () => {
  it('fetches until the requested difficulty appears and caches the rest', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response('Medium', 'Hard'))
      .mockResolvedValueOnce(response('Medium', 'Easy'))
    vi.stubGlobal('fetch', fetchMock)

    const puzzle = await fetchPuzzle('Easy')
    expect(puzzle.difficulty).toBe('Easy')
    expect(puzzle.givens).toHaveLength(81)
    expect(puzzle.givens[0]).toBe(0)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // The surplus Hard puzzle is served from the cache without fetching.
    const hard = await fetchPuzzle('Hard')
    expect(hard.difficulty).toBe('Hard')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('retries after failed requests', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(new Response('timeout', { status: 504 }))
      .mockResolvedValueOnce(response('Hard'))
    vi.stubGlobal('fetch', fetchMock)

    expect((await fetchPuzzle('Hard')).difficulty).toBe('Hard')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('gives up after repeated failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    await expect(fetchPuzzle('Easy')).rejects.toThrow('Could not get a puzzle of difficulty Easy')
  })

  it('stops when aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    vi.stubGlobal('fetch', vi.fn())
    await expect(fetchPuzzle('Easy', controller.signal)).rejects.toThrow()
  })
})
