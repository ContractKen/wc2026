import { TIMEZONES, resolveZone } from '../data/timezones'

interface Props {
  tzId: string
  onChange: (id: string) => void
}

export function TimezonePicker({ tzId, onChange }: Props) {
  const resolved = resolveZone(tzId)
  return (
    <label className="tz">
      <span className="tz__label">🌐 Time zone</span>
      <select value={tzId} onChange={(e) => onChange(e.target.value)}>
        {TIMEZONES.map((tz) => (
          <option key={tz.id} value={tz.id}>
            {tz.label}
          </option>
        ))}
      </select>
      {tzId === 'auto' && <span className="tz__resolved">{resolved}</span>}
    </label>
  )
}
