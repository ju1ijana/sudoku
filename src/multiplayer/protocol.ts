import type { Cell, Difficulty, GameState, Puzzle } from '../game/types'
import type { Player } from './players'

// Messages exchanged between the two browsers. The host is authoritative for
// the lobby, the puzzle and who won.

export type Role = 'host' | 'guest'

export type ResultReason = 'finished' | 'eliminated' | 'left'

/** What each player shares about their board during a race. */
export interface Snapshot {
  values: string // 81 digits, 0 for empty
  errors: number[] // indices of wrong digits
  mistakes: number
  elapsed: number
}

export type Message =
  | { type: 'hello'; player: Player } // guest -> host on connect
  | { type: 'profile'; player: Player } // guest -> host, colour or name change
  | { type: 'lobby'; host: Player; guest: Player; difficulty: Difficulty } // host -> guest
  | { type: 'full' } // host -> guest, room already has two players
  | { type: 'start'; puzzle: Puzzle } // host -> guest
  | { type: 'progress'; snapshot: Snapshot }
  | { type: 'finished' } // guest -> host
  | { type: 'eliminated' } // guest -> host
  | { type: 'result'; winner: Role; reason: ResultReason } // host -> guest
  | { type: 'rematch' }
  | { type: 'leave' }

export const ROOM_CODE_LENGTH = 4
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O or 1/I

export function randomRoomCode(): string {
  return Array.from({ length: ROOM_CODE_LENGTH }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('')
}

export function normalizeRoomCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ROOM_CODE_LENGTH)
}

export function takeSnapshot(game: GameState): Snapshot {
  return {
    values: game.cells.map((c) => c.value).join(''),
    errors: game.cells.flatMap((c, i) => (c.error ? [i] : [])),
    mistakes: game.mistakes,
    elapsed: game.elapsed,
  }
}

export function emptySnapshot(puzzle: Puzzle): Snapshot {
  return { values: puzzle.givens.join(''), errors: [], mistakes: 0, elapsed: 0 }
}

/** Rebuilds board cells from a snapshot so it can be drawn like a normal board. */
export function snapshotCells(puzzle: Puzzle, snapshot: Snapshot): Cell[] {
  const errors = new Set(snapshot.errors)
  return puzzle.givens.map((given, i) => ({
    value: Number(snapshot.values[i]),
    given: given !== 0,
    notes: [],
    error: errors.has(i),
  }))
}

/** Cells correctly filled in by the player, out of the cells that started empty. */
export function raceProgress(puzzle: Puzzle, snapshot: Snapshot): { solved: number; total: number } {
  let solved = 0
  let total = 0
  puzzle.givens.forEach((given, i) => {
    if (given !== 0) return
    total++
    if (Number(snapshot.values[i]) === puzzle.solution[i]) solved++
  })
  return { solved, total }
}
