import React, { useEffect, useState, useRef } from 'react'
import dayjs from 'dayjs'
import Papa from 'papaparse'
import { Sun, Cloud, CloudRain, Snowflake, Moon, CloudSun, CloudMoon, Search } from 'lucide-react'
import '../css/WeatherCol.css'

export default function WeatherCol({ apiBase, city, onCityChange }) {
  const [data, setData] = useState(null)
  const [days, setDays] = useState(1)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(city)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [cityList, setCityList] = useState([])
  const inputRef = useRef(null)
  const worldCitiesCSV = '/worldcities.csv'

  useEffect(() => {
    Papa.parse(worldCitiesCSV, {
      download: true,
      header: true,
      complete: results => {
        const names = results.data.map(row => row.city?.trim()).filter(Boolean)
        setCityList(names)
      },
      error: err => console.error('❌ CSV parse error:', err),
    })
  }, [])

  async function loadWeather(daysCount = 1, cityName = city) {
    setLoading(true)
    try {
      const res = await fetch(
        `${apiBase}/api/weather?city=${encodeURIComponent(cityName)}&days=${daysCount}`
      )
      if (!res.ok) throw new Error('backend error')
      const json = await res.json()

      const mapped = {
        location: json.resolvedAddress || cityName,
        days: (json.days || []).map(d => ({
          date: d.datetime,
          high: Math.round(d.tempmax),
          low: Math.round(d.tempmin),
          current: Math.round(d.temp),
          humidity: Math.round(d.humidity),
          precip: Math.round(d.precipprob || 0),
          conditions: d.conditions || 'Clear',
          hours: (d.hours || []).map(h => ({
            time: h.datetime,
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
    loadWeather(days, city)
    setQuery(city)
  }, [apiBase, city, days])

  function isNight(timeStr, dateStr = null) {
    let parsed
    if (timeStr.includes('T')) parsed = dayjs(timeStr)
    else if (dateStr)
      parsed = dayjs(`${dateStr} ${timeStr}`, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DDTHH:mm'])
    else parsed = dayjs(timeStr, ['HH:mm:ss'])
    if (!parsed.isValid()) return false
    const hour = parsed.hour()
    return hour < 6 || hour >= 21
  }

  function getConditionClass(condition, timeStr, isHourly, dateStr = null) {
    if (!condition) return 'cloud'
    const c = condition.toLowerCase()
    const night = isNight(timeStr, dateStr)
    if (c.includes('clear') || c.includes('sun')) return night ? 'night' : 'sun'
    if (c.includes('cloud') || c.includes('overcast')) return night ? 'night' : 'cloud'
    if (c.includes('rain') || c.includes('shower')) return 'rain'
    if (c.includes('snow')) return 'snow'
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

    if (isHourly) {
      if (night) {
        if (isRain) return <CloudRain className="icon rain" />
        if (isSnow) return <Snowflake className="icon snow" />
        if (isCloudy) return <CloudMoon className="icon cloud" />
        if (isClear) return <Moon className="icon night" />
      } else {
        if (isClear) return <Sun className="icon sun" />
        if (isCloudy) return <CloudSun className="icon cloud" />
        if (isRain) return <CloudRain className="icon rain" />
        if (isSnow) return <Snowflake className="icon snow" />
      }
    }
    if (isClear) return <Sun className="icon sun" />
    if (isCloudy) return <Cloud className="icon cloud" />
    if (isRain) return <CloudRain className="icon rain" />
    if (isSnow) return <Snowflake className="icon snow" />
    return <Cloud className="icon cloud" />
  }

  const filteredCities = cityList
    .filter(
      c => c.toLowerCase().includes(query.toLowerCase()) && c.toLowerCase() !== city.toLowerCase()
    )
    .slice(0, 15)

  function handleSelectCity(name) {
    onCityChange(name)
    setShowSuggestions(false)
    setQuery(name)
    inputRef.current?.blur()
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
      <div className="city-selector">
        <div className="city-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search city..."
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            className="city-input"
          />
          <Search className="city-search-icon" size={18} strokeWidth={2.2} />
        </div>

        {showSuggestions && filteredCities.length > 0 && (
          <div className="suggestions">
            {filteredCities.map((c, idx) => (
              <div key={idx} className="suggestion-item" onMouseDown={() => handleSelectCity(c)}>
                {c}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        {[1, 7, 15].map(n => (
          <button
            key={n}
            onClick={() => setDays(n)}
            className={`btn ${days === n ? 'accent' : ''}`}
          >
            {n === 1 ? 'Today' : `${n} Days`}
          </button>
        ))}
      </div>

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
