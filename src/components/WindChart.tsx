import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import { WEATHER_MODELS } from '../config/models'
import type { EnsemblePoint } from '../types/weather'

interface WindChartProps {
  timeline: EnsemblePoint[]
  activeModels: Set<string>
}

export default function WindChart({ timeline, activeModels }: WindChartProps) {
  if (timeline.length === 0) return null

  const data = timeline.map((pt) => {
    const row: Record<string, unknown> = {
      time: pt.time,
      label: format(pt.date, 'EEE HH:mm'),
    }
    for (const model of WEATHER_MODELS) {
      if (activeModels.has(model.id)) {
        row[model.id] = pt.models[model.id]?.wind_speed_10m ?? null
      }
    }
    return row
  })

  const now = Date.now()
  const nowIdx = timeline.reduce(
    (best, pt, i) =>
      Math.abs(pt.date.getTime() - now) < Math.abs(timeline[best].date.getTime() - now)
        ? i
        : best,
    0
  )
  const nowLabel = data[nowIdx]?.label as string

  return (
    <div className="glass-card animate-fade-in-up p-4 sm:p-5" style={{ animationDelay: '0.5s' }}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Wind Speed
      </h2>
      <div className="h-56 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={60}
            />
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit=" km/h"
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={{
                background: '#1E293B',
                border: '1px solid #475569',
                borderRadius: '12px',
                fontSize: '12px',
                fontFamily: '"JetBrains Mono", monospace',
              }}
              labelStyle={{ color: '#94A3B8', marginBottom: 4 }}
            />
            {WEATHER_MODELS.filter((m) => activeModels.has(m.id)).map((model) => (
              <Line
                key={model.id}
                dataKey={model.id}
                name={model.name}
                stroke={model.colour}
                strokeWidth={model.thick ? 2.5 : 1.5}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
            <ReferenceLine
              x={nowLabel}
              stroke="#6366F1"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Now',
                position: 'top',
                fill: '#818CF8',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
