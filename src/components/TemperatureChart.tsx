import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { format } from 'date-fns'
import { WEATHER_MODELS } from '../config/models'
import type { EnsemblePoint } from '../types/weather'

interface TemperatureChartProps {
  timeline: EnsemblePoint[]
  activeModels: Set<string>
}

export default function TemperatureChart({ timeline, activeModels }: TemperatureChartProps) {
  if (timeline.length === 0) return null

  const data = timeline.map((pt) => {
    const row: Record<string, unknown> = {
      time: pt.time,
      label: format(pt.date, 'EEE HH:mm'),
      tempMin: pt.ensemble.tempMin,
      tempMax: pt.ensemble.tempMax,
    }
    for (const model of WEATHER_MODELS) {
      if (activeModels.has(model.id)) {
        row[model.id] = pt.models[model.id]?.temperature_2m ?? null
      }
    }
    return row
  })

  // Find "now" index
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
    <div className="glass-card animate-fade-in-up p-4 sm:p-5" style={{ animationDelay: '0.4s' }}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Temperature Ensemble
      </h2>
      <div className="h-64 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <defs>
              <linearGradient id="tempSpread" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
              unit="°"
              domain={['auto', 'auto']}
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
              itemStyle={{ padding: '1px 0' }}
            />
            <Area
              dataKey="tempMax"
              stroke="none"
              fill="url(#tempSpread)"
              fillOpacity={1}
              isAnimationActive={false}
            />
            <Area
              dataKey="tempMin"
              stroke="none"
              fill="#0B0F1A"
              fillOpacity={0.8}
              isAnimationActive={false}
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
