import { formatTime } from '../game/format'
import { MAX_MISTAKES } from '../game/types'
import type { MatchState } from '../multiplayer/match'
import { emptySnapshot, raceProgress, snapshotCells, takeSnapshot, type Snapshot } from '../multiplayer/protocol'
import type { Player } from '../multiplayer/players'
import { Board } from './Board'

interface ResultsProps {
  match: MatchState
  onRematch: () => void
  onMenu: () => void
}

function headline(match: MatchState): { title: string; detail: string } {
  const opponent = match.opponent?.name ?? 'Your opponent'
  const { winner, reason } = match.result!
  if (winner === 'me') {
    if (reason === 'eliminated') return { title: 'You won!', detail: `${opponent} made ${MAX_MISTAKES} mistakes.` }
    if (reason === 'left') return { title: 'You won!', detail: `${opponent} left the game.` }
    return { title: 'You won!', detail: 'You finished the puzzle first.' }
  }
  if (reason === 'eliminated') return { title: `${opponent} won`, detail: `You made ${MAX_MISTAKES} mistakes.` }
  return { title: `${opponent} won`, detail: `${opponent} finished the puzzle first.` }
}

interface PlayerResultProps {
  player: Player
  isMe: boolean
  isWinner: boolean
  snapshot: Snapshot
  match: MatchState
}

function PlayerResult({ player, isMe, isWinner, snapshot, match }: PlayerResultProps) {
  const puzzle = match.puzzle!
  const { solved, total } = raceProgress(puzzle, snapshot)
  return (
    <div className="player-result">
      <div className="player-result-header">
        <span className="dot" style={{ background: player.color }} />
        <strong>{player.name}</strong>
        {isMe && <span className="muted">(you)</span>}
        {isWinner && <span className="winner-badge">Winner</span>}
      </div>
      <Board cells={snapshotCells(puzzle, snapshot)} size="mini" />
      <dl className="player-stats">
        <div>
          <dt>Time</dt>
          <dd>{formatTime(snapshot.elapsed)}</dd>
        </div>
        <div>
          <dt>Mistakes</dt>
          <dd>
            {snapshot.mistakes}/{MAX_MISTAKES}
          </dd>
        </div>
        <div>
          <dt>Solved</dt>
          <dd>
            {solved}/{total}
          </dd>
        </div>
      </dl>
    </div>
  )
}

export function Results({ match, onRematch, onMenu }: ResultsProps) {
  const { title, detail } = headline(match)
  const opponentName = match.opponent?.name ?? 'Your opponent'
  const mine = match.game ? takeSnapshot(match.game) : emptySnapshot(match.puzzle!)
  const theirs = match.opponentSnapshot ?? emptySnapshot(match.puzzle!)

  let rematchNote = ''
  if (match.opponentLeft) rematchNote = `${opponentName} has left.`
  else if (match.rematchRequested) rematchNote = 'Starting a new game…'

  return (
    <div className="results">
      <h1>{title}</h1>
      <p className="muted">{detail}</p>

      <div className="results-boards">
        <PlayerResult player={match.me} isMe isWinner={match.result?.winner === 'me'} snapshot={mine} match={match} />
        {match.opponent && (
          <PlayerResult
            player={match.opponent}
            isMe={false}
            isWinner={match.result?.winner === 'opponent'}
            snapshot={theirs}
            match={match}
          />
        )}
      </div>

      <div className="results-actions">
        <button onClick={onMenu}>Main menu</button>
        <button className="primary" onClick={onRematch} disabled={match.rematchRequested || match.opponentLeft}>
          Rematch
        </button>
      </div>
      <p className="rematch-note">{rematchNote}</p>
    </div>
  )
}
