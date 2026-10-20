import { useState } from 'react'
import { StartScreen } from './components/StartScreen'
import { MultiPlayer } from './MultiPlayer'
import { SinglePlayer } from './SinglePlayer'

type Screen = 'menu' | 'single' | 'multi'

// An invite link (?room=CODE) opens the Join form directly.
const inviteCode = new URLSearchParams(location.search).get('room') ?? ''

function App() {
  const [screen, setScreen] = useState<Screen>(inviteCode ? 'multi' : 'menu')

  const toMenu = () => {
    if (location.search) history.replaceState(null, '', location.pathname)
    setScreen('menu')
  }

  if (screen === 'single') return <SinglePlayer onMenu={toMenu} />
  if (screen === 'multi') return <MultiPlayer initialCode={inviteCode} onMenu={toMenu} />
  return (
    <main className="app">
      <StartScreen onSinglePlayer={() => setScreen('single')} onTwoPlayers={() => setScreen('multi')} />
    </main>
  )
}

export default App
