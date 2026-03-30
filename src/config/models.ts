import type { ModelConfig, Location } from '../types/weather'

export const WEATHER_MODELS: ModelConfig[] = [
  { id: 'ecmwf_ifs025', name: 'ECMWF IFS', colour: '#E8573A' },
  { id: 'gfs_seamless', name: 'NOAA GFS', colour: '#3A8FE8' },
  { id: 'icon_seamless', name: 'DWD ICON', colour: '#4ADE80' },
  { id: 'meteofrance_seamless', name: 'Météo-France', colour: '#C084FC' },
  { id: 'ukmo_seamless', name: 'UK Met Office', colour: '#F59E0B', thick: true },
]

export const DEFAULT_LOCATION: Location = {
  latitude: 51.7725,
  longitude: 0.1082,
  name: 'Harlow, UK',
}

export const HOURLY_PARAMS = [
  'temperature_2m',
  'relative_humidity_2m',
  'precipitation_probability',
  'precipitation',
  'wind_speed_10m',
  'wind_gusts_10m',
  'weather_code',
  'apparent_temperature',
  'cloud_cover',
  'pressure_msl',
] as const

export type HourlyParam = (typeof HOURLY_PARAMS)[number]

export const WMO_CODES: Record<number, { label: string; emoji: string }> = {
  0: { label: 'Clear', emoji: '☀️' },
  1: { label: 'Mostly Clear', emoji: '🌤️' },
  2: { label: 'Partly Cloudy', emoji: '⛅' },
  3: { label: 'Overcast', emoji: '☁️' },
  45: { label: 'Fog', emoji: '🌫️' },
  48: { label: 'Fog', emoji: '🌫️' },
  51: { label: 'Drizzle', emoji: '🌦️' },
  53: { label: 'Drizzle', emoji: '🌦️' },
  55: { label: 'Drizzle', emoji: '🌦️' },
  61: { label: 'Rain', emoji: '🌧️' },
  63: { label: 'Rain', emoji: '🌧️' },
  65: { label: 'Heavy Rain', emoji: '🌧️' },
  71: { label: 'Snow', emoji: '🌨️' },
  73: { label: 'Snow', emoji: '🌨️' },
  75: { label: 'Heavy Snow', emoji: '🌨️' },
  80: { label: 'Showers', emoji: '🌦️' },
  81: { label: 'Showers', emoji: '🌦️' },
  82: { label: 'Heavy Showers', emoji: '🌦️' },
  95: { label: 'Thunderstorm', emoji: '⛈️' },
  96: { label: 'Thunderstorm', emoji: '⛈️' },
  99: { label: 'Thunderstorm', emoji: '⛈️' },
}

export function getWeatherEmoji(code: number | null): string {
  if (code === null) return '—'
  return WMO_CODES[code]?.emoji ?? '🌡️'
}

export function getWeatherLabel(code: number | null): string {
  if (code === null) return 'Unknown'
  return WMO_CODES[code]?.label ?? 'Unknown'
}
