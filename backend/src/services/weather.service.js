const axios = require('axios');

/**
 * weather.service.js
 * ══════════════════
 * OpenWeatherMap current conditions + time/day helpers.
 * Free API key from: https://openweathermap.org/api
 */

// ── Current weather by coords ─────────────────────────────────────
const getWeather = async (lat, lon) => {
  // If no coords provided, return a neutral default
  if (!lat || !lon) {
    return { condition: 'Clear', description: 'unavailable', temp: 25, icon: '01d' };
  }

  try {
    const { data } = await axios.get(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          lat,
          lon,
          appid: process.env.OPENWEATHER_API_KEY,
          units: 'metric',
        },
        timeout: 5000,
      }
    );

    return {
      condition:   data.weather[0].main,         // 'Rain' | 'Clear' | 'Clouds' | 'Snow' ...
      description: data.weather[0].description,  // 'light rain'
      temp:        Math.round(data.main.temp),   // °C
      icon:        data.weather[0].icon,         // '10d'
    };
  } catch {
    // OpenWeatherMap down or bad key → silent fallback
    return { condition: 'Clear', description: 'unavailable', temp: 25, icon: '01d' };
  }
};

// ── Time of day ───────────────────────────────────────────────────
const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
};

// ── Day of week ───────────────────────────────────────────────────
const getDayOfWeek = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

module.exports = { getWeather, getTimeOfDay, getDayOfWeek };