import { useState, useEffect, useRef } from 'react'
import { MapPin, X, Search, Loader2 } from 'lucide-react'
import type { Location } from '../types/weather'

interface GeoResult {
  name: string
  country: string
  admin1?: string
  latitude: number
  longitude: number
}

interface LocationEditorProps {
  location: Location
  onSave: (loc: Location) => void
  onClose: () => void
}

async function geocodeSearch(query: string): Promise<GeoResult[]> {
  if (query.trim().length < 2) return []
  const params = new URLSearchParams({
    name: query.trim(),
    count: '6',
    language: 'en',
    format: 'json',
  })
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.results ?? []).map((r: Record<string, unknown>) => ({
    name: r.name as string,
    country: r.country as string,
    admin1: r.admin1 as string | undefined,
    latitude: r.latitude as number,
    longitude: r.longitude as number,
  }))
}

export default function LocationEditor({ location, onSave, onClose }: LocationEditorProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [searching, setSearching] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [lat, setLat] = useState(location.latitude.toString())
  const [lon, setLon] = useState(location.longitude.toString())
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const res = await geocodeSearch(query)
      setResults(res)
      setSearching(false)
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const selectResult = (r: GeoResult) => {
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    onSave({ latitude: r.latitude, longitude: r.longitude, name: label })
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lon)
    if (isNaN(latitude) || isNaN(longitude)) return
    onSave({ latitude, longitude, name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}` })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[15vh] backdrop-blur-sm">
      <div className="glass-card w-full max-w-sm p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MapPin size={18} className="text-accent-light" />
            Change Location
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {!manualMode ? (
          <>
            {/* Search input */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-navy-700 bg-navy-800 py-2.5 pl-9 pr-9 text-sm text-white outline-none placeholder:text-slate-500 focus:border-accent"
                placeholder="Search city, e.g. New York"
              />
              {searching && (
                <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-500" />
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <ul className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-navy-700 bg-navy-800">
                {results.map((r, i) => (
                  <li key={`${r.latitude}-${r.longitude}-${i}`}>
                    <button
                      onClick={() => selectResult(r)}
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-navy-700"
                    >
                      <MapPin size={14} className="mt-0.5 shrink-0 text-accent-light" />
                      <div>
                        <span className="font-medium text-white">{r.name}</span>
                        <span className="ml-1 text-slate-400">
                          {[r.admin1, r.country].filter(Boolean).join(', ')}
                        </span>
                        <p className="font-mono text-[11px] text-slate-500">
                          {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {query.length >= 2 && !searching && results.length === 0 && (
              <p className="mt-3 text-center text-sm text-slate-500">No results found</p>
            )}

            <button
              onClick={() => setManualMode(true)}
              className="mt-3 w-full text-center text-xs text-slate-500 transition hover:text-slate-300"
            >
              Or enter coordinates manually →
            </button>
          </>
        ) : (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Latitude</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 font-mono text-sm text-white outline-none focus:border-accent"
                  placeholder="51.7725"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Longitude</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 font-mono text-sm text-white outline-none focus:border-accent"
                  placeholder="0.1082"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="flex-1 rounded-lg border border-navy-700 py-2 text-sm text-slate-300 transition hover:bg-navy-700"
              >
                ← Search
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-white transition hover:bg-accent-light"
              >
                Update
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
