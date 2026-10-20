import { describe, expect, it } from 'vitest'
import type { Puzzle } from '../game/types'
import { COUNTDOWN_SECONDS, initialMatch, matchReducer, type MatchAction, type MatchState } from './match'
import { COLORS, withFreeColor } from './players'
import { emptySnapshot, normalizeRoomCode, raceProgress, randomRoomCode, snapshotCells, takeSnapshot } from './protocol'

const SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
const puzzle: Puzzle = {
  id: 'test',
  givens: [...SOLUTION].map((d, i) => (i < 3 ? 0 : Number(d))), // first three cells empty
  solution: [...SOLUTION].map(Number),
  difficulty: 'Easy',
}

const run = (state: MatchState, ...actions: MatchAction[]) => actions.reduce(matchReducer, state)
const host = { name: 'Ana', color: COLORS[1] }
const guest = { name: 'Marko', color: COLORS[2] }

const racing = () =>
  run(
    initialMatch,
    { type: 'connecting', role: 'host', code: 'K7QX', me: host, difficulty: 'Easy' },
    { type: 'roomOpen' },
    { type: 'lobby', me: host, opponent: guest, difficulty: 'Easy' },
    { type: 'start', puzzle },
    ...Array.from({ length: COUNTDOWN_SECONDS }, () => ({ type: 'countdownTick' }) as const),
  )

describe('matchReducer', () => {
  it('goes from lobby through the countdown to racing', () => {
    let s = run(
      initialMatch,
      { type: 'connecting', role: 'host', code: 'K7QX', me: host, difficulty: 'Easy' },
      { type: 'roomOpen' },
    )
    expect(s.phase).toBe('lobby')
    s = run(s, { type: 'lobby', me: host, opponent: guest, difficulty: 'Hard' }, { type: 'start', puzzle })
    expect(s.phase).toBe('countdown')
    expect(s.game).toBeNull() // the board stays hidden during the countdown
    s = run(s, { type: 'countdownTick' }, { type: 'countdownTick' })
    expect(s.countdown).toBe(1)
    s = run(s, { type: 'countdownTick' })
    expect(s.phase).toBe('playing')
    expect(s.game?.cells[0].value).toBe(0)
  })

  it('applies game actions only while racing', () => {
    const s = run(
      racing(),
      { type: 'game', action: { type: 'select', index: 0 } },
      { type: 'game', action: { type: 'input', digit: 5 } },
    )
    expect(s.game?.cells[0].value).toBe(5)
    const after = run(s, { type: 'result', winner: 'guest', reason: 'finished' })
    expect(run(after, { type: 'game', action: { type: 'input', digit: 3 } })).toBe(after)
  })

  it('maps the winning role to me or the opponent and keeps the first result', () => {
    const host = run(racing(), { type: 'result', winner: 'host', reason: 'finished' })
    expect(host.result).toEqual({ winner: 'me', reason: 'finished' })
    expect(host.phase).toBe('results')
    expect(run(host, { type: 'result', winner: 'guest', reason: 'left' }).result?.winner).toBe('me')

    const guestView = run({ ...racing(), role: 'guest' }, { type: 'result', winner: 'host', reason: 'eliminated' })
    expect(guestView.result).toEqual({ winner: 'opponent', reason: 'eliminated' })
  })

  it('resets rematch requests when a new race starts', () => {
    let s = run(
      racing(),
      { type: 'result', winner: 'host', reason: 'finished' },
      { type: 'rematch', who: 'me' },
      { type: 'rematch', who: 'opponent' },
    )
    expect(s.rematch).toEqual({ me: true, opponent: true })
    s = run(s, { type: 'start', puzzle })
    expect(s.rematch).toEqual({ me: false, opponent: false })
    expect(s.result).toBeNull()
  })
})

describe('players', () => {
  it('keeps a free colour and replaces a taken one', () => {
    expect(withFreeColor(guest, host.color)).toEqual(guest)
    expect(withFreeColor({ ...guest, color: host.color }, host.color).color).toBe(COLORS[0])
    expect(withFreeColor({ ...guest, color: COLORS[0] }, COLORS[0]).color).toBe(COLORS[1])
  })
})

describe('protocol', () => {
  it('makes and normalises room codes', () => {
    expect(randomRoomCode()).toMatch(/^[A-Z2-9]{4}$/)
    expect(normalizeRoomCode(' k7-qx9 ')).toBe('K7QX')
  })

  it('round-trips a board through a snapshot and measures progress', () => {
    let s = run(
      racing(),
      { type: 'game', action: { type: 'select', index: 0 } },
      { type: 'game', action: { type: 'input', digit: 5 } },
    )
    s = run(
      s,
      { type: 'game', action: { type: 'select', index: 1 } },
      { type: 'game', action: { type: 'input', digit: 9 } },
    )
    const snapshot = takeSnapshot(s.game!)
    expect(snapshot.errors).toEqual([1])
    expect(snapshot.mistakes).toBe(1)
    expect(raceProgress(puzzle, snapshot)).toEqual({ solved: 1, total: 3 })
    const cells = snapshotCells(puzzle, snapshot)
    expect(cells[0]).toMatchObject({ value: 5, given: false, error: false })
    expect(cells[1]).toMatchObject({ value: 9, error: true })
    expect(cells[3]).toMatchObject({ value: 6, given: true })
    expect(raceProgress(puzzle, emptySnapshot(puzzle))).toEqual({ solved: 0, total: 3 })
  })
})
