export default async function handler(req, res) {
  // Extract the specific OpenWeatherMap endpoint and any search parameters (lat, lon, etc.)
  const { endpoint, ...queryParams } = req.query;
  
  // Pull the secure key from Vercel's environment variables
  const apiKey = process.env.WEATHER_API_KEY;

  if (!endpoint) {
    return res.status(400).json({ error: "Missing endpoint parameter" });
  }

  // Rebuild the URL string, safely injecting the secret API key
  const params = new URLSearchParams({ ...queryParams, appid: apiKey });
  const url = `https://api.openweathermap.org/${endpoint}?${params.toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Send the clean weather data back to your frontend
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error while fetching weather" });
  }
}