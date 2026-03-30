package com.ensemble.weather.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.ensemble.weather.MainActivity
import com.ensemble.weather.R
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import org.json.JSONObject
import kotlin.concurrent.thread
import kotlin.math.roundToInt

class EnsembleWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        private val MODELS = arrayOf(
            "ecmwf_ifs025", "gfs_seamless", "icon_seamless",
            "meteofrance_seamless", "ukmo_seamless"
        )

        private val WMO_CODES = mapOf(
            0 to Pair("Clear", "☀️"),
            1 to Pair("Mostly Clear", "🌤️"),
            2 to Pair("Partly Cloudy", "⛅"),
            3 to Pair("Overcast", "☁️"),
            45 to Pair("Fog", "🌫️"),
            48 to Pair("Fog", "🌫️"),
            51 to Pair("Drizzle", "🌦️"),
            53 to Pair("Drizzle", "🌦️"),
            55 to Pair("Drizzle", "🌦️"),
            61 to Pair("Rain", "🌧️"),
            63 to Pair("Rain", "🌧️"),
            65 to Pair("Heavy Rain", "🌧️"),
            71 to Pair("Snow", "🌨️"),
            73 to Pair("Snow", "🌨️"),
            75 to Pair("Heavy Snow", "🌨️"),
            80 to Pair("Showers", "🌦️"),
            81 to Pair("Showers", "🌦️"),
            82 to Pair("Heavy Showers", "🌦️"),
            95 to Pair("Thunderstorm", "⛈️"),
            96 to Pair("Thunderstorm", "⛈️"),
            99 to Pair("Thunderstorm", "⛈️")
        )

        fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_ensemble)

            // Tap opens the app
            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

            // Load saved location or default to Harlow
            val prefs = context.getSharedPreferences("ensemble_widget", Context.MODE_PRIVATE)
            val lat = prefs.getFloat("latitude", 51.7725f)
            val lon = prefs.getFloat("longitude", 0.1082f)
            val locationName = prefs.getString("location_name", "Harlow, UK") ?: "Harlow, UK"

            views.setTextViewText(R.id.widget_location, locationName)

            // Show loading state then fetch in background
            appWidgetManager.updateAppWidget(appWidgetId, views)

            thread {
                try {
                    val temps = mutableListOf<Double>()
                    val winds = mutableListOf<Double>()
                    var weatherCode = 0
                    var condition = "Clear"
                    var emoji = "☀️"

                    for (model in MODELS) {
                        try {
                            val urlStr = "https://api.open-meteo.com/v1/forecast" +
                                "?latitude=$lat&longitude=$lon" +
                                "&hourly=temperature_2m,wind_speed_10m,weather_code" +
                                "&models=$model&timezone=Europe/London&forecast_days=1"

                            val url = URL(urlStr)
                            val conn = url.openConnection() as HttpURLConnection
                            conn.connectTimeout = 8000
                            conn.readTimeout = 8000

                            val json = conn.inputStream.bufferedReader().readText()
                            conn.disconnect()

                            val data = JSONObject(json)
                            val hourly = data.getJSONObject("hourly")

                            // Find current hour index
                            val timeKey = if (hourly.has("time")) "time" else {
                                hourly.keys().asSequence().firstOrNull { it.startsWith("time") } ?: continue
                            }
                            val times = hourly.getJSONArray(timeKey)
                            val now = SimpleDateFormat("yyyy-MM-dd'T'HH", Locale.US).format(Date())
                            var idx = 0
                            for (i in 0 until times.length()) {
                                if (times.getString(i).startsWith(now)) {
                                    idx = i
                                    break
                                }
                            }

                            // Get temp - check plain key first, then suffixed
                            val tempKey = findKey(hourly, "temperature_2m", model)
                            if (tempKey != null) {
                                val tempArr = hourly.getJSONArray(tempKey)
                                if (!tempArr.isNull(idx)) {
                                    temps.add(tempArr.getDouble(idx))
                                }
                            }

                            // Get wind
                            val windKey = findKey(hourly, "wind_speed_10m", model)
                            if (windKey != null) {
                                val windArr = hourly.getJSONArray(windKey)
                                if (!windArr.isNull(idx)) {
                                    winds.add(windArr.getDouble(idx))
                                }
                            }

                            // Get weather code (use first successful model)
                            if (temps.size == 1) {
                                val codeKey = findKey(hourly, "weather_code", model)
                                if (codeKey != null) {
                                    val codeArr = hourly.getJSONArray(codeKey)
                                    if (!codeArr.isNull(idx)) {
                                        weatherCode = codeArr.getInt(idx)
                                        val wmo = WMO_CODES[weatherCode]
                                        if (wmo != null) {
                                            condition = wmo.first
                                            emoji = wmo.second
                                        }
                                    }
                                }
                            }
                        } catch (_: Exception) {
                            // Skip failed model
                        }
                    }

                    if (temps.isNotEmpty()) {
                        val mean = temps.average()
                        val min = temps.min()
                        val max = temps.max()
                        val spread = max - min
                        val windMean = if (winds.isNotEmpty()) winds.average() else 0.0

                        views.setTextViewText(R.id.widget_temp, "${mean.roundToInt()}")
                        views.setTextViewText(R.id.widget_emoji, emoji)
                        views.setTextViewText(R.id.widget_condition, condition)
                        views.setTextViewText(
                            R.id.widget_range,
                            "${min.roundToInt()}°–${max.roundToInt()}° range"
                        )
                        views.setTextViewText(
                            R.id.widget_wind,
                            "\uD83D\uDCA8 ${windMean.roundToInt()} km/h"
                        )

                        val agreementText: String
                        val agreementColor: Int
                        when {
                            spread < 1.5 -> {
                                agreementText = "● HIGH agreement"
                                agreementColor = 0xFF4ADE80.toInt()
                            }
                            spread < 3.0 -> {
                                agreementText = "● MODERATE agreement"
                                agreementColor = 0xFFF59E0B.toInt()
                            }
                            else -> {
                                agreementText = "● LOW agreement"
                                agreementColor = 0xFFEF4444.toInt()
                            }
                        }
                        views.setTextViewText(R.id.widget_agreement, agreementText)
                        views.setTextColor(R.id.widget_agreement, agreementColor)

                        val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
                        views.setTextViewText(R.id.widget_updated, "Updated $timeStr")
                    }

                    appWidgetManager.updateAppWidget(appWidgetId, views)
                } catch (_: Exception) {
                    // Silently fail — widget stays with stale data
                }
            }
        }

        private fun findKey(hourly: JSONObject, base: String, model: String): String? {
            if (hourly.has(base)) return base
            return hourly.keys().asSequence().firstOrNull {
                it.startsWith(base) && it.contains(model)
            }
        }
    }
}
