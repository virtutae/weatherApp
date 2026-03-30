import { describe, it, expect } from 'vitest'
import {
  WEATHER_MODELS,
  DEFAULT_LOCATION,
  HOURLY_PARAMS,
  WMO_CODES,
  getWeatherEmoji,
  getWeatherLabel,
} from './models'

describe('WEATHER_MODELS', () => {
  it('has exactly 5 models', () => {
    expect(WEATHER_MODELS).toHaveLength(5)
  })

  it('each model has id, name, and colour', () => {
    for (const model of WEATHER_MODELS) {
      expect(model.id).toBeTruthy()
      expect(model.name).toBeTruthy()
      expect(model.colour).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('ukmo_seamless is marked as thick', () => {
    const ukmo = WEATHER_MODELS.find((m) => m.id === 'ukmo_seamless')
    expect(ukmo).toBeDefined()
    expect(ukmo!.thick).toBe(true)
  })

  it('only ukmo is thick', () => {
    const thickModels = WEATHER_MODELS.filter((m) => m.thick)
    expect(thickModels).toHaveLength(1)
    expect(thickModels[0].id).toBe('ukmo_seamless')
  })

  it('has all expected model IDs', () => {
    const ids = WEATHER_MODELS.map((m) => m.id)
    expect(ids).toContain('ecmwf_ifs025')
    expect(ids).toContain('gfs_seamless')
    expect(ids).toContain('icon_seamless')
    expect(ids).toContain('meteofrance_seamless')
    expect(ids).toContain('ukmo_seamless')
  })
})

describe('DEFAULT_LOCATION', () => {
  it('defaults to Harlow, UK', () => {
    expect(DEFAULT_LOCATION.name).toBe('Harlow, UK')
    expect(DEFAULT_LOCATION.latitude).toBeCloseTo(51.7725, 4)
    expect(DEFAULT_LOCATION.longitude).toBeCloseTo(0.1082, 4)
  })
})

describe('HOURLY_PARAMS', () => {
  it('includes all required parameters', () => {
    expect(HOURLY_PARAMS).toContain('temperature_2m')
    expect(HOURLY_PARAMS).toContain('relative_humidity_2m')
    expect(HOURLY_PARAMS).toContain('precipitation_probability')
    expect(HOURLY_PARAMS).toContain('wind_speed_10m')
    expect(HOURLY_PARAMS).toContain('weather_code')
    expect(HOURLY_PARAMS).toContain('apparent_temperature')
    expect(HOURLY_PARAMS).toContain('pressure_msl')
  })
})

describe('WMO_CODES', () => {
  it('maps code 0 to Clear', () => {
    expect(WMO_CODES[0]).toEqual({ label: 'Clear', emoji: '☀️' })
  })

  it('maps thunderstorm codes', () => {
    for (const code of [95, 96, 99]) {
      expect(WMO_CODES[code].label).toContain('Thunderstorm')
      expect(WMO_CODES[code].emoji).toBe('⛈️')
    }
  })

  it('maps rain codes', () => {
    for (const code of [61, 63, 65]) {
      expect(WMO_CODES[code].emoji).toBe('🌧️')
    }
  })
})

describe('getWeatherEmoji', () => {
  it('returns emoji for valid code', () => {
    expect(getWeatherEmoji(0)).toBe('☀️')
    expect(getWeatherEmoji(3)).toBe('☁️')
    expect(getWeatherEmoji(61)).toBe('🌧️')
  })

  it('returns dash for null', () => {
    expect(getWeatherEmoji(null)).toBe('—')
  })

  it('returns fallback for unknown code', () => {
    expect(getWeatherEmoji(999)).toBe('🌡️')
  })
})

describe('getWeatherLabel', () => {
  it('returns label for valid code', () => {
    expect(getWeatherLabel(0)).toBe('Clear')
    expect(getWeatherLabel(3)).toBe('Overcast')
  })

  it('returns Unknown for null', () => {
    expect(getWeatherLabel(null)).toBe('Unknown')
  })

  it('returns Unknown for unrecognised code', () => {
    expect(getWeatherLabel(999)).toBe('Unknown')
  })
})
