import { describe, it, expect } from 'vitest'
import type { EnsemblePoint, DaySummary } from '../types/weather'

// Test the ensemble calculation logic in isolation
// These mirror the functions inside useWeatherData.ts

function calcStats(values: number[]) {
  if (values.length === 0) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return { mean, min, max, spread: max - min }
}

describe('calcStats', () => {
  it('returns null for empty array', () => {
    expect(calcStats([])).toBeNull()
  })

  it('calculates correct stats for single value', () => {
    const result = calcStats([15])
    expect(result).toEqual({ mean: 15, min: 15, max: 15, spread: 0 })
  })

  it('calculates correct stats for multiple values', () => {
    const result = calcStats([10, 14, 12, 16, 13])
    expect(result!.min).toBe(10)
    expect(result!.max).toBe(16)
    expect(result!.spread).toBe(6)
    expect(result!.mean).toBe(13)
  })

  it('handles negative temperatures', () => {
    const result = calcStats([-5, -2, -8, 0, -3])
    expect(result!.min).toBe(-8)
    expect(result!.max).toBe(0)
    expect(result!.spread).toBe(8)
  })

  it('handles identical values (perfect agreement)', () => {
    const result = calcStats([12, 12, 12, 12, 12])
    expect(result!.spread).toBe(0)
    expect(result!.mean).toBe(12)
  })
})

describe('agreement level logic', () => {
  function getAgreementLevel(spread: number): 'HIGH' | 'MODERATE' | 'LOW' {
    if (spread < 1.5) return 'HIGH'
    if (spread < 3) return 'MODERATE'
    return 'LOW'
  }

  it('HIGH when spread < 1.5°C', () => {
    expect(getAgreementLevel(0)).toBe('HIGH')
    expect(getAgreementLevel(1)).toBe('HIGH')
    expect(getAgreementLevel(1.4)).toBe('HIGH')
  })

  it('MODERATE when spread 1.5–3°C', () => {
    expect(getAgreementLevel(1.5)).toBe('MODERATE')
    expect(getAgreementLevel(2)).toBe('MODERATE')
    expect(getAgreementLevel(2.9)).toBe('MODERATE')
  })

  it('LOW when spread >= 3°C', () => {
    expect(getAgreementLevel(3)).toBe('LOW')
    expect(getAgreementLevel(5)).toBe('LOW')
    expect(getAgreementLevel(10)).toBe('LOW')
  })
})

describe('time range filtering', () => {
  function filterByHours(
    points: { date: Date }[],
    now: Date,
    hours: number
  ) {
    const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000)
    return points.filter((pt) => pt.date >= now && pt.date <= cutoff)
  }

  it('24h window filters correctly', () => {
    const now = new Date('2025-06-15T14:00:00')
    const points = [
      { date: new Date('2025-06-15T10:00:00') }, // before now — excluded
      { date: new Date('2025-06-15T15:00:00') }, // within 24h
      { date: new Date('2025-06-16T13:00:00') }, // within 24h
      { date: new Date('2025-06-16T14:00:00') }, // exactly at cutoff — included
      { date: new Date('2025-06-16T15:00:00') }, // beyond 24h — excluded
    ]
    const result = filterByHours(points, now, 24)
    expect(result).toHaveLength(3)
  })

  it('3-day window = 72 hours', () => {
    const now = new Date('2025-06-15T14:00:00')
    const points = [
      { date: new Date('2025-06-16T14:00:00') }, // day 1
      { date: new Date('2025-06-17T14:00:00') }, // day 2
      { date: new Date('2025-06-18T14:00:00') }, // day 3 — exactly at cutoff
      { date: new Date('2025-06-18T15:00:00') }, // beyond — excluded
    ]
    const result = filterByHours(points, now, 72)
    expect(result).toHaveLength(3)
  })
})

describe('API key suffixing logic', () => {
  function findValue(
    hourly: Record<string, unknown[]>,
    param: string,
    index: number,
    modelId: string
  ): number | null {
    const plain = hourly[param]
    if (plain && plain[index] !== undefined && plain[index] !== null) {
      return plain[index] as number
    }
    for (const key of Object.keys(hourly)) {
      if (key.startsWith(param) && key.includes(modelId)) {
        const val = hourly[key]?.[index]
        return val !== undefined && val !== null ? (val as number) : null
      }
    }
    return null
  }

  it('finds plain key first', () => {
    const hourly = { temperature_2m: [15.5, 16.0] }
    expect(findValue(hourly, 'temperature_2m', 0, 'ecmwf_ifs025')).toBe(15.5)
  })

  it('falls back to suffixed key', () => {
    const hourly = { temperature_2m_ecmwf_ifs025: [14.2, 15.0] }
    expect(findValue(hourly, 'temperature_2m', 0, 'ecmwf_ifs025')).toBe(14.2)
  })

  it('returns null when key not found', () => {
    const hourly = { temperature_2m_gfs_seamless: [14.2] }
    expect(findValue(hourly, 'temperature_2m', 0, 'ecmwf_ifs025')).toBeNull()
  })

  it('returns null for null values in array', () => {
    const hourly = { temperature_2m: [null, 16.0] }
    expect(findValue(hourly, 'temperature_2m', 0, 'ecmwf_ifs025')).toBeNull()
  })

  it('prefers plain key over suffixed', () => {
    const hourly = {
      temperature_2m: [10.0],
      temperature_2m_ecmwf_ifs025: [20.0],
    }
    expect(findValue(hourly, 'temperature_2m', 0, 'ecmwf_ifs025')).toBe(10.0)
  })
})
