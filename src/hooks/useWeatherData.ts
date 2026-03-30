import { useState, useEffect, useCallback } from 'react'
import { format, parseISO, startOfDay, addHours } from 'date-fns'
import type {
  Location,
  ModelForecast,
  HourlyData,
  EnsemblePoint,
  DaySummary,
  LoadingState,
} from '../types/weather'
import { WEATHER_MODELS, HOURLY_PARAMS, type HourlyParam } from '../config/models'

const API_BASE = 'https://api.open-meteo.com/v1/forecast'

function extractHourlyParam(
  hourlyObj: Record<string, unknown[]>,
  param: HourlyParam,
  index: number,
  modelId: string
): number | null {
  // Check plain key first, then suffixed key
  const plain = hourlyObj[param]
  if (plain && plain[index] !== undefined && plain[index] !== null) {
    return plain[index] as number
  }
  // Search for suffixed key like temperature_2m_ecmwf_ifs025
  for (const key of Object.keys(hourlyObj)) {
    if (key.startsWith(param) && key.includes(modelId)) {
      const val = hourlyObj[key]?.[index]
      return val !== undefined && val !== null ? (val as number) : null
    }
  }
  return null
}

async function fetchModel(
  modelId: string,
  location: Location
): Promise<ModelForecast> {
  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    hourly: HOURLY_PARAMS.join(','),
    models: modelId,
    timezone: 'Europe/London',
    forecast_days: '7',
  })

  const res = await fetch(`${API_BASE}?${params}`)
  if (!res.ok) throw new Error(`${modelId}: HTTP ${res.status}`)
  const data = await res.json()

  const hourlyObj = data.hourly as Record<string, unknown[]>
  // Time array: could be plain or suffixed
  const timeArr = (hourlyObj['time'] ?? []) as string[]

  const hourly: HourlyData[] = timeArr.map((time, i) => ({
    time,
    temperature_2m: extractHourlyParam(hourlyObj, 'temperature_2m', i, modelId),
    relative_humidity_2m: extractHourlyParam(hourlyObj, 'relative_humidity_2m', i, modelId),
    precipitation_probability: extractHourlyParam(hourlyObj, 'precipitation_probability', i, modelId),
    precipitation: extractHourlyParam(hourlyObj, 'precipitation', i, modelId),
    wind_speed_10m: extractHourlyParam(hourlyObj, 'wind_speed_10m', i, modelId),
    wind_gusts_10m: extractHourlyParam(hourlyObj, 'wind_gusts_10m', i, modelId),
    weather_code: extractHourlyParam(hourlyObj, 'weather_code', i, modelId),
    apparent_temperature: extractHourlyParam(hourlyObj, 'apparent_temperature', i, modelId),
    cloud_cover: extractHourlyParam(hourlyObj, 'cloud_cover', i, modelId),
    pressure_msl: extractHourlyParam(hourlyObj, 'pressure_msl', i, modelId),
  }))

  return { modelId, hourly }
}

function calcStats(values: number[]): {
  mean: number
  min: number
  max: number
  spread: number
} | null {
  if (values.length === 0) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return { mean, min, max, spread: max - min }
}

