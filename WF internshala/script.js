// API Configuration
const API_KEY = '352086ab0f636d94e59ab2f2fb6d83f9'; // Replace with your API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchButton = document.getElementById('searchButton');
const locationButton = document.getElementById('locationButton');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const currentWeather = document.getElementById('currentWeather');
const extendedForecast = document.getElementById('extendedForecast');
const recentSearchesDropdown = document.getElementById('recentSearches');

// Initialize recent searches from localStorage
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

// Event Listeners
searchButton.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    } else {
        showError('Please enter a city name');
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
        } else {
            showError('Please enter a city name');
        }
    }
});

locationButton.addEventListener('click', getCurrentLocation);

cityInput.addEventListener('focus', () => {
    if (recentSearches.length > 0) {
        showRecentSearches();
    }
});

document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !recentSearchesDropdown.contains(e.target)) {
        recentSearchesDropdown.classList.add('hidden');
    }
});

// Functions
function showError(message) {
    errorMessage.textContent = message;
    errorAlert.classList.remove('hidden');
    setTimeout(() => {
        errorAlert.classList.add('hidden');
    }, 3000);
}

function updateRecentSearches(city) {
    recentSearches = [city, ...recentSearches.filter(s => s !== city)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
}

function showRecentSearches() {
    recentSearchesDropdown.innerHTML = '';
    recentSearches.forEach(city => {
        const button = document.createElement('button');
        button.className = 'w-full p-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg';
        button.textContent = city;
        button.addEventListener('click', () => {
            cityInput.value = city;
            fetchWeatherData(city);
            recentSearchesDropdown.classList.add('hidden');
        });
        recentSearchesDropdown.appendChild(button);
    });
    recentSearchesDropdown.classList.remove('hidden');
}

async function fetchWeatherData(city) {
    try {
        // Fetch current weather
        const response = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        // Fetch 5-day forecast
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastResponse.json();

        if (!forecastResponse.ok) {
            throw new Error(forecastData.message);
        }

        updateRecentSearches(city);
        displayCurrentWeather(data);
        displayForecast(forecastData);
        errorAlert.classList.add('hidden');
    } catch (err) {
        showError(err.message || 'Failed to fetch weather data');
    }
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(
                        `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
                    );
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message);
                    }

                    const forecastResponse = await fetch(
                        `${BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
                    );
                    const forecastData = await forecastResponse.json();

                    if (!forecastResponse.ok) {
                        throw new Error(forecastData.message);
                    }

                    displayCurrentWeather(data);
                    displayForecast(forecastData);
                    errorAlert.classList.add('hidden');
                } catch (err) {
                    showError(err.message || 'Failed to fetch weather data');
                }
            },
            () => showError('Unable to retrieve your location')
        );
    } else {
        showError('Geolocation is not supported by your browser');
    }
}

function displayCurrentWeather(data) {
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('weatherDescription').textContent = data.weather[0].description;
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('feelsLike').textContent = `Feels like ${Math.round(data.main.feels_like)}°C`;
    document.getElementById('windSpeed').textContent = `${data.wind.speed} m/s`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('weatherIcon').src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    currentWeather.classList.remove('hidden');
}

function displayForecast(forecastData) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';

    const dailyForecasts = forecastData.list
        .filter(item => item.dt_txt.includes('12:00:00'))
        .slice(0, 5);

    dailyForecasts.forEach(day => {
        const date = new Date(day.dt_txt);
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        const forecastCard = document.createElement('div');
        forecastCard.className = 'border rounded-lg p-4 text-center';
        forecastCard.innerHTML = `
            <p class="font-bold mb-2">${formattedDate}</p>
            <img src="http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" 
                alt="${day.weather[0].description}"
                class="w-12 h-12 mx-auto"
            >
            <p class="text-xl font-bold mb-2">${Math.round(day.main.temp)}°C</p>
            <div class="flex items-center justify-center gap-2 mb-1">
                <span>🌬️</span>
                <span>${day.wind.speed} m/s</span>
            </div>
            <div class="flex items-center justify-center gap-2">
                <span>💧</span>
                <span>${day.main.humidity}%</span>
            </div>
        `;
        forecastContainer.appendChild(forecastCard);
    });

    extendedForecast.classList.remove('hidden');
}