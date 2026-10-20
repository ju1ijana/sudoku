import { useState } from 'react'
import { Board } from './components/Board'
import { Controls } from './components/Controls'
import { Lobby } from './components/Lobby'
import { Modal } from './components/Modal'
import { RaceTrack } from './components/RaceTrack'
import { Results } from './components/Results'
import { StatusBar } from './components/StatusBar'
import { TwoPlayerSetup } from './components/TwoPlayerSetup'
import { useKeyboard } from './game/useKeyboard'
import { loadProfile, saveProfile, type Player } from './multiplayer/players'
import { emptySnapshot, raceProgress, takeSnapshot } from './multiplayer/protocol'
import { useMatch } from './multiplayer/useMatch'

interface MultiPlayerProps {
  initialCode: string
  onMenu: () => void
}

export function MultiPlayer({ initialCode, onMenu }: MultiPlayerProps) {
  const { state: match, createRoom, joinRoom, startMatch, updateLobby, requestRematch, leave, gameAction } = useMatch()
  const [profile] = useState(loadProfile)
  const [confirmLeave, setConfirmLeave] = useState(false)

  const { phase, game, puzzle } = match

  useKeyboard(phase === 'playing' && game?.status === 'playing' && !confirmLeave, gameAction)

  const remember = (me: Player) => saveProfile(me)

  const backToMenu = () => {
    leave()
    onMenu()
  }

  if (match.error) {
    return (
      <main className="app">
        <Modal
          title="Two players"
          actions={
            <button className="primary" onClick={leave}>
              OK
            </button>
          }
        >
          <p>{match.error}</p>
        </Modal>
      </main>
    )
  }

  if (phase === 'idle' || phase === 'connecting') {
    return (
      <main className="app">
        <TwoPlayerSetup
          profile={profile}
          initialCode={initialCode}
          connecting={phase === 'connecting'}
          onCreate={(me, difficulty) => {
            remember(me)
            createRoom(me, difficulty)
          }}
          onJoin={(code, me) => {
            remember(me)
            joinRoom(code, me)
          }}
          onBack={backToMenu}
        />
      </main>
    )
  }

  if (phase === 'lobby') {
    return (
      <main className="app">
        <Lobby
          match={match}
          onUpdate={(me, difficulty) => {
            remember(me)
            updateLobby(me, difficulty)
          }}
          onStart={() => void startMatch()}
          onLeave={leave}
        />
      </main>
    )
  }

  if (phase === 'results') {
    return (
      <main className="app">
        <Results match={match} onRematch={requestRematch} onMenu={backToMenu} />
      </main>
    )
  }

  // Countdown or racing.
  const mine = game ? takeSnapshot(game) : puzzle ? emptySnapshot(puzzle) : null
  const theirs = match.opponentSnapshot
  const racers =
    puzzle && mine && theirs && match.opponent
      ? [
          { player: match.me, isMe: true, mistakes: mine.mistakes, ...raceProgress(puzzle, mine) },
          { player: match.opponent, isMe: false, mistakes: theirs.mistakes, ...raceProgress(puzzle, theirs) },
        ]
      : []

  return (
    <main className="app">
      <div className="race-layout">
        <RaceTrack racers={racers} />
        <div className="game">
          <div className="board-column">
            <div className="board-wrap">
              {game ? (
                <Board
                  cells={game.cells}
                  selected={game.selected}
                  onSelect={(index) => gameAction({ type: 'select', index })}
                />
              ) : (
                <div className="board placeholder" />
              )}
              {phase === 'countdown' && (
                <div className="board-overlay countdown">
                  <span className="countdown-number">{match.countdown}</span>
                  Get ready…
                </div>
              )}
            </div>
          </div>

          <aside className="side-panel">
            {game && (
              <>
                <StatusBar game={game} showDifficulty />
                <Controls
                  game={game}
                  onInput={(digit) => gameAction({ type: 'input', digit })}
                  onErase={() => gameAction({ type: 'erase' })}
                  onToggleNotes={() => gameAction({ type: 'toggleNotes' })}
                  mainButton={{ label: 'Leave game', onClick: () => setConfirmLeave(true) }}
                />
              </>
            )}
          </aside>
        </div>
      </div>

      {confirmLeave && (
        <Modal
          title="Leave the game?"
          actions={
            <>
              <button onClick={() => setConfirmLeave(false)}>Stay</button>
              <button className="primary" onClick={backToMenu}>
                Leave
              </button>
            </>
          }
        >
          <p>{match.opponent?.name ?? 'Your opponent'} will win the race.</p>
        </Modal>
      )}
    </main>
  )
}
