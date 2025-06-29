// Weather API configuration
const API_KEY = 'bd494513a8b793234f5e842c28d83463'; // Users need to replace with actual OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM elements
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const weatherMain = document.getElementById('weatherMain');

// Weather display elements
const locationName = document.getElementById('locationName');
const currentIcon = document.getElementById('currentIcon');
const currentTemp = document.getElementById('currentTemp');
const weatherDescription = document.getElementById('weatherDescription');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const forecastGrid = document.getElementById('forecastGrid');
const hourlyForecast = document.getElementById('hourlyForecast');

// Weather icons mapping
const weatherIcons = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Snow': '❄️',
    'Thunderstorm': '⛈️',
    'Drizzle': '🌦️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '🌫️'
};

// Weather background themes
const weatherThemes = {
    'Clear': 'sunny',
    'Clouds': 'cloudy',
    'Rain': 'rainy',
    'Drizzle': 'rainy',
    'Snow': 'snowy',
    'Thunderstorm': 'rainy',
    'Mist': 'cloudy',
    'Fog': 'cloudy',
    'Haze': 'cloudy'
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check if API key is set
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please set your OpenWeatherMap API key in the script.js file');
        return;
    }
    
    // Event listeners
    searchForm.addEventListener('submit', handleSearch);
    locationBtn.addEventListener('click', handleLocationRequest);
});

// Handle search form submission
function handleSearch(e) {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        loadWeatherData(city);
        cityInput.value = '';
    }
}