function buildTimeline(
  forecasts: ModelForecast[],
  activeModels: Set<string>
): EnsemblePoint[] {
  const timeMap = new Map<string, Record<string, HourlyData>>()

  for (const fc of forecasts) {
    if (!activeModels.has(fc.modelId)) continue
    for (const h of fc.hourly) {
      if (!timeMap.has(h.time)) timeMap.set(h.time, {})
      timeMap.get(h.time)![fc.modelId] = h
    }
  }

  const sorted = [...timeMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  return sorted.map(([time, models]) => {
    const temps = Object.values(models)
      .map((m) => m.temperature_2m)
      .filter((v): v is number => v !== null)
    const winds = Object.values(models)
      .map((m) => m.wind_speed_10m)
      .filter((v): v is number => v !== null)

    const tempStats = calcStats(temps)
    const windStats = calcStats(winds)

    return {
      time,
      date: parseISO(time),
      models,
      ensemble: {
        tempMean: tempStats?.mean ?? null,
        tempMin: tempStats?.min ?? null,
        tempMax: tempStats?.max ?? null,
        tempSpread: tempStats?.spread ?? null,
        windMean: windStats?.mean ?? null,
        windMin: windStats?.min ?? null,
        windMax: windStats?.max ?? null,
      },
    }
  })
}

function buildDaySummaries(
  timeline: EnsemblePoint[],
  activeModels: Set<string>
): DaySummary[] {
  const dayMap = new Map<string, EnsemblePoint[]>()

  for (const pt of timeline) {
    const dayKey = format(pt.date, 'yyyy-MM-dd')
    if (!dayMap.has(dayKey)) dayMap.set(dayKey, [])
    dayMap.get(dayKey)!.push(pt)
  }

  return [...dayMap.entries()].map(([dateStr, points]) => {
    const date = parseISO(dateStr)
    const allTemps: number[] = []
    const allPrecipProb: number[] = []
    const allSpreads: number[] = []
    const weatherCodes: number[] = []

    for (const pt of points) {
      if (pt.ensemble.tempMean !== null) allTemps.push(pt.ensemble.tempMean)
      if (pt.ensemble.tempSpread !== null) allSpreads.push(pt.ensemble.tempSpread)
      for (const modelId of activeModels) {
        const m = pt.models[modelId]
        if (m?.precipitation_probability !== null && m?.precipitation_probability !== undefined)
          allPrecipProb.push(m.precipitation_probability)
        if (m?.weather_code !== null && m?.weather_code !== undefined)
          weatherCodes.push(m.weather_code)
      }
    }

    // Most common weather code around midday
    const middayPoints = points.filter((p) => {
      const h = p.date.getHours()
      return h >= 10 && h <= 16
    })
    let dominantCode: number | null = null
    if (middayPoints.length > 0) {
      const codes = middayPoints.flatMap((p) =>
        Object.values(p.models)
          .map((m) => m.weather_code)
          .filter((c): c is number => c !== null)
      )
      if (codes.length > 0) {
        const freq = new Map<number, number>()
        for (const c of codes) freq.set(c, (freq.get(c) ?? 0) + 1)
        dominantCode = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0]
      }
    }

    return {
      date: dateStr,
      dayName: format(date, 'EEE'),
      weatherCode: dominantCode,
      tempHigh: allTemps.length > 0 ? Math.round(Math.max(...allTemps)) : null,
      tempLow: allTemps.length > 0 ? Math.round(Math.min(...allTemps)) : null,
      precipMax: allPrecipProb.length > 0 ? Math.round(Math.max(...allPrecipProb)) : null,
      modelSpread: allSpreads.length > 0
        ? Math.round((allSpreads.reduce((a, b) => a + b, 0) / allSpreads.length) * 10) / 10
        : null,
    }
  })
}

export function useWeatherData(location: Location) {
  const [forecasts, setForecasts] = useState<ModelForecast[]>([])
  const [activeModels, setActiveModels] = useState<Set<string>>(
    new Set(WEATHER_MODELS.map((m) => m.id))
  )
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [loadedCount, setLoadedCount] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const { latitude, longitude } = location

  const fetchAll = useCallback(async () => {
    setLoadingState('loading')
    setForecasts([])
    setLoadedCount(0)
    setErrors([])

    const collected: ModelForecast[] = []
    const newErrors: string[] = []

    const loc = { latitude, longitude, name: '' }
    const promises = WEATHER_MODELS.map((model) =>
      fetchModel(model.id, loc).then((result) => {
        collected.push(result)
        setForecasts([...collected])
        setLoadedCount(collected.length)
        if (collected.length < WEATHER_MODELS.length) {
          setLoadingState('partial')
        }
        return result
      })
    )

    const results = await Promise.allSettled(promises)
    for (const r of results) {
      if (r.status === 'rejected') {
        newErrors.push(r.reason instanceof Error ? r.reason.message : String(r.reason))
      }
    }

    setErrors(newErrors)
    setLoadingState(collected.length > 0 ? 'done' : 'error')
    setLastUpdated(new Date())
  }, [latitude, longitude])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const timeline = buildTimeline(forecasts, activeModels)
  const daySummaries = buildDaySummaries(timeline, activeModels)

  // Current conditions: find the point closest to now
  const now = new Date()
  let currentPoint: EnsemblePoint | null = null
  let minDiff = Infinity
  for (const pt of timeline) {
    const diff = Math.abs(pt.date.getTime() - now.getTime())
    if (diff < minDiff) {
      minDiff = diff
      currentPoint = pt
    }
  }

  // Model agreement: avg spread over next 24h
  const next24h = timeline.filter(
    (pt) => pt.date >= now && pt.date <= addHours(now, 24)
  )
  const avgSpread24h =
    next24h.length > 0
      ? next24h
          .map((pt) => pt.ensemble.tempSpread)
          .filter((v): v is number => v !== null)
          .reduce((a, b, _, arr) => a + b / arr.length, 0)
      : null

  const toggleModel = (modelId: string) => {
    setActiveModels((prev) => {
      const next = new Set(prev)
      if (next.has(modelId)) {
        if (next.size <= 1) return prev // keep at least 1
        next.delete(modelId)
      } else {
        next.add(modelId)
      }
      return next
    })
  }

  return {
    forecasts,
    timeline,
    daySummaries,
    currentPoint,
    avgSpread24h,
    activeModels,
    toggleModel,
    loadingState,
    loadedCount,
    errors,
    lastUpdated,
    refresh: fetchAll,
  }
}
