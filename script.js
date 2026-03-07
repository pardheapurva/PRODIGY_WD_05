const apiKey = config.WEATHER_API_KEY;

const weatherIcons = {
    "01d": "fa-solid fa-sun",
    "01n": "fa-solid fa-moon",
    "02d": "fa-solid fa-cloud-sun",
    "02n": "fa-solid fa-cloud-moon",
    "03d": "fa-solid fa-cloud",
    "03n": "fa-solid fa-cloud",
    "04d": "fa-solid fa-cloud",
    "04n": "fa-solid fa-cloud",
    "09d": "fa-solid fa-cloud-showers-heavy",
    "09n": "fa-solid fa-cloud-showers-heavy",
    "10d": "fa-solid fa-cloud-sun-rain",
    "10n": "fa-solid fa-cloud-moon-rain",
    "11d": "fa-solid fa-bolt",
    "11n": "fa-solid fa-bolt",
    "13d": "fa-solid fa-snowflake",
    "13n": "fa-solid fa-snowflake",
    "50d": "fa-solid fa-smog",
    "50n": "fa-solid fa-smog"
};

function startApp() {
    document.getElementById("homeScreen").style.display = "none";
    document.getElementById("weatherScreen").style.display = "block";
}

window.onload = function () {
    getCurrentLocationWeather();
};

function searchWeather() {

    const searchInput = document.getElementById("searchInput").value.trim();
    if (!searchInput) return;

    document.getElementById("searchInput").value = "";

    const isPincode = /^\d+$/.test(searchInput);

    let geoUrl = "";

    if (isPincode) {
    // Assume India for 6-digit pincodes
    geoUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${searchInput},IN&appid=${apiKey}`;

    } else {
    // City search worldwide
    geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${searchInput}&limit=1&appid=${apiKey}`;
    }

    fetch(geoUrl)
        .then(res => {
            if (!res.ok) throw new Error("Location not found");
            return res.json();
        })
        .then(geoData => {

            let lat, lon, preciseLocationName;

            if (isPincode) {
                lat = geoData.lat;
                lon = geoData.lon;
                preciseLocationName = geoData.name;
            } else {
                if (geoData.length === 0) throw new Error("City not found");

                lat = geoData[0].lat;
                lon = geoData[0].lon;
                preciseLocationName = geoData[0].name;
            }

            return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
                .then(res => res.json())
                .then(weatherData => {

                    if (weatherData && weatherData.city) {
                        weatherData.city.name = preciseLocationName;
                    }

                    updateUI(weatherData);
                });
        })
        .catch(error => {
            console.error(error);
            alert("Location not found. Please check spelling or pincode.");
        });
}

