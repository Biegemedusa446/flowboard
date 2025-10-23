import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { FaSun, FaCloud, FaCloudRain, FaSnowflake, FaMoon } from 'react-icons/fa'
import '../css/WeatherCol.css'
import nightRain from '../assets/icons/weather-rain-showers-night.svg'

export default function WeatherCol({ apiBase }) {
  const [data, setData] = useState(null)
  const [days, setDays] = useState(1)
  const [loading, setLoading] = useState(true)

  async function loadWeather(daysCount = 1) {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:5000/api/weather?city=Berlin&days=${daysCount}`)
      if (!res.ok) throw new Error('backend error')
      const json = await res.json()

      // normalize data
      const mapped = {
        location: json.resolvedAddress || 'Berlin',
        days: (json.days || []).map(d => ({
          date: d.datetime,
          high: Math.round(d.tempmax),
          low: Math.round(d.tempmin),
          current: Math.round(d.temp),
          humidity: Math.round(d.humidity),
          precip: Math.round(d.precipprob || 0),
          conditions: d.conditions || 'Clear',
          hours: (d.hours || []).map(h => ({
            time: h.datetime, // may be "03:00:00" or "2025-08-18T03:00:00"
            temp: Math.round(h.temp),
            humidity: Math.round(h.humidity),
            precip: Math.round(h.precipprob || 0),
            conditions: h.conditions,
          })),
        })),
      }

      setData(mapped)
    } catch (e) {
      console.error('Weather fetch failed', e)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWeather(1)
  }, [apiBase])

  // robust night check (handles both HH:mm:ss and full ISO)
  function isNight(timeStr, dateStr = null) {
    let parsed

    if (timeStr.includes('T')) {
      // full ISO timestamp
      parsed = dayjs(timeStr)
    } else if (dateStr) {
      // combine date + time if only HH:mm:ss is given
      parsed = dayjs(`${dateStr} ${timeStr}`, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DDTHH:mm'])
    } else {
      // fallback: just parse time
      parsed = dayjs(timeStr, ['HH:mm:ss'])
    }

    if (!parsed.isValid()) return false

    const hour = parsed.hour()
    return hour < 6 || hour >= 21
  }

  function getConditionClass(condition, timeStr, isHourly, dateStr = null) {
    if (!condition) return 'cloud'
    const c = condition.toLowerCase()
    const night = isNight(timeStr, dateStr)

    const isClear = c.includes('clear') || c.includes('sun')
    const isCloudy = c.includes('cloud') || c.includes('overcast')
    const isRain = c.includes('rain') || c.includes('shower')
    const isSnow = c.includes('snow')

    if (isHourly) {
      if (isClear) return night ? 'night' : 'sun'
      if (isCloudy) return night ? 'night' : 'cloud'
      if (isRain) return 'rain'
      if (isSnow) return 'snow'
    } else {
      if (isClear) return 'sun'
      if (isCloudy) return 'cloud'
      if (isRain) return 'rain'
      if (isSnow) return 'snow'
    }

    return 'cloud'
  }

  function getWeatherIcon(condition, timeStr, isHourly, dateStr = null) {
    if (!condition) return null
    const c = condition.toLowerCase()
    const night = isNight(timeStr, dateStr)

    const isClear = c.includes('clear') || c.includes('sun')
    const isCloudy = c.includes('cloud') || c.includes('overcast')
    const isRain = c.includes('rain') || c.includes('shower')
    const isSnow = c.includes('snow')

    // Hourly forecast (time-based icons)
    if (isHourly) {
      if (night) {
        if (isRain) return <FaCloudRain className="icon rain" />
        if (isSnow) return <FaSnowflake className="icon snow" />
        if (isCloudy) {
          return <img src={nightRain} alt="Rain at night" className="icon svg" />
        }
        if (isClear) return <FaMoon className="icon night" />
      } else {
        if (isClear) return <FaSun className="icon sun" />
        if (isCloudy) return <FaCloud className="icon cloud" />
        if (isRain) return <FaCloudRain className="icon rain" />
        if (isSnow) return <FaSnowflake className="icon snow" />
      }
    }

    if (isClear) return <FaSun className="icon sun" />
    if (isCloudy) return <FaCloud className="icon cloud" />
    if (isRain) return <FaCloudRain className="icon rain" />
    if (isSnow) return <FaSnowflake className="icon snow" />

    return <FaCloud className="icon cloud" />
  }

  if (loading)
    return (
      <div className="weather-card">
        <div className="muted">Loading weather…</div>
      </div>
    )
  if (!data)
    return (
      <div className="weather-card">
        <div className="muted">No weather data available</div>
      </div>
    )

  return (
    <div>
      {/* Toggle Buttons */}
      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <button
          onClick={() => {
            setDays(1)
            loadWeather(1)
          }}
          className={`btn ${days === 1 ? 'accent' : ''}`}
        >
          Today
        </button>
        <button
          onClick={() => {
            setDays(7)
            loadWeather(7)
          }}
          className={`btn ${days === 7 ? 'accent' : ''}`}
        >
          7 Days
        </button>
        <button
          onClick={() => {
            setDays(15)
            loadWeather(15)
          }}
          className={`btn ${days === 15 ? 'accent' : ''}`}
        >
          15 Days
        </button>
      </div>

      {/* Weather list container */}
      <div className="weather-container">
        {days === 1
          ? data.days[0]?.hours
              ?.filter(h => {
                let parsed = dayjs(`${data.days[0].date} ${h.time}`, [
                  'YYYY-MM-DD HH:mm:ss',
                  'YYYY-MM-DDTHH:mm',
                ])
                return parsed.isValid() && parsed.isAfter(dayjs().subtract(1, 'hour'))
              })
              .map((h, idx) => {
                let parsed = dayjs(`${data.days[0].date} ${h.time}`, [
                  'YYYY-MM-DD HH:mm:ss',
                  'YYYY-MM-DDTHH:mm',
                ])
                return (
                  <div
                    key={idx}
                    className={`weather-card ${getConditionClass(h.conditions, h.time, true, data.days[0].date)}`}
                  >
                    <div className="row">
                      <div>
                        <strong>{parsed.isValid() ? parsed.format('HH:mm') : h.time}</strong>
                        <div className="muted">{data.location}</div>
                      </div>
                      <div className="stat">
                        <span className="kpi">{h.temp}°C</span>
                        <span className="muted">{h.conditions}</span>
                        {getWeatherIcon(h.conditions, h.time, true, data.days[0].date)}
                      </div>
                    </div>
                    <div className="row" style={{ marginTop: 8 }}>
                      <div className="muted">
                        Humidity {h.humidity}% · Rain {h.precip}%
                      </div>
                    </div>
                  </div>
                )
              })
          : data.days.map((d, idx) => (
              <div
                key={idx}
                className={`weather-card ${getConditionClass(d.conditions, d.date, false)}`}
              >
                <div className="row">
                  <div>
                    <strong>{dayjs(d.date).format('ddd, MMM D')}</strong>
                    <div className="muted">{data.location}</div>
                  </div>
                  <div className="stat">
                    <span className="kpi">{d.current}°C</span>
                    <span className="muted">{d.conditions}</span>
                    {getWeatherIcon(d.conditions, d.date, false)}
                  </div>
                </div>
                <div className="row" style={{ marginTop: 8 }}>
                  <div>
                    High {d.high}°C / Low {d.low}°C
                  </div>
                  <div className="muted">
                    Humidity {d.humidity}% · Rain {d.precip}%
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}