// Handle geolocation request
function handleLocationRequest() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }
    
    showLoading();
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            loadWeatherDataByCoords(latitude, longitude);
        },
        (error) => {
            hideLoading();
            showError('Unable to retrieve your location. Please check your location permissions.');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

// Load weather data by city name
async function loadWeatherData(city) {
    try {
        showLoading();
        const data = await fetchWeatherByCity(city);
        displayWeatherData(data);
        hideLoading();
    } catch (error) {
        hideLoading();
        if (error.message.includes('404')) {
            showError(`City "${city}" not found. Please check the spelling and try again.`);
        } else if (error.message.includes('401')) {
            showError('Invalid API key. Please check your OpenWeatherMap API key.');
        } else {
            showError('Unable to fetch weather data. Please try again later.');
        }
    }
}

// Load weather data by coordinates
async function loadWeatherDataByCoords(lat, lon) {
    try {
        const data = await fetchWeatherByCoords(lat, lon);
        displayWeatherData(data);
        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Unable to fetch weather data for your location. Please try searching for a city instead.');
    }
}

// Fetch weather data by city
async function fetchWeatherByCity(city) {
    const currentResponse = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`);
    if (!currentResponse.ok) {
        throw new Error(`HTTP ${currentResponse.status}`);
    }
    const currentWeather = await currentResponse.json();
    
    const forecastResponse = await fetch(`${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`);
    if (!forecastResponse.ok) {
        throw new Error(`HTTP ${forecastResponse.status}`);
    }
    const forecastData = await forecastResponse.json();
    
    return formatWeatherData(currentWeather, forecastData);
}

// Fetch weather data by coordinates
async function fetchWeatherByCoords(lat, lon) {
    const currentResponse = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    if (!currentResponse.ok) {
        throw new Error(`HTTP ${currentResponse.status}`);
    }
    const currentWeather = await currentResponse.json();
    
    const forecastResponse = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    if (!forecastResponse.ok) {
        throw new Error(`HTTP ${forecastResponse.status}`);
    }
    const forecastData = await forecastResponse.json();
    
    return formatWeatherData(currentWeather, forecastData);
}

// Format API response data
function formatWeatherData(current, forecast) {
    return {
        location: {
            name: current.name,
            country: current.sys.country
        },
        current: {
            temp: current.main.temp,
            feelsLike: current.main.feels_like,
            humidity: current.main.humidity,
            pressure: current.main.pressure,
            visibility: current.visibility / 1000, // Convert to km
            windSpeed: current.wind.speed * 3.6, // Convert m/s to km/h
            condition: current.weather[0].main,
            description: current.weather[0].description
        },
        forecast: formatForecastData(forecast.list),
        hourly: formatHourlyData(forecast.list.slice(0, 8))
    };
}

// Format forecast data
function formatForecastData(forecastList) {
    const dailyData = {};
    const days = ['Today', 'Tomorrow'];
    
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        if (!dailyData[dateKey]) {
            dailyData[dateKey] = {
                temps: [],
                condition: item.weather[0].main,
                description: item.weather[0].description,
                date: date
            };
        }
        dailyData[dateKey].temps.push(item.main.temp);
    });
    
    const forecast = [];
    let dayIndex = 0;
    
    for (const dateKey in dailyData) {
        if (dayIndex >= 5) break;
        
        const dayData = dailyData[dateKey];
        const date = dayData.date;
        
        let dayName;
        if (dayIndex === 0) {
            dayName = 'Today';
        } else if (dayIndex === 1) {
            dayName = 'Tomorrow';
        } else {
            dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        }
        
        forecast.push({
            day: dayName,
            condition: dayData.condition,
            description: dayData.description,
            maxTemp: Math.round(Math.max(...dayData.temps)),
            minTemp: Math.round(Math.min(...dayData.temps))
        });
        dayIndex++;
    }
    
    return forecast;
}

// Format hourly data
function formatHourlyData(hourlyList) {
    return hourlyList.map(item => {
        const date = new Date(item.dt * 1000);
        return {
            time: date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            }),
            temp: Math.round(item.main.temp),
            condition: item.weather[0].main
        };
    });
}

// Display weather data
function displayWeatherData(data) {
    // Update background theme
    updateBackgroundTheme(data.current.condition);
    
    // Update current weather
    locationName.textContent = `${data.location.name}, ${data.location.country}`;
    currentIcon.textContent = weatherIcons[data.current.condition] || '☀️';
    currentTemp.textContent = `${Math.round(data.current.temp)}°C`;
    weatherDescription.textContent = data.current.description;
    feelsLike.textContent = `Feels like ${Math.round(data.current.feelsLike)}°C`;
    
    // Update weather details
    humidity.textContent = `${data.current.humidity}%`;
    windSpeed.textContent = `${Math.round(data.current.windSpeed)} km/h`;
    pressure.textContent = `${data.current.pressure} mb`;
    visibility.textContent = `${data.current.visibility} km`;
    
    // Update forecast
    displayForecast(data.forecast);
    
    // Update hourly forecast
    displayHourlyForecast(data.hourly);
    
    // Show weather main content
    hideError();
    weatherMain.classList.add('show');
}

// Display 5-day forecast
function displayForecast(forecast) {
    forecastGrid.innerHTML = '';
    
    forecast.forEach(day => {
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        
        forecastCard.innerHTML = `
            <div class="forecast-date">${day.day}</div>
            <div class="forecast-icon">${weatherIcons[day.condition] || '☀️'}</div>
            <div class="forecast-temps">
                <span class="forecast-high">${day.maxTemp}°</span>
                <span class="forecast-low">${day.minTemp}°</span>
            </div>
            <div class="forecast-desc">${day.description}</div>
        `;
        
        forecastGrid.appendChild(forecastCard);
    });
}

// Display hourly forecast
function displayHourlyForecast(hourly) {
    hourlyForecast.innerHTML = '';
    
    hourly.forEach(hour => {
        const hourlyCard = document.createElement('div');
        hourlyCard.className = 'hourly-card';
        
        hourlyCard.innerHTML = `
            <div class="hourly-time">${hour.time}</div>
            <div class="hourly-icon">${weatherIcons[hour.condition] || '☀️'}</div>
            <div class="hourly-temp">${hour.temp}°</div>
        `;
        
        hourlyForecast.appendChild(hourlyCard);
    });
}

// Update background theme based on weather condition
function updateBackgroundTheme(condition) {
    const weatherBg = document.querySelector('.weather-bg');
    weatherBg.className = 'weather-bg';
    
    const theme = weatherThemes[condition] || 'sunny';
    weatherBg.classList.add(theme);
}

// Show loading state
function showLoading() {
    loadingSpinner.classList.add('show');
    weatherMain.classList.remove('show');
    hideError();
}

// Hide loading state
function hideLoading() {
    loadingSpinner.classList.remove('show');
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.add('show');
    weatherMain.classList.remove('show');
    hideLoading();
}

// Hide error message
function hideError() {
    errorMessage.classList.remove('show');
}