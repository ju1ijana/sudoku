import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { fetchPuzzle } from './puzzles'
import { gameReducer, newGame, type GameAction } from './state'
import { DIFFICULTIES, type Difficulty, type GameState, type Puzzle } from './types'

const SAVE_KEY = 'sudoku.game'
const DIFFICULTY_KEY = 'sudoku.difficulty'

type Action = GameAction | { type: 'load'; puzzle: Puzzle }

function reducer(state: GameState | null, action: Action): GameState | null {
  if (action.type === 'load') return newGame(action.puzzle)
  return state && gameReducer(state, action)
}

/**
 * Restores an unfinished game from the last visit, paused so the clock doesn't run unseen.
 * Games without a puzzle id predate the puzzle bank (they came from Dosuku) and are dropped.
 */
function loadSavedGame(): GameState | null {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as GameState | null
    return saved?.status === 'playing' && saved.puzzle?.id && saved.cells?.length === 81 ? { ...saved, paused: true } : null
  } catch {
    return null
  }
}

function loadDifficulty(): Difficulty {
  try {
    return DIFFICULTIES.find((d) => d === localStorage.getItem(DIFFICULTY_KEY)) ?? 'Easy'
  } catch {
    return 'Easy'
  }
}

export function useGame() {
  const [game, dispatch] = useReducer(reducer, null, loadSavedGame)
  const [difficulty, setDifficulty] = useState<Difficulty>(() => game?.puzzle.difficulty ?? loadDifficulty())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const startGame = useCallback(async (next: Difficulty) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setDifficulty(next)
    setLoading(true)
    setError(null)
    try {
      localStorage.setItem(DIFFICULTY_KEY, next)
    } catch {
      // Remembering the difficulty is optional.
    }
    try {
      dispatch({ type: 'load', puzzle: await fetchPuzzle(next, controller.signal) })
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [])

  // Start the first game unless one was restored.
  const started = useRef(game !== null)
  useEffect(() => {
    if (started.current) return
    started.current = true
    void startGame(difficulty)
  }, [difficulty, startGame])

  const running = game?.status === 'playing' && !game.paused && !loading
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    try {
      if (game?.status === 'playing') localStorage.setItem(SAVE_KEY, JSON.stringify(game))
      else localStorage.removeItem(SAVE_KEY)
    } catch {
      // Saving progress is optional.
    }
  }, [game])

  return { game, dispatch, difficulty, loading, error, startGame }
}
