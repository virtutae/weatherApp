import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { WEATHER_MODELS } from '../config/models'
import type { EnsemblePoint } from '../types/weather'

interface PrecipChartProps {
  timeline: EnsemblePoint[]
  activeModels: Set<string>
}

export default function PrecipChart({ timeline, activeModels }: PrecipChartProps) {
  if (timeline.length === 0) return null

  // Downsample to every 3 hours for readable bars
  const data = timeline
    .filter((_, i) => i % 3 === 0)
    .map((pt) => {
      const row: Record<string, unknown> = {
        time: pt.time,
        label: format(pt.date, 'EEE HH:mm'),
      }
      for (const model of WEATHER_MODELS) {
        if (activeModels.has(model.id)) {
          row[model.id] = pt.models[model.id]?.precipitation_probability ?? null
        }
      }
      return row
    })

  return (
    <div className="glass-card animate-fade-in-up p-4 sm:p-5" style={{ animationDelay: '0.6s' }}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Precipitation Probability
      </h2>
      <div className="h-56 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={80}
            />
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit="%"
              domain={[0, 100]}
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
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              iconType="circle"
              iconSize={8}
            />
            {WEATHER_MODELS.filter((m) => activeModels.has(m.id)).map((model) => (
              <Bar
                key={model.id}
                dataKey={model.id}
                name={model.name}
                fill={model.colour}
                fillOpacity={0.7}
                radius={[2, 2, 0, 0]}
                maxBarSize={8}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
