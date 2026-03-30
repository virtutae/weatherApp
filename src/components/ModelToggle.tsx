import clsx from 'clsx'
import { WEATHER_MODELS } from '../config/models'

interface ModelToggleProps {
  activeModels: Set<string>
  onToggle: (modelId: string) => void
}

export default function ModelToggle({ activeModels, onToggle }: ModelToggleProps) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Models
      </h2>
      <div className="flex flex-wrap gap-2">
        {WEATHER_MODELS.map((model) => {
          const active = activeModels.has(model.id)
          return (
            <button
              key={model.id}
              onClick={() => onToggle(model.id)}
              className={clsx(
                'flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
                active
                  ? 'border-transparent bg-navy-700/80 text-white'
                  : 'border-navy-700 bg-transparent text-slate-500 hover:text-slate-300'
              )}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full transition-opacity"
                style={{
                  backgroundColor: model.colour,
                  opacity: active ? 1 : 0.3,
                }}
              />
              {model.name}
              {model.thick && (
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                  UK
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
