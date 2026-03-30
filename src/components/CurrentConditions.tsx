import { Thermometer, Wind, Droplets } from 'lucide-react'
import clsx from 'clsx'
import type { EnsemblePoint } from '../types/weather'
import { getWeatherEmoji, getWeatherLabel } from '../config/models'

interface CurrentConditionsProps {
  point: EnsemblePoint | null
  avgSpread24h: number | null
}

function AgreementBadge({ spread }: { spread: number | null }) {
  if (spread === null) return null

  const level =
    spread < 1.5 ? 'HIGH' : spread < 3 ? 'MODERATE' : 'LOW'
  const colorClass =
    spread < 1.5
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      : spread < 3
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        : 'bg-red-500/20 text-red-400 border-red-500/30'

  return (
    <div className={clsx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold', colorClass)}>
      <span className="inline-block h-2 w-2 rounded-full bg-current" />
      {level} agreement
    </div>
  )
}

export default function CurrentConditions({ point, avgSpread24h }: CurrentConditionsProps) {
  if (!point) {
    return (
      <div className="glass-card animate-fade-in-up p-6" style={{ animationDelay: '0.1s' }}>
        <div className="flex h-32 items-center justify-center text-slate-500">
          Loading current conditions…
        </div>
      </div>
    )
  }

  const { ensemble, models } = point
  // Get dominant weather code from models
  const weatherCodes = Object.values(models)
    .map((m) => m.weather_code)
    .filter((c): c is number => c !== null)
  const dominantCode = weatherCodes.length > 0 ? weatherCodes[0] : null

  // Humidity: average across models
  const humidities = Object.values(models)
    .map((m) => m.relative_humidity_2m)
    .filter((v): v is number => v !== null)
  const avgHumidity = humidities.length > 0
    ? Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length)
    : null

  // Feels-like: average
  const feelsLike = Object.values(models)
    .map((m) => m.apparent_temperature)
    .filter((v): v is number => v !== null)
  const avgFeelsLike = feelsLike.length > 0
    ? Math.round(feelsLike.reduce((a, b) => a + b, 0) / feelsLike.length * 10) / 10
    : null

  return (
    <div className="glass-card animate-fade-in-up p-5 sm:p-6" style={{ animationDelay: '0.1s' }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: main temp */}
        <div className="flex items-start gap-4">
          <span className="text-5xl sm:text-6xl">{getWeatherEmoji(dominantCode)}</span>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-5xl font-bold tracking-tight sm:text-6xl">
                {ensemble.tempMean !== null ? Math.round(ensemble.tempMean) : '—'}
              </span>
              <span className="text-2xl text-slate-400">°C</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {getWeatherLabel(dominantCode)}
              {ensemble.tempMin !== null && ensemble.tempMax !== null && (
                <span className="ml-2 font-mono text-xs text-slate-500">
                  {Math.round(ensemble.tempMin)}–{Math.round(ensemble.tempMax)}° range
                </span>
              )}
            </p>
            <div className="mt-2">
              <AgreementBadge spread={avgSpread24h} />
            </div>
          </div>
        </div>

        {/* Right: secondary stats */}
        <div className="flex gap-5 text-sm sm:gap-6">
          <div className="flex items-center gap-2 text-slate-300">
            <Thermometer size={16} className="text-accent-light" />
            <div>
              <p className="text-xs text-slate-500">Feels like</p>
              <p className="font-mono font-semibold">{avgFeelsLike !== null ? `${avgFeelsLike}°` : '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Wind size={16} className="text-accent-light" />
            <div>
              <p className="text-xs text-slate-500">Wind</p>
              <p className="font-mono font-semibold">
                {ensemble.windMean !== null ? `${Math.round(ensemble.windMean)} km/h` : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Droplets size={16} className="text-accent-light" />
            <div>
              <p className="text-xs text-slate-500">Humidity</p>
              <p className="font-mono font-semibold">{avgHumidity !== null ? `${avgHumidity}%` : '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
