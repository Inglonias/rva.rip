import { logTimeElapsedSince, serverCacheMaxAgeSeconds, serverStaleWhileInvalidateSeconds, serverFetchHeaders, applyEventTags } from '@/utils/util';
const isDevelopment = process.env.NODE_ENV === 'development';

export default defineCachedEventHandler(async (event) => {
	// export default defineEventHandler(async (event) => {
	const startTime = new Date();
	//Adding .env processing
	const body = await fetchAccuweatherForecast();
	logTimeElapsedSince(startTime.getTime(), 'AccuWeather: Forecast fetched.');
	return {
		body
	}
}, {
	maxAge: serverCacheMaxAgeSeconds,
	staleMaxAge: serverStaleWhileInvalidateSeconds,
	swr: true,
});

const ForecastDay = {HighTemperature: 0, LowTemperature: 0, IconIndex: -1, DateString: "", WeatherString: ""};
const ForecastReturnObject = {WeatherData: [
    Object.create(ForecastDay), // Today
    Object.create(ForecastDay), // Tomorrow
    Object.create(ForecastDay)  // Day After Tomorrow
]};

async function fetchAccuweatherForecast() {
	let accuweatherForecast = await useStorage().getItem('accuweatherForecast');
	if (!process.env.ACCUWEATHER_API_KEY) {
		throw new Error('No AccuWeather API key found. Please set the ACCUWEATHER_API_KEY environment variable.');
	}
	if (!process.env.ACCUWEATHER_CITY_ID) {
		throw new Error('No AccuWeather City ID found. Please set the ACCUWEATHER_CITY_ID environment variable.');
	}
	try {
		const res = await fetch(
			`http://dataservice.accuweather.com/forecasts/v1/daily/5day/${process.env.ACCUWEATHER_CITY_ID}?apikey=${process.env.ACCUWEATHER_API_KEY}`,
			{ headers: serverFetchHeaders }
		);
		if (!res.ok) {
			throw new Error(`Error fetching Accuweather forecast: ${res.status} ${res.statusText}`);
		}
		const data = res.json();
		accuweatherForecast = Object.create(ForecastReturnObject);
		await useStorage().setItem('accuweatherForecast', accuweatherForecast);
	}
	catch (e) {
		console.error("Error fetching AccuWeather forecast: ", e);
	}
	return accuweatherForecast;
  }

