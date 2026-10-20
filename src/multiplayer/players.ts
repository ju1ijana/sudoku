export const COLORS = ['#325aaf', '#e5484d', '#30a46c', '#f76808', '#8e4ec6', '#d6409f', '#0d9488', '#d4a000'] as const

export interface Player {
  name: string
  color: string
}

export const MAX_NAME_LENGTH = 16

const PROFILE_KEY = 'sudoku.profile'

/** Keeps `player`'s colour unless `taken` already uses it, otherwise picks the first free one. */
export function withFreeColor(player: Player, taken: string | undefined): Player {
  if (player.color !== taken && COLORS.includes(player.color as (typeof COLORS)[number])) return player
  return { ...player, color: COLORS.find((c) => c !== taken) ?? COLORS[0] }
}

export function cleanName(name: string): string {
  return name.trim().slice(0, MAX_NAME_LENGTH)
}

export function loadProfile(): Player {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null')
    if (typeof saved?.name === 'string' && typeof saved?.color === 'string') return withFreeColor(saved, undefined)
  } catch {
    // Fall through to the default.
  }
  return { name: '', color: COLORS[0] }
}

export function saveProfile(player: Player): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(player))
  } catch {
    // Remembering the profile is optional.
  }
}
