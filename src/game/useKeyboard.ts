import { useEffect } from 'react'
import type { GameAction } from './state'

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

/** Sends keyboard input to the game while `enabled`. */
export function useKeyboard(enabled: boolean, dispatch: (action: GameAction) => void) {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.target instanceof HTMLInputElement) return
      const action = keyToAction(e)
      if (!action) return
      e.preventDefault()
      dispatch(action)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, dispatch])
}
