const THEME_KEY = 'theme';
const LAST_CITY_KEY = 'lastCity';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

let searchForm;
let cityInput;
let searchButton;
let errorBanner;
let loadingSpinner;
let emptyState;
let weatherContent;
let currentWeatherCard;
let forecastStrip;
let insightsRows;
let clearCityButton;

function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  updateToggleButton(theme);
}

function updateToggleButton(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  btn.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  );
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

async function fetchCityCoords(city) {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1&language=en`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Network error. Please try again.');
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('City not found. Please try another name.');
  }

  return data.results[0];
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,weather_code',
    hourly: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    forecast_days: '5',
    timezone: 'auto',
  });

  const response = await fetch(`${FORECAST_URL}?${params}`);

  if (!response.ok) {
    throw new Error('Network error. Please try again.');
  }

  return response.json();
}

function showLoading() {
  loadingSpinner.hidden = false;
  cityInput.disabled = true;
  searchButton.disabled = true;
  if (clearCityButton) clearCityButton.disabled = true;
}

function hideLoading() {
  loadingSpinner.hidden = true;
  cityInput.disabled = false;
  searchButton.disabled = false;
  if (clearCityButton) clearCityButton.disabled = false;
}

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.hidden = false;
}

function hideError() {
  errorBanner.hidden = true;
  errorBanner.textContent = '';
}

function setAppState(state) {
  if (state === 'empty') {
    emptyState.hidden = false;
    weatherContent.hidden = true;
    if (clearCityButton) clearCityButton.hidden = true;
  } else if (state === 'loaded') {
    emptyState.hidden = true;
    weatherContent.hidden = false;
    if (clearCityButton) clearCityButton.hidden = false;
  }
}

function clearStoredCity() {
  localStorage.removeItem(LAST_CITY_KEY);
  cityInput.value = '';
  hideError();
  currentWeatherCard.innerHTML = '';
  forecastStrip.innerHTML = '';
  insightsRows.innerHTML = '';
  setAppState('empty');
}

const WEATHER_ICONS = {
  clear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  partlyCloudy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><circle cx="8" cy="8" r="3"/></svg>',
  cloudy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
  fog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h16M4 18h16M4 10h16M4 6h16"/></svg>',
  drizzle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 22v-2M12 22v-2M16 22v-2"/></svg>',
  rain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M7 22l1-3M12 22l1-3M17 22l1-3"/></svg>',
  snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 22l2-2 2 2M12 18l2-2 2 2"/></svg>',
  thunderstorm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M13 16l-2 4h3l-2 4"/></svg>',
};

function getWeatherInfo(code) {
  if (code === 0) return { label: 'Clear', icon: WEATHER_ICONS.clear };
  if (code === 1) return { label: 'Mainly Clear', icon: WEATHER_ICONS.partlyCloudy };
  if (code === 2) return { label: 'Partly Cloudy', icon: WEATHER_ICONS.partlyCloudy };
  if (code === 3) return { label: 'Overcast', icon: WEATHER_ICONS.cloudy };
  if (code === 45 || code === 48) return { label: 'Fog', icon: WEATHER_ICONS.fog };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: WEATHER_ICONS.drizzle };
  if (code >= 61 && code <= 67) return { label: 'Rain', icon: WEATHER_ICONS.rain };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: WEATHER_ICONS.snow };
  if (code >= 80 && code <= 82) return { label: 'Rain Showers', icon: WEATHER_ICONS.rain };
  if (code >= 85 && code <= 86) return { label: 'Snow Showers', icon: WEATHER_ICONS.snow };
  if (code >= 95) return { label: 'Thunderstorm', icon: WEATHER_ICONS.thunderstorm };
  return { label: 'Unknown', icon: WEATHER_ICONS.cloudy };
}

function getTempAccentClass(temp) {
  if (temp < 10) return 'temp-cold';
  if (temp <= 25) return 'temp-mild';
  return 'temp-warm';
}

function formatCurrentDate(timeString) {
  const date = new Date(timeString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function renderCurrentWeather(location, weather) {
  const current = weather.current;
  const { label, icon } = getWeatherInfo(current.weather_code);
  const tempClass = getTempAccentClass(current.temperature_2m);
  const roundedTemp = Math.round(current.temperature_2m);

  currentWeatherCard.innerHTML = `
    <div class="weather-header">
      <h2 class="weather-city">${location.name}, ${location.country}</h2>
      <p class="weather-date">${formatCurrentDate(current.time)}</p>
    </div>
    <div class="weather-main">
      <div class="weather-icon" aria-hidden="true">${icon}</div>
      <div class="weather-temp ${tempClass}">${roundedTemp}°C</div>
      <p class="weather-condition">${label}</p>
    </div>
    <div class="weather-stats">
      <div class="stat-badge">
        <span>Humidity</span>
        <strong>${current.relative_humidity_2m}%</strong>
      </div>
      <div class="stat-badge">
        <span>Wind</span>
        <strong>${Math.round(current.wind_speed_10m)} km/h</strong>
      </div>
      <div class="stat-badge">
        <span>Pressure</span>
        <strong>${Math.round(current.surface_pressure)} hPa</strong>
      </div>
    </div>
  `;
}

function formatHour(timeString) {
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
  });
}

function getDayLabel(dateString, index) {
  if (index === 0) return 'Today';
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function getTodayHourlyEntries(weather) {
  const todayDate = weather.daily.time[0];
  const entries = [];

  for (let i = 0; i < weather.hourly.time.length; i++) {
    if (weather.hourly.time[i].startsWith(todayDate)) {
      entries.push({
        time: weather.hourly.time[i],
        temperature: weather.hourly.temperature_2m[i],
        weatherCode: weather.hourly.weather_code[i],
      });
    }
  }

  if (entries.length === 0) return [];

  const targetCount = 6;
  if (entries.length <= targetCount) return entries;

  const selected = [];
  for (let i = 0; i < targetCount; i++) {
    const index = Math.round((i * (entries.length - 1)) / (targetCount - 1));
    selected.push(entries[index]);
  }

  return selected;
}

function renderForecast(weather) {
  const daily = weather.daily;

  forecastStrip.innerHTML = daily.time.slice(0, 5).map((date, index) => {
    const { icon } = getWeatherInfo(daily.weather_code[index]);
    const dayLabel = getDayLabel(date, index);
    const high = Math.round(daily.temperature_2m_max[index]);
    const low = Math.round(daily.temperature_2m_min[index]);
    const todayClass = index === 0 ? ' forecast-card--today' : '';

    return `
      <div class="forecast-card${todayClass}">
        <p class="forecast-day">${dayLabel}</p>
        <div class="forecast-icon" aria-hidden="true">${icon}</div>
        <p class="forecast-temps">
          <span class="forecast-high">${high}°</span>
          <span class="forecast-low">${low}°</span>
        </p>
      </div>
    `;
  }).join('');
}

function renderHourlyInsights(weather) {
  const entries = getTodayHourlyEntries(weather);

  insightsRows.innerHTML = entries.map((entry) => {
    const { label } = getWeatherInfo(entry.weatherCode);
    return `
      <div class="insight-row">
        <span class="insight-time">${formatHour(entry.time)}</span>
        <span class="insight-condition">${label}</span>
        <span class="insight-temp">${Math.round(entry.temperature)}°C</span>
      </div>
    `;
  }).join('');
}

async function handleSearch(city) {
  const trimmed = city.trim();
  if (!trimmed) return;

  hideError();
  showLoading();

  try {
    const location = await fetchCityCoords(trimmed);
    const weather = await fetchWeather(location.latitude, location.longitude);

    console.log('Location:', location);
    console.log('Weather:', weather);

    renderCurrentWeather(location, weather);
    renderForecast(weather);
    renderHourlyInsights(weather);

    localStorage.setItem(LAST_CITY_KEY, trimmed);
    cityInput.value = trimmed;

    setAppState('loaded');
  } catch (error) {
    showError(error.message || 'Something went wrong. Please try again.');
    setAppState('empty');
  } finally {
    hideLoading();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getPreferredTheme());

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  const navToggle = document.getElementById('nav-toggle');
  const headerContainer = document.getElementById('header-container');
  if (navToggle && headerContainer) {
    navToggle.addEventListener('click', () => {
      const isOpen = headerContainer.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  searchForm = document.getElementById('search-form');
  cityInput = document.getElementById('city-input');
  searchButton = document.getElementById('search-button');
  errorBanner = document.getElementById('error-banner');
  loadingSpinner = document.getElementById('loading-spinner');
  emptyState = document.getElementById('empty-state');
  weatherContent = document.getElementById('weather-content');
  currentWeatherCard = document.getElementById('current-weather');
  forecastStrip = document.getElementById('forecast-strip');
  insightsRows = document.getElementById('insights-rows');
  clearCityButton = document.getElementById('clear-city');

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSearch(cityInput.value);
  });

  clearCityButton.addEventListener('click', clearStoredCity);

  const savedCity = localStorage.getItem(LAST_CITY_KEY);
  if (savedCity) {
    handleSearch(savedCity);
  }
});
