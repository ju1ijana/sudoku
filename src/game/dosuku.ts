import { DIFFICULTIES, type Difficulty, type Puzzle } from './types'

// Dosuku (https://sudoku-api.vercel.app) cannot filter by difficulty, so we fetch
// batches and keep the ones that don't match in a local cache for later games.
const ENDPOINT = 'https://sudoku-api.vercel.app/api/dosuku'
const BATCH_SIZE = 10
const REQUEST_TIMEOUT_MS = 12_000
const MAX_ATTEMPTS = 20
const CACHE_KEY = 'sudoku.puzzleCache'
const CACHE_LIMIT = 60

interface DosukuGrid {
  value: number[][]
  solution: number[][]
  difficulty: string
}

function parseGrid(grid: DosukuGrid): Puzzle | null {
  const givens = grid.value?.flat()
  const solution = grid.solution?.flat()
  const difficulty = DIFFICULTIES.find((d) => d === grid.difficulty)
  if (!difficulty || givens?.length !== 81 || solution?.length !== 81) return null
  if (!solution.every((v) => v >= 1 && v <= 9)) return null
  if (!givens.every((v, i) => v === 0 || v === solution[i])) return null
  return { givens, solution, difficulty }
}

async function fetchBatch(signal?: AbortSignal): Promise<Puzzle[]> {
  const query = `{newboard(limit:${BATCH_SIZE}){grids{value,solution,difficulty}}}`
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  })
  if (!res.ok) throw new Error(`Dosuku responded with ${res.status}`)
  const data = await res.json()
  const grids: DosukuGrid[] = data?.newboard?.grids ?? []
  return grids.map(parseGrid).filter((p): p is Puzzle => p !== null)
}

function readCache(): Puzzle[] {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]')
    return Array.isArray(cached) ? cached : []
  } catch {
    return []
  }
}

function writeCache(puzzles: Puzzle[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(puzzles.slice(-CACHE_LIMIT)))
  } catch {
    // Storage full or unavailable: the cache is only an optimisation.
  }
}

/** Takes a cached puzzle of the given difficulty, if any, removing it from the cache. */
function takeFromCache(difficulty: Difficulty): Puzzle | null {
  const cache = readCache()
  const index = cache.findIndex((p) => p.difficulty === difficulty)
  if (index === -1) return null
  const [puzzle] = cache.splice(index, 1)
  writeCache(cache)
  return puzzle
}

export async function fetchPuzzle(difficulty: Difficulty, signal?: AbortSignal): Promise<Puzzle> {
  const cached = takeFromCache(difficulty)
  if (cached) return cached

  let lastError: unknown = null
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    signal?.throwIfAborted()
    let batch: Puzzle[]
    try {
      batch = await fetchBatch(signal)
    } catch (err) {
      signal?.throwIfAborted()
      // Dosuku intermittently times out; retry.
      lastError = err
      continue
    }
    const match = batch.find((p) => p.difficulty === difficulty)
    writeCache([...readCache(), ...batch.filter((p) => p !== match)])
    if (match) return match
  }
  throw new Error(`Could not get a puzzle of difficulty ${difficulty} from Dosuku`, { cause: lastError })
}
