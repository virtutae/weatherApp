import { RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import type { LoadingState } from '../types/weather'

interface HeaderProps {
  locationName: string
  lastUpdated: Date | null
  loadingState: LoadingState
  loadedCount: number
  totalModels: number
  onRefresh: () => void
  onLocationEdit: () => void
}

export default function Header({
  locationName,
  lastUpdated,
  loadingState,
  loadedCount,
  totalModels,
  onRefresh,
  onLocationEdit,
}: HeaderProps) {
  const isLoading = loadingState === 'loading' || loadingState === 'partial'

  return (
    <header className="animate-fade-in-up flex flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          <span className="text-accent-light">◐</span> Ensemble
        </h1>
        <button
          onClick={onLocationEdit}
          className="rounded-full bg-navy-800 px-3 py-1 text-sm text-slate-300 transition hover:bg-navy-700"
        >
          📍 {locationName}
        </button>
      </div>

      <div className="flex items-center gap-3">
        {isLoading && (
          <span className="font-mono text-xs text-slate-400">
            Loading {loadedCount}/{totalModels} models…
          </span>
        )}
        {lastUpdated && !isLoading && (
          <span className="text-xs text-slate-500">
            Updated {format(lastUpdated, 'HH:mm')}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="rounded-xl bg-navy-800 p-2.5 text-slate-300 transition hover:bg-navy-700 hover:text-white disabled:opacity-40"
          aria-label="Refresh"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
    </header>
  )
}