function getCurrentLocationWeather() {

    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }

    document.getElementById("cityName").innerText = "Detecting location...";

    navigator.geolocation.getCurrentPosition(position => {

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`)
            .then(res => res.json())
            .then(geoData => {

                let preciseLocationName = "Unknown Location";

                if (geoData && geoData.length > 0) {
                    preciseLocationName = geoData[0].name;
                }

                return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
                    .then(res => res.json())
                    .then(weatherData => {

                        if (weatherData && weatherData.city) {
                            weatherData.city.name = preciseLocationName;
                        }

                        updateUI(weatherData);
                    });
            })
            .catch(error => {
                console.error(error);
                document.getElementById("cityName").innerText = "Error loading location";
            });

    }, () => {
        alert("Location access denied");
        document.getElementById("cityName").innerText = "Location Denied";
    });
}

function showHourly(data) {
    const hourlyContainer = document.getElementById("hourlyForecast");
    hourlyContainer.innerHTML = "";

    for (let i = 0; i < 6; i++) {
        const hour = data.list[i];

        const date = new Date(hour.dt * 1000);

        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';

     
        hours = hours % 12 || 12; 
        minutes = minutes < 10 ? '0' + minutes : minutes; 

        const displayTime = i === 0 ? "Now" : `${hours}:${minutes} ${ampm}`;

        const div = document.createElement("div");
        div.className = "hour-item"; 
        
        div.innerHTML = `
            <p style="font-size: 14px; font-weight: 500; margin: 0;">${displayTime}</p>
            <i class="${weatherIcons[hour.weather[0].icon]}" style="font-size:24px; margin:10px 0;"></i>
            <p style="font-size: 16px; font-weight: bold; margin: 0;">${Math.round(hour.main.temp)}°</p>
        `;

        hourlyContainer.appendChild(div);
    }
}

function showDate() {

    const today = new Date();

    document.getElementById("currentDate").innerText =
        today.toDateString();
}

document.getElementById("searchInput").addEventListener("keypress", function (event) {

    if (event.key === "Enter") {
        event.preventDefault();
        searchWeather();
    }

});

function showFiveDayForecast(data){

const container = document.getElementById("fiveDayForecast");
container.innerHTML="";

for(let i=0;i<data.list.length;i+=8){

const day = data.list[i];

const date = new Date(day.dt_txt).toLocaleDateString("en-US",{weekday:"short"});

const div = document.createElement("div");

div.className="forecast-card";

div.innerHTML=`
<p>${date}</p>
<i class="${weatherIcons[day.weather[0].icon]}" style="font-size:22px;"></i>
<p>${Math.round(day.main.temp)}°C</p>
`;

container.appendChild(div);

}
}

function getAirQuality(lat, lon) {

    fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
    .then(res => res.json())
    .then(aqiData => {

        const pm25 = aqiData.list[0].components.pm2_5;

        const aqiValue = calculateAQI(pm25);
        const aqiCategory = getAQICategory(aqiValue);

        document.getElementById("airQuality").innerText =
           `Air Quality: ${aqiValue} - ${aqiCategory}`;
});
}

function calculateAQI(pm25) {

    if (pm25 <= 12) return Math.round((50/12) * pm25);

    if (pm25 <= 35.4) return Math.round(((100-51)/(35.4-12.1))*(pm25-12.1)+51);

    if (pm25 <= 55.4) return Math.round(((150-101)/(55.4-35.5))*(pm25-35.5)+101);

    if (pm25 <= 150.4) return Math.round(((200-151)/(150.4-55.5))*(pm25-55.5)+151);

    if (pm25 <= 250.4) return Math.round(((300-201)/(250.4-150.5))*(pm25-150.5)+201);

    if (pm25 <= 350.4) return Math.round(((400-301)/(350.4-250.5))*(pm25-250.5)+301);

    return Math.round(((500-401)/(500.4-350.5))*(pm25-350.5)+401);
}

function getAQICategory(aqi){

    if(aqi <= 50) return "Good";

    if(aqi <= 100) return "Satisfactory";

    if(aqi <= 200) return "Moderate";

    if(aqi <= 300) return "Poor";

    if(aqi <= 400) return "Very Poor";

    return "Severe";
}

function updateBackground(weatherMain, icon){

    const weatherScreen = document.getElementById("weatherScreen");

    weatherScreen.className = "weather-bg"; // reset

    if(weatherMain === "Clear" && icon.includes("d"))
        weatherScreen.classList.add("sunny");

    else if(weatherMain === "Clouds")
        weatherScreen.classList.add("cloudy");

    else if(weatherMain === "Rain" || weatherMain === "Drizzle")
        weatherScreen.classList.add("rainy");

    else if(weatherMain === "Thunderstorm")
        weatherScreen.classList.add("storm");

    else if(weatherMain === "Snow")
        weatherScreen.classList.add("snow");

    else if(icon.includes("n"))
        weatherScreen.classList.add("night");
}

function updateUI(data) {

    const current = data.list[0];

    document.getElementById("cityName").innerText = data.city.name;

    document.getElementById("temperature").innerText =
        Math.round(current.main.temp) + "°C";

    document.getElementById("description").innerText =
        current.weather[0].description;

    document.getElementById("maxTemp").innerText =
        Math.round(current.main.temp_max);

    document.getElementById("minTemp").innerText =
        Math.round(current.main.temp_min);

    const iconCode = current.weather[0].icon;

    document.getElementById("weatherIcon").className =
        weatherIcons[iconCode] || "fa-solid fa-cloud";

    showHourly(data);
    showDate();

    showFiveDayForecast(data);

    const countryCode = data.city.country;

    document.getElementById("countryFlag").src =
    `https://flagsapi.com/${countryCode}/flat/64.png`;

    const weatherMain = current.weather[0].main;

    getAirQuality(data.city.coord.lat, data.city.coord.lon);
}