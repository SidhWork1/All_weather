const THEME_KEY = 'theme';
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
}

function hideLoading() {
  loadingSpinner.hidden = true;
  cityInput.disabled = false;
  searchButton.disabled = false;
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
  } else if (state === 'loaded') {
    emptyState.hidden = true;
    weatherContent.hidden = false;
  }
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

    currentWeatherCard.innerHTML =
      `<p>Weather data loaded for <strong>${location.name}, ${location.country}</strong>. Open the browser console to inspect the API response.</p>`;

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

  searchForm = document.getElementById('search-form');
  cityInput = document.getElementById('city-input');
  searchButton = document.getElementById('search-button');
  errorBanner = document.getElementById('error-banner');
  loadingSpinner = document.getElementById('loading-spinner');
  emptyState = document.getElementById('empty-state');
  weatherContent = document.getElementById('weather-content');
  currentWeatherCard = document.getElementById('current-weather');

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSearch(cityInput.value);
  });
});
