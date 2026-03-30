import WidgetKit
import SwiftUI

// MARK: - Data Models

struct WeatherEntry: TimelineEntry {
    let date: Date
    let temperature: Double?
    let tempMin: Double?
    let tempMax: Double?
    let tempSpread: Double?
    let windSpeed: Double?
    let weatherCode: Int?
    let condition: String
    let emoji: String
    let locationName: String
    let isPlaceholder: Bool
}

// MARK: - WMO Weather Codes

func wmoInfo(_ code: Int) -> (String, String) {
    switch code {
    case 0: return ("Clear", "☀️")
    case 1: return ("Mostly Clear", "🌤️")
    case 2: return ("Partly Cloudy", "⛅")
    case 3: return ("Overcast", "☁️")
    case 45, 48: return ("Fog", "🌫️")
    case 51, 53, 55: return ("Drizzle", "🌦️")
    case 61, 63, 65: return ("Rain", "🌧️")
    case 71, 73, 75: return ("Snow", "🌨️")
    case 80, 81, 82: return ("Showers", "🌦️")
    case 95, 96, 99: return ("Thunderstorm", "⛈️")
    default: return ("Unknown", "🌡️")
    }
}

// MARK: - Timeline Provider

struct EnsembleProvider: TimelineProvider {
    let models = ["ecmwf_ifs025", "gfs_seamless", "icon_seamless", "meteofrance_seamless", "ukmo_seamless"]

    func placeholder(in context: Context) -> WeatherEntry {
        WeatherEntry(
            date: Date(), temperature: 14, tempMin: 12, tempMax: 16,
            tempSpread: 1.2, windSpeed: 12, weatherCode: 0,
            condition: "Clear", emoji: "☀️", locationName: "Harlow, UK",
            isPlaceholder: true
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (WeatherEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WeatherEntry>) -> Void) {
        Task {
            let entry = await fetchEnsembleData()
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }

    func fetchEnsembleData() async -> WeatherEntry {
        let defaults = UserDefaults(suiteName: "group.com.ensemble.weather")
        let lat = defaults?.double(forKey: "latitude") ?? 51.7725
        let lon = defaults?.double(forKey: "longitude") ?? 0.1082
        let locationName = defaults?.string(forKey: "location_name") ?? "Harlow, UK"

        var allTemps: [Double] = []
        var allWinds: [Double] = []
        var firstWeatherCode: Int? = nil

        await withTaskGroup(of: (Double?, Double?, Int?).self) { group in
            for model in models {
                group.addTask {
                    return await fetchModel(model: model, lat: lat, lon: lon)
                }
            }
            for await (temp, wind, code) in group {
                if let t = temp { allTemps.append(t) }
                if let w = wind { allWinds.append(w) }
                if firstWeatherCode == nil, let c = code { firstWeatherCode = c }
            }
        }

        guard !allTemps.isEmpty else {
            return WeatherEntry(
                date: Date(), temperature: nil, tempMin: nil, tempMax: nil,
                tempSpread: nil, windSpeed: nil, weatherCode: nil,
                condition: "No data", emoji: "⚠️", locationName: locationName,
                isPlaceholder: false
            )
        }

        let mean = allTemps.reduce(0, +) / Double(allTemps.count)
        let min = allTemps.min()!
        let max = allTemps.max()!
        let spread = max - min
        let windMean = allWinds.isEmpty ? nil : allWinds.reduce(0, +) / Double(allWinds.count)

        let code = firstWeatherCode ?? 0
        let (condition, emoji) = wmoInfo(code)

        return WeatherEntry(
            date: Date(), temperature: mean, tempMin: min, tempMax: max,
            tempSpread: spread, windSpeed: windMean, weatherCode: code,
            condition: condition, emoji: emoji, locationName: locationName,
            isPlaceholder: false
        )
    }

    func fetchModel(model: String, lat: Double, lon: Double) async -> (Double?, Double?, Int?) {
        let urlStr = "https://api.open-meteo.com/v1/forecast?latitude=\(lat)&longitude=\(lon)&hourly=temperature_2m,wind_speed_10m,weather_code&models=\(model)&timezone=Europe/London&forecast_days=1"
        guard let url = URL(string: urlStr) else { return (nil, nil, nil) }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let hourly = json["hourly"] as? [String: Any] else { return (nil, nil, nil) }

            // Find current hour index
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd'T'HH"
            let nowPrefix = formatter.string(from: Date())

            let timeKey = findKey(hourly: hourly, base: "time", model: model)
            guard let times = hourly[timeKey] as? [String] else { return (nil, nil, nil) }

            var idx = 0
            for (i, t) in times.enumerated() {
                if t.hasPrefix(nowPrefix) { idx = i; break }
            }

            let tempKey = findKey(hourly: hourly, base: "temperature_2m", model: model)
            let windKey = findKey(hourly: hourly, base: "wind_speed_10m", model: model)
            let codeKey = findKey(hourly: hourly, base: "weather_code", model: model)

            let temp = (hourly[tempKey] as? [Double])?[safe: idx]
            let wind = (hourly[windKey] as? [Double])?[safe: idx]
            let code = (hourly[codeKey] as? [Int])?[safe: idx]

            return (temp, wind, code)
        } catch {
            return (nil, nil, nil)
        }
    }

    func findKey(hourly: [String: Any], base: String, model: String) -> String {
        if hourly[base] != nil { return base }
        return hourly.keys.first { $0.hasPrefix(base) && $0.contains(model) } ?? base
    }
}

extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

// MARK: - Widget Views

struct EnsembleWidgetView: View {
    let entry: WeatherEntry
    @Environment(\.widgetFamily) var family

