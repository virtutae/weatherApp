export interface Location {
  latitude: number
  longitude: number
  name: string
}

export interface ModelConfig {
  id: string
  name: string
  colour: string
  thick?: boolean
}

export interface HourlyData {
  time: string
  temperature_2m: number | null
  relative_humidity_2m: number | null
  precipitation_probability: number | null
  precipitation: number | null
  wind_speed_10m: number | null
  wind_gusts_10m: number | null
  weather_code: number | null
  apparent_temperature: number | null
  cloud_cover: number | null
  pressure_msl: number | null
}

export interface ModelForecast {
  modelId: string
  hourly: HourlyData[]
}

export interface EnsemblePoint {
  time: string
  date: Date
  models: Record<string, HourlyData>
  ensemble: {
    tempMean: number | null
    tempMin: number | null
    tempMax: number | null
    tempSpread: number | null
    windMean: number | null
    windMin: number | null
    windMax: number | null
  }
}

export interface DaySummary {
  date: string
  dayName: string
  weatherCode: number | null
  tempHigh: number | null
  tempLow: number | null
  precipMax: number | null
  modelSpread: number | null
}

export type LoadingState = 'idle' | 'loading' | 'partial' | 'done' | 'error'
