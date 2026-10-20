import { gameReducer, newGame, type GameAction } from '../game/state'
import type { Difficulty, GameState, Puzzle } from '../game/types'
import type { Player } from './players'
import { emptySnapshot, type ResultReason, type Role, type Snapshot } from './protocol'

export type MatchPhase = 'idle' | 'connecting' | 'lobby' | 'countdown' | 'playing' | 'results'

export const COUNTDOWN_SECONDS = 3

export interface MatchResult {
  winner: 'me' | 'opponent'
  reason: ResultReason
}

export interface MatchState {
  phase: MatchPhase
  role: Role
  code: string
  difficulty: Difficulty
  me: Player
  opponent: Player | null
  puzzle: Puzzle | null
  countdown: number
  game: GameState | null
  opponentSnapshot: Snapshot | null
  result: MatchResult | null
  rematchRequested: boolean // either player asked for a rematch; the host starts it
  opponentLeft: boolean
  error: string | null
}

export type MatchAction =
  | { type: 'connecting'; role: Role; code: string; me: Player; difficulty: Difficulty }
  | { type: 'roomOpen' }
  | { type: 'lobby'; me: Player; opponent: Player | null; difficulty: Difficulty }
  | { type: 'start'; puzzle: Puzzle }
  | { type: 'countdownTick' }
  | { type: 'game'; action: GameAction }
  | { type: 'opponentProgress'; snapshot: Snapshot }
  | { type: 'result'; winner: Role; reason: ResultReason }
  | { type: 'rematch' }
  | { type: 'opponentLeft' }
  | { type: 'error'; message: string }
  | { type: 'reset' }

export const initialMatch: MatchState = {
  phase: 'idle',
  role: 'host',
  code: '',
  difficulty: 'Easy',
  me: { name: '', color: '' },
  opponent: null,
  puzzle: null,
  countdown: 0,
  game: null,
  opponentSnapshot: null,
  result: null,
  rematchRequested: false,
  opponentLeft: false,
  error: null,
}

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'connecting':
      return { ...initialMatch, phase: 'connecting', role: action.role, code: action.code, me: action.me, difficulty: action.difficulty }

    case 'roomOpen':
      return { ...state, phase: 'lobby' }

    case 'lobby':
      return {
        ...state,
        phase: state.phase === 'connecting' ? 'lobby' : state.phase,
        me: action.me,
        opponent: action.opponent,
        difficulty: action.difficulty,
      }

    case 'start':
      return {
        ...state,
        phase: 'countdown',
        puzzle: action.puzzle,
        difficulty: action.puzzle.difficulty,
        countdown: COUNTDOWN_SECONDS,
        game: null,
        opponentSnapshot: emptySnapshot(action.puzzle),
        result: null,
        rematchRequested: false,
      }

    case 'countdownTick': {
      if (state.phase !== 'countdown' || !state.puzzle) return state
      const countdown = state.countdown - 1
      return countdown > 0
        ? { ...state, countdown }
        : { ...state, countdown: 0, phase: 'playing', game: newGame(state.puzzle) }
    }

    case 'game':
      if (state.phase !== 'playing' || !state.game || state.result) return state
      return { ...state, game: gameReducer(state.game, action.action) }

    case 'opponentProgress':
      return { ...state, opponentSnapshot: action.snapshot }

    case 'result':
      if (state.result) return state
      return {
        ...state,
        phase: 'results',
        result: { winner: action.winner === state.role ? 'me' : 'opponent', reason: action.reason },
      }

    case 'rematch':
      return { ...state, rematchRequested: true }

    case 'opponentLeft':
      return { ...state, opponentLeft: true }

    case 'error':
      return { ...state, error: action.message }

    case 'reset':
      return initialMatch
  }
}

/** The role of the other player. */
export const otherRole = (role: Role): Role => (role === 'host' ? 'guest' : 'host')