    var agreementColor: Color {
        guard let spread = entry.tempSpread else { return .gray }
        if spread < 1.5 { return .green }
        if spread < 3.0 { return .orange }
        return .red
    }

    var agreementLabel: String {
        guard let spread = entry.tempSpread else { return "—" }
        if spread < 1.5 { return "HIGH" }
        if spread < 3.0 { return "MODERATE" }
        return "LOW"
    }

    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(
                    LinearGradient(
                        colors: [Color(hex: "0B0F1A"), Color(hex: "111827")],
                        startPoint: .top, endPoint: .bottom
                    )
                )

            VStack(alignment: .leading, spacing: 6) {
                // Header
                HStack {
                    Text("◐ Ensemble")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Color(hex: "818CF8"))
                    Spacer()
                    Text(entry.locationName)
                        .font(.system(size: 10))
                        .foregroundColor(Color(hex: "94A3B8"))
                        .lineLimit(1)
                }

                HStack(alignment: .top, spacing: 10) {
                    // Emoji + temp
                    HStack(alignment: .top, spacing: 8) {
                        Text(entry.emoji)
                            .font(.system(size: family == .systemSmall ? 28 : 36))

                        VStack(alignment: .leading, spacing: 2) {
                            HStack(alignment: .firstTextBaseline, spacing: 2) {
                                Text(entry.temperature != nil ? "\(Int(entry.temperature!.rounded()))" : "—")
                                    .font(.system(size: family == .systemSmall ? 32 : 38, weight: .bold, design: .monospaced))
                                    .foregroundColor(.white)
                                Text("°C")
                                    .font(.system(size: 16))
                                    .foregroundColor(Color(hex: "64748B"))
                            }
                            Text(entry.condition)
                                .font(.system(size: 11))
                                .foregroundColor(Color(hex: "94A3B8"))
                        }
                    }

                    if family != .systemSmall {
                        Spacer()
                        VStack(alignment: .trailing, spacing: 3) {
                            if let min = entry.tempMin, let max = entry.tempMax {
                                Text("\(Int(min.rounded()))°–\(Int(max.rounded()))° range")
                                    .font(.system(size: 10, design: .monospaced))
                                    .foregroundColor(Color(hex: "64748B"))
                            }
                            if let wind = entry.windSpeed {
                                Text("💨 \(Int(wind.rounded())) km/h")
                                    .font(.system(size: 10))
                                    .foregroundColor(Color(hex: "94A3B8"))
                            }
                            HStack(spacing: 3) {
                                Circle()
                                    .fill(agreementColor)
                                    .frame(width: 6, height: 6)
                                Text("\(agreementLabel) agreement")
                                    .font(.system(size: 9, weight: .semibold))
                                    .foregroundColor(agreementColor)
                            }
                        }
                    }
                }

                if family == .systemSmall {
                    HStack(spacing: 3) {
                        Circle()
                            .fill(agreementColor)
                            .frame(width: 5, height: 5)
                        Text("\(agreementLabel)")
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundColor(agreementColor)
                    }
                }
            }
            .padding(14)
        }
    }
}

// MARK: - Color Hex Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: Double
        r = Double((int >> 16) & 0xFF) / 255.0
        g = Double((int >> 8) & 0xFF) / 255.0
        b = Double(int & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}

// MARK: - Widget Definition

@main
struct EnsembleWeatherWidget: Widget {
    let kind = "EnsembleWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: EnsembleProvider()) { entry in
            EnsembleWidgetView(entry: entry)
        }
        .configurationDisplayName("Ensemble Weather")
        .description("Multi-model weather forecast showing where models agree and disagree.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
