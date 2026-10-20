import { useEffect, useState } from 'react'
import { Board } from './components/Board'
import { Controls } from './components/Controls'
import { DifficultyBar } from './components/DifficultyBar'
import { PlayIcon } from './components/Icons'
import { Modal } from './components/Modal'
import { StatusBar } from './components/StatusBar'
import { formatTime } from './game/format'
import { DIFFICULTIES, MAX_MISTAKES, type Difficulty } from './game/types'
import { useGame } from './game/useGame'
import type { GameAction } from './game/state'
import type { GameState } from './game/types'

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

/** Maps a key press to a game action; handles both the number row and the numpad. */
function keyToAction(e: KeyboardEvent): GameAction | null {
  if (e.key in ARROWS) {
    const [dRow, dCol] = ARROWS[e.key]
    return { type: 'move', dRow, dCol }
  }
  const digit = /^(?:Digit|Numpad)([1-9])$/.exec(e.code)?.[1] ?? (/^[1-9]$/.test(e.key) ? e.key : null)
  if (digit) return { type: 'input', digit: Number(digit) }
  if (e.key === 'Backspace' || e.key === 'Delete') return { type: 'erase' }
  if (e.key === 'n' || e.key === 'N') return { type: 'toggleNotes' }
  return null
}

/** Whether starting a new game would throw away anything the player did. */
function hasProgress(game: GameState | null): boolean {
  return (
    game?.status === 'playing' &&
    (game.mistakes > 0 || game.cells.some((c) => !c.given && (c.value !== 0 || c.notes.length > 0)))
  )
}

function App() {
  const { game, dispatch, difficulty, loading, error, startGame } = useGame()
  const [choosingDifficulty, setChoosingDifficulty] = useState(false)
  const [confirmDifficulty, setConfirmDifficulty] = useState<Difficulty | null>(null)

  const newGame = (d: Difficulty) => {
    setChoosingDifficulty(false)
    setConfirmDifficulty(null)
    void startGame(d)
  }

  const requestNewGame = (d: Difficulty) => {
    if (hasProgress(game)) setConfirmDifficulty(d)
    else newGame(d)
  }

  const acceptsKeys =
    game?.status === 'playing' && !game.paused && !loading && !choosingDifficulty && !confirmDifficulty && !error
  useEffect(() => {
    if (!acceptsKeys) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const action = keyToAction(e)
      if (!action) return
      e.preventDefault()
      dispatch(action)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [acceptsKeys, dispatch])

  return (
    <main className="app">
      <div className="game">
        <div className="board-column">
          <DifficultyBar current={difficulty} onSelect={requestNewGame} />
          <div className="board-wrap">
            {game ? (
              <Board game={game} onSelect={(index) => dispatch({ type: 'select', index })} />
            ) : (
              <div className="board placeholder" />
            )}
            {loading && (
              <div className="board-overlay">
                <div className="spinner" aria-hidden />
                Finding a{difficulty === 'Easy' ? 'n' : ''} {difficulty} puzzle…
              </div>
            )}
            {!loading && game?.paused && (
              <div className="board-overlay">
                <button className="resume" onClick={() => dispatch({ type: 'togglePause' })} aria-label="Resume">
                  <PlayIcon />
                </button>
              </div>
            )}
          </div>
        </div>

        {game && (
          <aside className="side-panel">
            <StatusBar game={game} onTogglePause={() => dispatch({ type: 'togglePause' })} />
            <Controls
              game={game}
              onInput={(digit) => dispatch({ type: 'input', digit })}
              onErase={() => dispatch({ type: 'erase' })}
              onToggleNotes={() => dispatch({ type: 'toggleNotes' })}
              onNewGame={() => setChoosingDifficulty(true)}
            />
          </aside>
        )}
      </div>

      {confirmDifficulty && (
        <Modal
          title={`Start a new ${confirmDifficulty} game?`}
          actions={
            <>
              <button onClick={() => setConfirmDifficulty(null)}>Cancel</button>
              <button className="primary" onClick={() => newGame(confirmDifficulty)}>
                New game
              </button>
            </>
          }
        >
          <p>Your current progress will be lost.</p>
        </Modal>
      )}

      {choosingDifficulty && (
        <Modal
          title="New Game"
          actions={
            <button onClick={() => setChoosingDifficulty(false)}>Cancel</button>
          }
        >
          {hasProgress(game) && <p>Your current progress will be lost.</p>}
          <div className="difficulty-list">
            {DIFFICULTIES.map((d) => (
              <button key={d} className="primary" onClick={() => newGame(d)}>
                {d}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {error && !loading && (
        <Modal
          title="Couldn't load a puzzle"
          actions={
            <button className="primary" onClick={() => newGame(difficulty)}>
              Try again
            </button>
          }
        >
          <p>{error}. Check your internet connection and try again.</p>
        </Modal>
      )}

      {game?.status === 'won' && !loading && !choosingDifficulty && (
        <Modal
          title="You solved it!"
          actions={
            <>
              <button onClick={() => setChoosingDifficulty(true)}>Change difficulty</button>
              <button className="primary" onClick={() => newGame(game.puzzle.difficulty)}>
                New {game.puzzle.difficulty} game
              </button>
            </>
          }
        >
          <p>
            {game.puzzle.difficulty} puzzle solved in <strong>{formatTime(game.elapsed)}</strong> with{' '}
            <strong>{game.mistakes}</strong> mistake{game.mistakes === 1 ? '' : 's'}.
          </p>
        </Modal>
      )}

      {game?.status === 'lost' && !loading && !choosingDifficulty && (
        <Modal
          title="Game over"
          actions={
            <>
              <button onClick={() => setChoosingDifficulty(true)}>New game</button>
              <button className="primary" onClick={() => dispatch({ type: 'restart' })}>
                Try again
              </button>
            </>
          }
        >
          <p>You made {MAX_MISTAKES} mistakes. Try this puzzle again from the start, or start a new one.</p>
        </Modal>
      )}
    </main>
  )
}

export default App
