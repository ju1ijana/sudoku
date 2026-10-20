import { useState } from 'react'
import { DIFFICULTIES, type Difficulty } from '../game/types'
import type { MatchState } from '../multiplayer/match'
import type { Player } from '../multiplayer/players'
import { ColorPicker } from './ColorPicker'

interface LobbyProps {
  match: MatchState
  onUpdate: (me: Player, difficulty: Difficulty) => void
  onStart: () => void
  onLeave: () => void
}

function roomLink(code: string): string {
  return `${location.origin}${location.pathname}?room=${code}`
}

export function Lobby({ match, onUpdate, onStart, onLeave }: LobbyProps) {
  const { me, opponent, role, code, difficulty } = match
  const isHost = role === 'host'
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomLink(code))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the link is shown in full below the button anyway.
    }
  }

  return (
    <div className="setup lobby">
      <button className="back" onClick={onLeave}>
        ‹ Leave room
      </button>
      <h1>Waiting room</h1>

      {isHost && (
        <div className="room-code">
          <span className="room-code-label">Room code</span>
          <span className="room-code-value">{code}</span>
          <button onClick={copyLink}>{copied ? 'Link copied!' : 'Copy invite link'}</button>
          <span className="room-link">{roomLink(code)}</span>
        </div>
      )}

      <div className="players">
        <div className="player-row">
          <span className="dot" style={{ background: me.color }} />
          <strong>{me.name}</strong> <span className="muted">(you{isHost ? ', host' : ''})</span>
        </div>
        <ColorPicker value={me.color} taken={opponent?.color} onChange={(color) => onUpdate({ ...me, color }, difficulty)} />
        <div className="player-row">
          {opponent ? (
            <>
              <span className="dot" style={{ background: opponent.color }} />
              <strong>{opponent.name}</strong>
              {!isHost && <span className="muted">(host)</span>}
            </>
          ) : (
            <span className="muted waiting">
              <span className="spinner small" aria-hidden /> Waiting for a friend to join…
            </span>
          )}
        </div>
      </div>

      <div className="field">
        <span>Difficulty</span>
        {isHost ? (
          <div className="segmented">
            {DIFFICULTIES.map((d) => (
              <button key={d} className={d === difficulty ? 'segment active' : 'segment'} onClick={() => onUpdate(me, d)}>
                {d}
              </button>
            ))}
          </div>
        ) : (
          <strong>{difficulty}</strong>
        )}
      </div>

      {isHost ? (
        <button className="primary submit" onClick={onStart} disabled={!opponent}>
          Start game
        </button>
      ) : (
        <p className="muted">Waiting for {opponent?.name ?? 'the host'} to start the game…</p>
      )}
    </div>
  )
}
