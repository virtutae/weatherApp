import { useState, useCallback, useMemo } from 'react'
import { Preferences } from '@capacitor/preferences'
import { addHours, addDays } from 'date-fns'
import type { Location } from './types/weather'
import { DEFAULT_LOCATION, WEATHER_MODELS } from './config/models'
import { useWeatherData } from './hooks/useWeatherData'
import Header from './components/Header'
import CurrentConditions from './components/CurrentConditions'
import DayOverview from './components/DayOverview'
import ModelToggle from './components/ModelToggle'
import TimeRangeToggle, { type TimeRange } from './components/TimeRangeToggle'
import TemperatureChart from './components/TemperatureChart'
import WindChart from './components/WindChart'
import PrecipChart from './components/PrecipChart'
import LocationEditor from './components/LocationEditor'
import Footer from './components/Footer'

export default function App() {
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION)
  const [showLocationEditor, setShowLocationEditor] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('3d')

  const saveLocation = useCallback(async (loc: Location) => {
    setLocation(loc)
    // Persist for native widgets
    await Preferences.set({ key: 'latitude', value: loc.latitude.toString() })
    await Preferences.set({ key: 'longitude', value: loc.longitude.toString() })
    await Preferences.set({ key: 'location_name', value: loc.name })
  }, [])

  const {
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
    refresh,
  } = useWeatherData(location)

  const filteredTimeline = useMemo(() => {
    const now = new Date()
    let cutoff: Date
    switch (timeRange) {
      case 'today':
        cutoff = addHours(now, 24)
        break
      case '3d':
        cutoff = addDays(now, 3)
        break
      case '7d':
      default:
        return timeline
    }
    return timeline.filter((pt) => pt.date >= now && pt.date <= cutoff)
  }, [timeline, timeRange])

  return (
    <div className="mx-auto min-h-dvh max-w-5xl pb-4">
      <Header
        locationName={location.name}
        lastUpdated={lastUpdated}
        loadingState={loadingState}
        loadedCount={loadedCount}
        totalModels={WEATHER_MODELS.length}
        onRefresh={refresh}
        onLocationEdit={() => setShowLocationEditor(true)}
      />

      <main className="flex flex-col gap-4 px-4 sm:px-6">
        {errors.length > 0 && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {errors.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
        )}

        <CurrentConditions point={currentPoint} avgSpread24h={avgSpread24h} />
        <DayOverview days={daySummaries} />
        <ModelToggle activeModels={activeModels} onToggle={toggleModel} />

        <div className="animate-fade-in-up flex items-center justify-between" style={{ animationDelay: '0.35s' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Charts
          </h2>
          <TimeRangeToggle value={timeRange} onChange={setTimeRange} />
        </div>

        <TemperatureChart timeline={filteredTimeline} activeModels={activeModels} />
        <WindChart timeline={filteredTimeline} activeModels={activeModels} />
        <PrecipChart timeline={filteredTimeline} activeModels={activeModels} />
      </main>

      <Footer />

      {showLocationEditor && (
        <LocationEditor
          location={location}
          onSave={(loc) => {
            saveLocation(loc)
            setShowLocationEditor(false)
          }}
          onClose={() => setShowLocationEditor(false)}
        />
      )}
    </div>
  )
}
