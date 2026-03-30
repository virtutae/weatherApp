import clsx from 'clsx'
import { format, parseISO, isToday } from 'date-fns'
import type { DaySummary } from '../types/weather'
import { getWeatherEmoji } from '../config/models'

interface DayOverviewProps {
  days: DaySummary[]
}

export default function DayOverview({ days }: DayOverviewProps) {
  if (days.length === 0) return null

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
        7-Day Overview
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-7 sm:gap-2 sm:overflow-visible">
        {days.map((day) => {
          const date = parseISO(day.date)
          const today = isToday(date)
          return (
            <div
              key={day.date}
              className={clsx(
                'glass-card flex min-w-[100px] shrink-0 flex-col items-center gap-1.5 px-3 py-3 sm:min-w-0',
                today && 'ring-1 ring-accent/50'
              )}
            >
              <span className={clsx('text-xs font-semibold', today ? 'text-accent-light' : 'text-slate-400')}>
                {today ? 'Today' : day.dayName}
              </span>
              <span className="text-2xl">{getWeatherEmoji(day.weatherCode)}</span>
              <div className="font-mono text-sm">
                <span className="font-semibold text-white">{day.tempHigh ?? '—'}°</span>
                <span className="text-slate-500"> / </span>
                <span className="text-slate-400">{day.tempLow ?? '—'}°</span>
              </div>
              {day.precipMax !== null && day.precipMax > 0 && (
                <span className="text-xs text-blue-400">💧 {day.precipMax}%</span>
              )}
              {day.modelSpread !== null && (
                <span
                  className={clsx(
                    'text-[10px] font-mono',
                    day.modelSpread < 1.5
                      ? 'text-emerald-500'
                      : day.modelSpread < 3
                        ? 'text-amber-400'
                        : 'text-red-400'
                  )}
                >
                  ±{day.modelSpread.toFixed(1)}°
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
