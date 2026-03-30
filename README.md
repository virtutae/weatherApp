# ◐ Ensemble

**A multi-model weather forecast app that shows you where weather models agree — and where they don't.**

Most weather apps show you a single forecast and call it a day. Ensemble takes a different approach: it fetches predictions from **five independent weather models** and displays them side by side, so you can see the full range of what the atmosphere might do.

---

## Why This App Exists

Weather forecasting is not a solved problem. Different models use different physics, different resolutions, and different assumptions about the atmosphere. Sometimes they all agree — and you can trust the forecast. Sometimes they wildly disagree — and that disagreement *is* the forecast: genuine uncertainty.

Ensemble gives you that information instead of hiding it behind a single number.

---

## Features

- **5 weather models** fetched in parallel from the [Open-Meteo API](https://open-meteo.com) (no API key needed)
- **Model agreement indicator** — at a glance, see if models agree (HIGH/MODERATE/LOW)
- **Interactive ensemble charts** — temperature, wind speed, and precipitation probability with all model lines overlaid
- **Rolling time windows** — toggle between 24 hours, 3 days, and 7 days (see [Legend](#legend) below)
- **7-day overview** — daily summary cards with highs, lows, rain chance, and model spread
- **Model toggle bar** — enable/disable individual models to focus on the ones you care about
- **City search** — type a city name to switch location (uses Open-Meteo geocoding)
- **Android app + home screen widget** — installable APK with a native weather widget
- **iOS app + WidgetKit extension** — Capacitor-based, requires Xcode to build
- **Fully responsive** — works on desktop and mobile browsers
- **Dark theme** — atmospheric instrument-panel aesthetic, easy on the eyes

---

## The Models

| Colour | Model | Provider | Notes |
|--------|-------|----------|-------|
| 🔴 `#E8573A` | ECMWF IFS | European Centre for Medium-Range Weather Forecasts | Generally considered the world's best global model |
| 🔵 `#3A8FE8` | GFS | NOAA (US National Weather Service) | Widely used, good global coverage |
| 🟢 `#4ADE80` | ICON | DWD (German Weather Service) | Strong in Europe, high resolution |
| 🟣 `#C084FC` | ARPEGE | Météo-France | French national model, good for Western Europe |
| 🟡 `#F59E0B` | UKMO | UK Met Office | **Highlighted with a thicker line** — most relevant for UK locations |

---

## Legend

### What the numbers mean

- **Ensemble Mean** — The average temperature across all active models. This is the "best guess" but it hides disagreement.
- **Range (e.g. 12°–16°)** — The spread between the coldest and warmest model predictions for the same hour. A tight range means agreement; a wide range means uncertainty.
- **±X.X° (on daily cards)** — Average model spread for that day. Think of it as a confidence margin.

### Model Agreement Badge

Shown on the current conditions card. Calculated from the average temperature spread across all models for the next 24 hours:

| Badge | Spread | Meaning |
|-------|--------|---------|
| 🟢 **HIGH** | < 1.5°C | Models broadly agree. The forecast is likely reliable. |
| 🟡 **MODERATE** | 1.5–3°C | Some divergence. The general trend is clear but details may vary. |
| 🔴 **LOW** | ≥ 3°C | Models significantly disagree. The weather is genuinely uncertain — take any single number with a grain of salt. |

### Time Range Toggle (24h / 3 Days / 7 Days)

These are **rolling windows from the current time**, not calendar days. If you open the app at 14:00:

- **24h** shows from 14:00 today to 14:00 tomorrow
- **3 Days** shows the next 72 hours
- **7 Days** shows the full forecast

This avoids the problem of "Today" showing only 15 minutes of data if you check at 23:45.

### Charts

- **Temperature Ensemble** — The shaded area shows the min/max spread across models. Individual coloured lines show each model's prediction. A dashed purple "Now" line marks the current time.
- **Wind Speed** — Same multi-model overlay for wind at 10m height (km/h).
- **Precipitation Probability** — Grouped bars comparing each model's rain probability (%). Downsampled to 3-hour intervals for readability.

### Why some things look "off"

- **Models can disagree a lot** — This is real. If one model shows 8°C and another shows 14°C for the same hour, that's the actual state of the science. It doesn't mean the app is broken.
- **UK Met Office line is thicker** — Intentional. For UK locations, the Met Office model has the highest resolution and is most likely to be accurate.
- **Some models may fail to load** — Open-Meteo occasionally has issues with specific models. The app shows whatever loaded successfully and reports errors for failures. This is by design — partial data is better than no data.
- **Temperature spread can be 0°** — If all models agree exactly, the range collapses. This is a good thing.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| Charts | Recharts |
| Icons | lucide-react |
| Dates | date-fns |
| Native wrapper | Capacitor 8 |
| Android widget | Kotlin (AppWidgetProvider) |
| iOS widget | SwiftUI (WidgetKit) |
| Weather API | [Open-Meteo](https://open-meteo.com) (free, no key) |
| Geocoding API | [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) (free, no key) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install and run

```bash
git clone https://github.com/yourusername/ensemble-weather.git
cd ensemble-weather
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for production

```bash
npm run build
npm run preview
```

### Build Android APK

Requires Android Studio (for the JDK and SDK):

```bash
npm run build
npx cap sync android
export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"  # adjust for your system
cd android && ./gradlew assembleDebug
```

The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.

Install on a connected device:

```bash
adb install app-debug.apk
```

### Build iOS (requires Mac)

```bash
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode, add the `EnsembleWidget` target (File → New → Target → Widget Extension), replace the generated code with `ios/App/EnsembleWidget/EnsembleWidget.swift`, configure the App Group `group.com.ensemble.weather`, and build.

---

## Project Structure

```
src/
  types/weather.ts             — TypeScript interfaces
  config/models.ts             — Model configs, WMO weather codes
  hooks/useWeatherData.ts      — Data fetching, timeline merging, ensemble stats
  components/
    Header.tsx                 — App name, location button, refresh
    CurrentConditions.tsx      — Current temp, agreement badge, wind, humidity
    DayOverview.tsx            — 7-day summary grid
    ModelToggle.tsx            — Enable/disable individual models
    TimeRangeToggle.tsx        — 24h / 3 Days / 7 Days selector
    TemperatureChart.tsx       — Ensemble temperature chart
    WindChart.tsx              — Multi-model wind chart
    PrecipChart.tsx            — Precipitation probability bars
    LocationEditor.tsx         — City search + manual coordinate entry
    Footer.tsx                 — Ensemble forecasting explainer
  App.tsx                      — Root component
android/                       — Capacitor Android project + widget
ios/                           — Capacitor iOS project + WidgetKit extension
```

---

## Default Location

Harlow, UK (51.7725°N, 0.1082°E). Change it by tapping the location pill in the header.

---

## License

MIT

---

## Credits

- Weather data: [Open-Meteo](https://open-meteo.com) — free and open-source weather API
- Built with [Vite](https://vite.dev), [React](https://react.dev), [Capacitor](https://capacitorjs.com), [Recharts](https://recharts.org)
