import { COLORS } from '../multiplayer/players'

interface ColorPickerProps {
  value: string
  taken?: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, taken, onChange }: ColorPickerProps) {
  return (
    <div className="color-picker" role="radiogroup" aria-label="Colour">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={color === value}
          aria-label={color === taken ? `${color} (taken)` : color}
          title={color === taken ? 'Taken by the other player' : undefined}
          className={color === value ? 'swatch selected' : 'swatch'}
          style={{ background: color }}
          disabled={color === taken}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  )
}
