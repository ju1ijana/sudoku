interface StartScreenProps {
  onSinglePlayer: () => void
  onTwoPlayers: () => void
}

export function StartScreen({ onSinglePlayer, onTwoPlayers }: StartScreenProps) {
  return (
    <div className="start-screen">
      <h1>Sudoku</h1>
      <button className="menu-button primary" onClick={onSinglePlayer}>
        Single player
      </button>
      <button className="menu-button" onClick={onTwoPlayers}>
        Two players
      </button>
    </div>
  )
}
