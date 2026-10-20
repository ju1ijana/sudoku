const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function EraserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden {...stroke}>
      <path d="M13.6 4.4a1.6 1.6 0 0 1 2.3 0l3.7 3.7a1.6 1.6 0 0 1 0 2.3L11.5 18.5H8L4.4 14.9a1.6 1.6 0 0 1 0-2.3z" />
      <path d="M8.6 9.4l6 6" />
      <path d="M14 20.5h6" />
    </svg>
  )
}

export function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden {...stroke}>
      <path d="M15.6 4.6a2 2 0 0 1 2.8 2.8L8.5 17.3l-3.8 1 1-3.8z" />
      <path d="M13.8 6.4l2.8 2.8" />
      <path d="M13 20.5h7" />
    </svg>
  )
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 43 43" width="36" height="36" aria-hidden>
      <path
        fill="currentColor"
        d="M33.082 12.87a1.5 1.5 0 0 1 2.246 1.98l-.124.142L19.56 30.635a1.5 1.5 0 0 1-1.98.125l-.142-.125-7.324-7.324a1.5 1.5 0 0 1 1.98-2.246l.141.124 6.264 6.263z"
      />
    </svg>
  )
}

export function PauseIcon() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden>
      <rect x="2.5" y="1.5" width="1.6" height="9" rx="0.8" fill="currentColor" />
      <rect x="7.9" y="1.5" width="1.6" height="9" rx="0.8" fill="currentColor" />
    </svg>
  )
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden>
      <path d="M3 1.8v8.4a.6.6 0 0 0 .9.5l6.6-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5z" fill="currentColor" />
    </svg>
  )
}
