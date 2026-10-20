import { useState, type FormEvent } from 'react'
import { DIFFICULTIES, type Difficulty } from '../game/types'
import { MAX_NAME_LENGTH, cleanName, type Player } from '../multiplayer/players'
import { ROOM_CODE_LENGTH, normalizeRoomCode } from '../multiplayer/protocol'
import { ColorPicker } from './ColorPicker'

interface TwoPlayerSetupProps {
  profile: Player
  initialCode: string
  connecting: boolean
  onCreate: (me: Player, difficulty: Difficulty) => void
  onJoin: (code: string, me: Player) => void
  onBack: () => void
}

export function TwoPlayerSetup({ profile, initialCode, connecting, onCreate, onJoin, onBack }: TwoPlayerSetupProps) {
  const [tab, setTab] = useState<'create' | 'join'>(initialCode ? 'join' : 'create')
  const [name, setName] = useState(profile.name)
  const [color, setColor] = useState(profile.color)
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [code, setCode] = useState(normalizeRoomCode(initialCode))

  const me = { name: cleanName(name), color }
  const valid = me.name !== '' && (tab === 'create' || code.length === ROOM_CODE_LENGTH)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid || connecting) return
    if (tab === 'create') onCreate(me, difficulty)
    else onJoin(code, me)
  }

  return (
    <div className="setup">
      <button className="back" onClick={onBack}>
        ‹ Menu
      </button>
      <h1>Two players</h1>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'create'}
          className={tab === 'create' ? 'tab active' : 'tab'}
          onClick={() => setTab('create')}
        >
          Create room
        </button>
        <button
          role="tab"
          aria-selected={tab === 'join'}
          className={tab === 'join' ? 'tab active' : 'tab'}
          onClick={() => setTab('join')}
        >
          Join room
        </button>
      </div>

      <form className="setup-form" onSubmit={submit}>
        {tab === 'join' && (
          <label className="field">
            <span>Room code</span>
            <input
              className="code-input"
              value={code}
              onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
              placeholder="K7QX"
              autoFocus={!code}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        )}

        <label className="field">
          <span>Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            placeholder="Name"
            autoFocus={tab === 'create' || !!code}
            autoComplete="off"
          />
        </label>

        <div className="field">
          <span>Your colour</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        {tab === 'create' && (
          <div className="field">
            <span>Difficulty</span>
            <div className="segmented">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={d === difficulty ? 'segment active' : 'segment'}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="primary submit" disabled={!valid || connecting}>
          {connecting ? 'Connecting…' : tab === 'create' ? 'Create room' : 'Join room'}
        </button>
      </form>
    </div>
  )
}
