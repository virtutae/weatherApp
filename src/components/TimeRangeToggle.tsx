import clsx from 'clsx'

export type TimeRange = 'today' | '3d' | '7d'

interface TimeRangeToggleProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
}

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'today', label: '24h' },
  { value: '3d', label: '3 Days' },
  { value: '7d', label: '7 Days' },
]

export default function TimeRangeToggle({ value, onChange }: TimeRangeToggleProps) {
  return (
    <div className="flex gap-1 rounded-xl bg-navy-800/60 p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
            value === opt.value
              ? 'bg-accent text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
