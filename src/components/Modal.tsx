import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  children?: ReactNode
  actions: ReactNode
}

export function Modal({ title, children, actions }: ModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <div className="modal-actions">{actions}</div>
      </div>
    </div>
  )
}
