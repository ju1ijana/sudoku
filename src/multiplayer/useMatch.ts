import Peer, { type DataConnection, type PeerError } from 'peerjs'
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef } from 'react'
import { fetchPuzzle } from '../game/puzzles'
import type { GameAction } from '../game/state'
import type { Difficulty } from '../game/types'
import { initialMatch, matchReducer } from './match'
import { cleanName, withFreeColor, type Player } from './players'
import { randomRoomCode, takeSnapshot, type Message, type ResultReason, type Role } from './protocol'

// Peer IDs on the public PeerJS server are global, so namespace ours.
const PEER_PREFIX = 'ju1ijana-sudoku-v1-'
const CONNECT_TIMEOUT_MS = 15_000

function describeError(err: PeerError<string>): string {
  switch (err.type) {
    case 'network':
    case 'server-error':
    case 'socket-error':
    case 'socket-closed':
      return "Couldn't reach the connection server. Check your internet connection and try again."
    case 'browser-incompatible':
      return "This browser doesn't support peer-to-peer connections."
    default:
      return `Connection error (${err.type}).`
  }
}

export function useMatch() {
  const [state, dispatch] = useReducer(matchReducer, initialMatch)
  // Connection callbacks outlive renders, so they read the latest state from here.
  const stateRef = useRef(state)
  useLayoutEffect(() => {
    stateRef.current = state
  })

  const peerRef = useRef<Peer | null>(null)
  const connRef = useRef<DataConnection | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const decidedRef = useRef(false) // a result has been settled for the current race
  const reportedRef = useRef(false) // this player's finish/elimination was reported

  const send = useCallback((msg: Message) => {
    const conn = connRef.current
    if (conn?.open) void conn.send(msg)
  }, [])

  const teardown = useCallback(() => {
    clearTimeout(timeoutRef.current)
    connRef.current?.close()
    connRef.current = null
    peerRef.current?.destroy()
    peerRef.current = null
  }, [])

  /** Settles the race. Only the host decides; the guest learns the result by message. */
  const decide = useCallback(
    (winner: Role, reason: ResultReason) => {
      if (decidedRef.current) return
      decidedRef.current = true
      send({ type: 'result', winner, reason })
      dispatch({ type: 'result', winner, reason })
    },
    [send],
  )

  const handleOpponentGone = useCallback(() => {
    const s = stateRef.current
    if ((s.phase === 'countdown' || s.phase === 'playing') && !s.result) {
      // Whoever stays wins; the host can't tell the guest, so each side settles it locally.
      decidedRef.current = true
      dispatch({ type: 'result', winner: s.role, reason: 'left' })
      dispatch({ type: 'opponentLeft' })
    } else if (s.phase === 'results') {
      dispatch({ type: 'opponentLeft' })
    } else if (s.role === 'host') {
      dispatch({ type: 'lobby', me: s.me, opponent: null, difficulty: s.difficulty })
    } else {
      dispatch({ type: 'error', message: 'The host closed the room.' })
    }
  }, [])

  const handleMessage = useCallback(
    (msg: Message) => {
      const s = stateRef.current
      if (s.role === 'host') {
        switch (msg.type) {
          case 'hello':
          case 'profile': {
            const guest = withFreeColor(
              { name: cleanName(msg.player.name) || 'Player 2', color: msg.player.color },
              s.me.color,
            )
            dispatch({ type: 'lobby', me: s.me, opponent: guest, difficulty: s.difficulty })
            send({ type: 'lobby', host: s.me, guest, difficulty: s.difficulty })
            return
          }
          case 'finished':
            return decide('guest', 'finished')
          case 'eliminated':
            return decide('host', 'eliminated')
        }
      } else {
        switch (msg.type) {
          case 'lobby':
            clearTimeout(timeoutRef.current)
            dispatch({ type: 'lobby', me: msg.guest, opponent: msg.host, difficulty: msg.difficulty })
            return
          case 'full':
            dispatch({ type: 'error', message: 'That room already has two players.' })
            return
          case 'start':
            decidedRef.current = false
            reportedRef.current = false
            dispatch({ type: 'start', puzzle: msg.puzzle })
            return
          case 'result':
            decidedRef.current = true
            dispatch({ type: 'result', winner: msg.winner, reason: msg.reason })
            return
        }
      }
      switch (msg.type) {
        case 'progress':
          dispatch({ type: 'opponentProgress', snapshot: msg.snapshot })
          return
        case 'rematch':
          dispatch({ type: 'rematch' })
          return
        case 'leave':
          connRef.current?.close()
          return
      }
    },
    [decide, send],
  )

  const attach = useCallback(
    (conn: DataConnection) => {
      conn.on('data', (data) => handleMessage(data as Message))
      conn.on('close', () => {
        if (connRef.current !== conn) return
        connRef.current = null
        handleOpponentGone()
      })
    },
    [handleMessage, handleOpponentGone],
  )

  const createRoom = useCallback(
    (me: Player, difficulty: Difficulty) => {
      teardown()
      openRoom(randomRoomCode())

      function openRoom(code: string) {
        dispatch({ type: 'connecting', role: 'host', code, me, difficulty })
        const peer = new Peer(PEER_PREFIX + code)
        peerRef.current = peer
        peer.on('open', () => dispatch({ type: 'roomOpen' }))
        peer.on('connection', (conn) => {
          if (connRef.current) {
            conn.on('open', () => {
              void conn.send({ type: 'full' } satisfies Message)
              setTimeout(() => conn.close(), 1000)
            })
            return
          }
          connRef.current = conn
          attach(conn)
        })
        peer.on('error', (err) => {
          if (peerRef.current !== peer) return
          if (err.type === 'unavailable-id') {
            // Another room already uses this code: try a different one.
            peer.destroy()
            openRoom(randomRoomCode())
          } else {
            dispatch({ type: 'error', message: describeError(err) })
          }
        })
      }
    },
    [attach, teardown],
  )

  const joinRoom = useCallback(
    (code: string, me: Player) => {
      teardown()
      dispatch({ type: 'connecting', role: 'guest', code, me, difficulty: 'Easy' })
      const peer = new Peer()
      peerRef.current = peer
      timeoutRef.current = setTimeout(() => {
        if (stateRef.current.phase === 'connecting')
          dispatch({ type: 'error', message: "Couldn't connect to the room. Check the code and try again." })
      }, CONNECT_TIMEOUT_MS)
      peer.on('open', () => {
        const conn = peer.connect(PEER_PREFIX + code, { reliable: true })
        connRef.current = conn
        attach(conn)
        conn.on('open', () => void conn.send({ type: 'hello', player: me } satisfies Message))
      })
      peer.on('error', (err) => {
        if (peerRef.current !== peer) return
        clearTimeout(timeoutRef.current)
        dispatch({
          type: 'error',
          message: err.type === 'peer-unavailable' ? `There is no room with the code ${code}.` : describeError(err),
        })
      })
    },
    [attach, teardown],
  )

  const startMatch = useCallback(async () => {
    const s = stateRef.current
    if (s.role !== 'host' || !s.opponent) return
    try {
      const puzzle = await fetchPuzzle(s.difficulty)
      decidedRef.current = false
      reportedRef.current = false
      send({ type: 'start', puzzle })
      dispatch({ type: 'start', puzzle })
    } catch (err) {
      dispatch({ type: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }, [send])

  const updateLobby = useCallback(
    (me: Player, difficulty: Difficulty) => {
      const s = stateRef.current
      if (s.role === 'host') {
        const host = withFreeColor(me, s.opponent?.color)
        dispatch({ type: 'lobby', me: host, opponent: s.opponent, difficulty })
        if (s.opponent) send({ type: 'lobby', host, guest: s.opponent, difficulty })
      } else {
        const guest = withFreeColor(me, s.opponent?.color)
        dispatch({ type: 'lobby', me: guest, opponent: s.opponent, difficulty: s.difficulty })
        send({ type: 'profile', player: guest })
      }
    },
    [send],
  )

  const requestRematch = useCallback(() => {
    dispatch({ type: 'rematch' })
    send({ type: 'rematch' })
  }, [send])

  const leave = useCallback(() => {
    send({ type: 'leave' })
    // Give the message a moment to go out before closing the connection.
    const peer = peerRef.current
    const conn = connRef.current
    peerRef.current = null
    connRef.current = null
    setTimeout(() => {
      conn?.close()
      peer?.destroy()
    }, 300)
    dispatch({ type: 'reset' })
  }, [send])

  const gameAction = useCallback((action: GameAction) => dispatch({ type: 'game', action }), [])

  // Countdown before a race.
  useEffect(() => {
    if (state.phase !== 'countdown') return
    const id = setTimeout(() => dispatch({ type: 'countdownTick' }), 1000)
    return () => clearTimeout(id)
  }, [state.phase, state.countdown])

  // Race clock.
  const racing = state.phase === 'playing' && state.game?.status === 'playing'
  useEffect(() => {
    if (!racing) return
    const id = setInterval(() => dispatch({ type: 'game', action: { type: 'tick' } }), 1000)
    return () => clearInterval(id)
  }, [racing])

  // Share progress, and report finishing or being eliminated.
  useEffect(() => {
    const game = state.game
    if (state.phase !== 'playing' || !game) return
    send({ type: 'progress', snapshot: takeSnapshot(game) })
    if (game.status === 'playing' || reportedRef.current) return
    reportedRef.current = true
    const finished = game.status === 'won'
    if (state.role === 'host') decide(finished ? 'host' : 'guest', finished ? 'finished' : 'eliminated')
    else send({ type: finished ? 'finished' : 'eliminated' })
  }, [state.game, state.phase, state.role, send, decide])

  // The host starts a rematch as soon as either player asks for one.
  useEffect(() => {
    if (state.role === 'host' && state.phase === 'results' && state.rematchRequested && !state.opponentLeft)
      void startMatch()
  }, [state.role, state.phase, state.rematchRequested, state.opponentLeft, startMatch])

  // Tell the opponent when the tab closes, and clean up on unmount.
  useEffect(() => {
    const onUnload = () => send({ type: 'leave' })
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      teardown()
    }
  }, [send, teardown])

  return { state, createRoom, joinRoom, startMatch, updateLobby, requestRematch, leave, gameAction }
}
