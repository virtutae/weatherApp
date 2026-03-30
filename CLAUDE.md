# Ensemble — Multi-Model Weather Forecast App

## What this project is
A weather forecast app that fetches data from 5 weather models via the Open-Meteo API and displays them as an ensemble, showing where models agree and disagree. Built with React + TypeScript + Vite, wrapped as a native Android app via Capacitor.

## Tech stack
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4 (using `@tailwindcss/vite` plugin — no tailwind.config.js or postcss.config.js)
- **Charts**: Recharts
- **Icons**: lucide-react
- **Dates**: date-fns
- **Native**: Capacitor 8 (Android + iOS)
- **Android widget**: Kotlin (AppWidgetProvider)
- **iOS widget**: SwiftUI (WidgetKit) — requires Mac with Xcode to build

## Project structure
```
src/
  types/weather.ts          — TypeScript interfaces
  config/models.ts          — 5 weather model configs, WMO codes, helpers
  hooks/useWeatherData.ts   — API fetching, timeline merging, ensemble stats
  components/
    Header.tsx              — App name, location, refresh
    CurrentConditions.tsx   — Ensemble mean temp, agreement badge
    DayOverview.tsx         — 7-day horizontal grid
    ModelToggle.tsx         — Toggle individual models on/off
    TimeRangeToggle.tsx     — 24h / 3 Days / 7 Days rolling window
    TemperatureChart.tsx    — Multi-model temp ensemble chart
    WindChart.tsx           — Multi-model wind chart
    PrecipChart.tsx         — Precipitation probability bars
    LocationEditor.tsx      — Search by city name (Open-Meteo geocoding) or manual lat/lon
    Footer.tsx              — Ensemble forecasting explainer
  App.tsx                   — Main composition
android/                    — Capacitor Android project
  app/src/main/java/com/ensemble/weather/widget/EnsembleWidget.kt  — Android widget
ios/                        — Capacitor iOS project
  App/EnsembleWidget/       — iOS WidgetKit extension (Swift)
```

## API
- Weather: `https://api.open-meteo.com/v1/forecast` — no API key needed
- Geocoding: `https://geocoding-api.open-meteo.com/v1/search` — no API key needed
- **Important quirk**: When requesting a specific model, Open-Meteo sometimes returns hourly keys suffixed with the model name (e.g. `temperature_2m_ecmwf_ifs025`). Always check plain key first, then search for suffixed key.

## Weather models
| Model ID | Name | Colour | Notes |
|---|---|---|---|
| ecmwf_ifs025 | ECMWF IFS | #E8573A | |
| gfs_seamless | NOAA GFS | #3A8FE8 | |
| icon_seamless | DWD ICON | #4ADE80 | |
| meteofrance_seamless | Météo-France | #C084FC | |
| ukmo_seamless | UK Met Office | #F59E0B | Thicker line (2.5px), most important for UK |

## Build commands
```bash
npm run dev              # Start Vite dev server
npm run build            # TypeScript check + Vite build
npm run cap:sync         # Build web + sync to native projects
```

## Building the Android APK
```bash
npm run build && npx cap sync android
export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"
cd android && ./gradlew assembleDebug
```
APK output: `android/app/build/outputs/apk/debug/app-debug.apk`
Copy to Desktop: `cp android/app/build/outputs/apk/debug/app-debug.apk C:/Users/virtu/Desktop/ensemble-weather.apk`

## Installing on Android phone via ADB
```powershell
.\adb install C:\Users\virtu\Desktop\ensemble-weather.apk
```
(Run from the platform-tools directory, or use full path to adb.exe)

## Design
- Dark theme: navy gradient (#0B0F1A → #111827), frosted glass cards
- Fonts: Outfit (headings/UI), JetBrains Mono (data values)
- Accent: indigo #6366F1
- Default location: Harlow, UK (51.7725, 0.1082)
- Default chart view: 3 Days
- Time ranges are rolling windows (24h/72h/168h from now), not calendar-day based
