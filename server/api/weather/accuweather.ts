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

type ForecastDay = {
	HighTemperature: number,
	LowTemperature: number,
	IconIndex: number,
	WeatherSummary: string,
	DateString: string
}

type ForecastData = {
	WeatherData: Array<ForecastDay>
}

//This code was developed with Co-Pilot assistance since I'm not entirely sure what I'm doing. It didn't write this code entirely, but I asked it for help.
async function fetchAccuweatherForecast() {
	let accuweatherForecast = await useStorage().getItem('accuweatherForecast');
	if (!process.env.ACCUWEATHER_API_KEY) {
		throw new Error('No AccuWeather API key found. Please set the ACCUWEATHER_API_KEY environment variable.');
	}
	if (!process.env.ACCUWEATHER_CITY_ID) {
		throw new Error('No AccuWeather City ID found. Please set the ACCUWEATHER_CITY_ID environment variable.');
	}
	try {
		let res;
		if (!isDevelopment) {
			res = await fetch(
				`http://dataservice.accuweather.com/forecasts/v1/daily/5day/${process.env.ACCUWEATHER_CITY_ID}?apikey=${process.env.ACCUWEATHER_API_KEY}`,
				{ headers: serverFetchHeaders }
			);
			if (!res.ok) {
				throw new Error('API call failed');
			}
		} else {
			// Fetch the contents of the JSON file
			res = await fetch('assets/accuweather-example.json');
			if (!res.ok) {
				throw new Error('Failed to load JSON file');
			}
		}
		const data = await res.json();
		const accuweatherForecast: ForecastData = {
			WeatherData: new Array<ForecastDay>(5)
		}

		await useStorage().setItem('accuweatherForecast', accuweatherForecast);
	}
	catch (e) {
		console.error("Error fetching AccuWeather forecast: ", e);
	}
}