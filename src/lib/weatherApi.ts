import { LaunchSite, WeatherData, HourlyForecast, DayForecast, WeatherAlert, WindgramRow } from "@/types/weather";
import { calcVolability, estimateThermalMs, estimateCloudbaseM } from "./volability";
import { calcSunTimes } from "./sunTimes";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

export function wmoIcon(code: number, hour?: number): string {
  const night = hour !== undefined && (hour < 6 || hour >= 21);
  if (code === 0) return night ? "🌙" : "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 84) return "🌨️";
  if (code <= 94) return "❄️";
  if (code <= 99) return "⛈️";
  return "🌩️";
}

export function wmoLabel(code: number): string {
  if (code === 0) return "Sereno";
  if (code <= 2) return "Parz. nuvoloso";
  if (code === 3) return "Coperto";
  if (code <= 48) return "Nebbia";
  if (code <= 57) return "Pioviggine";
  if (code <= 67) return "Pioggia";
  if (code <= 77) return "Neve";
  if (code <= 82) return "Rovesci";
  if (code <= 84) return "Rovesci forti";
  if (code <= 94) return "Neve";
  return "Temporale";
}

function buildAlerts(data: WeatherData): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const { currentWind, currentGust, currentCape, volability, currentCloudCover } = data;

  if (volability.total >= 7) {
    alerts.push({ type: "ok", icon: "✅", message: "Condizioni favorevoli al volo. Volabilità alta." });
  } else if (volability.total >= 4) {
    alerts.push({ type: "warning", icon: "⚠️", message: "Condizioni miste. Valutare attentamente prima del decollo." });
  } else {
    alerts.push({ type: "danger", icon: "🚫", message: "Condizioni sfavorevoli. Volo sconsigliato oggi." });
  }
  if (currentWind > 35) alerts.push({ type: "danger", icon: "💨", message: `Vento forte: ${currentWind} km/h. Rischio instabilità.` });
  if (currentGust > 45) alerts.push({ type: "danger", icon: "🌪️", message: `Raffiche pericolose: ${currentGust} km/h.` });
  if (currentCape > 600) alerts.push({ type: "danger", icon: "⛈️", message: `CAPE ${currentCape} J/kg — rischio temporale. Non volare.` });
  else if (currentCape > 300) alerts.push({ type: "warning", icon: "⛅", message: `CAPE ${currentCape} J/kg — termiche instabili possibili nel pomeriggio.` });
  if (currentCloudCover > 90) alerts.push({ type: "info", icon: "☁️", message: "Copertura nuvolosa totale. Termiche assenti." });
  return alerts;
}

function buildBriefing(data: WeatherData): string {
  const { site, currentWind, currentTemp, volability, currentCeiling, currentCloudbaseM, currentThermalMs, turbulenceScore, xcScore } = data;
  const windDirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const windDir = windDirs[Math.round(data.currentWindDir / 45) % 8];
  const label = volability.label;

  let text = `${site.name} · ${site.altitude}m slm. Vento ${windDir} ${currentWind} km/h, ${currentTemp}°C. `;
  text += `Base cumuli ${currentCloudbaseM.toLocaleString()}m, soffitto termico ${currentCeiling.toLocaleString()}m. `;
  text += `Termiche ${currentThermalMs.toFixed(1)} m/s. `;

  if (label === "GO") {
    text += `✅ VOLA — Volabilità ${volability.total}/10, XC ${xcScore}/10. `;
  } else if (label === "CAUTION") {
    text += `⚠️ VALUTA — Volabilità ${volability.total}/10, attenzione al meteo. `;
  } else {
    text += `🚫 NON VOLARE — Volabilità ${volability.total}/10. `;
  }

  if (currentWind > 30) text += "⚠️ Vento forte. ";
  if (data.currentCape > 500) text += "⚠️ CAPE elevato, rischio CuNb. ";
  if (turbulenceScore >= 7) text += "⚠️ Turbolenza elevata. ";
  return text.trim();
}

function buildWindgram(h: Record<string, number[]>, siteAlt: number): WindgramRow[] {
  const altitudes = [siteAlt, siteAlt + 500, siteAlt + 1000, siteAlt + 1500, siteAlt + 2000, siteAlt + 3000];
  const targetHours = [7, 9, 11, 13, 15, 17, 19];
  return altitudes.map((alt) => ({
    altitudeM: Math.round(alt),
    hours: targetHours.map((hr) => ({
      hour: hr,
      speedKmh: Math.round(h.wind_speed_10m?.[hr] ?? 0),
      dirDeg: h.wind_direction_10m?.[hr] ?? 0,
    })),
  }));
}

export function estimateThermalWidthM(cape: number, blh: number): number {
  const factor = cape > 300 ? 0.15 : cape > 100 ? 0.12 : 0.08;
  return Math.round(blh * factor);
}

function xcRouteLabel(site: LaunchSite, xcScore: number): string | null {
  if (xcScore < 5) return null;
  if (xcScore >= 8) return `${site.name} → Valle Pianura (${site.xcKm} km FAI)`;
  if (xcScore >= 6) return `${site.name} → XC locale (${Math.round(site.xcKm * 0.6)} km)`;
  return null;
}

export async function fetchWeather(site: LaunchSite): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: site.lat.toString(),
    longitude: site.lon.toString(),
    hourly: [
      "temperature_2m",
      "dew_point_2m",
      "precipitation_probability",
      "weather_code",
      "cloud_cover",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "visibility",
      "cape",
      "boundary_layer_height",
      "wind_speed_80m",
      "wind_speed_120m",
      "wind_direction_80m",
      "wind_direction_120m",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
    ].join(","),
    timezone: "Europe/Rome",
    forecast_days: "7",
    wind_speed_unit: "kmh",
  });

  const response = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Open-Meteo error ${response.status}: ${err}`);
  }
  const json = await response.json();

  const h = json.hourly as Record<string, number[]>;
  const d = json.daily as Record<string, unknown[]>;
  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = now.toISOString().slice(0, 10);
  const times: string[] = h.time as unknown as string[];
  const nowIdx = times.findIndex((t) => t.startsWith(todayStr) && parseInt(t.slice(11, 13)) === currentHour);
  const safeIdx = nowIdx >= 0 ? nowIdx : currentHour;

  const hourly: HourlyForecast[] = times.map((time, i) => {
    const hour = parseInt(time.slice(11, 13));
    const windShear = Math.abs((h.wind_speed_120m?.[i] ?? 0) - (h.wind_speed_10m?.[i] ?? 0));
    const cape = h.cape?.[i] ?? 0;
    const blh = h.boundary_layer_height?.[i] ?? 500;
    const temp = h.temperature_2m?.[i] ?? 0;
    const dewpoint = h.dew_point_2m?.[i] ?? 0;

    const vol = calcVolability({
      windDir: h.wind_direction_10m?.[i] ?? 0,
      windSpeed: h.wind_speed_10m?.[i] ?? 0,
      gust: h.wind_gusts_10m?.[i] ?? 0,
      cape, temp, dewpoint,
      precipProb: h.precipitation_probability?.[i] ?? 0,
      visibility: (h.visibility?.[i] ?? 10000) / 1000,
      code: h.weather_code?.[i] ?? 0,
      cloudCover: h.cloud_cover?.[i] ?? 0,
      blh, windShear, site,
    });

    const thermalMs = estimateThermalMs(cape, temp, site.altitude, blh);
    const cloudbaseM = estimateCloudbaseM(temp, dewpoint, site.altitude);
    const ceiling = Math.round(site.altitude + blh * 0.85);
    const thermalWidth = estimateThermalWidthM(cape, blh);

    const xcScore = Math.min(10, Math.max(1, Math.round(
      (blh / 300) * 2 + (cape > 50 ? Math.min(3, cape / 150) : 0) + (vol.total / 10) * 5
    )));
    const turbScore = Math.min(10, Math.max(1, Math.round(
      windShear / 5 + (cape > 400 ? 3 : cape > 200 ? 1.5 : 0) + ((h.wind_gusts_10m?.[i] ?? 0) > 30 ? 2 : 0)
    )));

    return {
      time,
      hour,
      temp,
      windSpeed: Math.round(h.wind_speed_10m?.[i] ?? 0),
      windDir: Math.round(h.wind_direction_10m?.[i] ?? 0),
      windGust: Math.round(h.wind_gusts_10m?.[i] ?? 0),
      cloudCover: Math.round(h.cloud_cover?.[i] ?? 0),
      capeIndex: Math.round(cape),
      precipProb: Math.round(h.precipitation_probability?.[i] ?? 0),
      visibility: Math.round((h.visibility?.[i] ?? 10000) / 1000),
      weatherCode: h.weather_code?.[i] ?? 0,
      flightIndex: Math.round(vol.total * 10),
      flightLabel: vol.label,
      volability: vol.total,
      blh: Math.round(blh),
      dewpoint: Math.round(dewpoint * 10) / 10,
      temp80m: temp + 0.65,
      xcScore,
      turbScore,
      thermalMs,
      thermalWidthM: thermalWidth,
      cloudbaseM,
      ceilingM: ceiling,
      windSpeed80m: Math.round(h.wind_speed_80m?.[i] ?? h.wind_speed_10m?.[i] * 1.2 ?? 0),
      windSpeed120m: Math.round(h.wind_speed_120m?.[i] ?? h.wind_speed_10m?.[i] * 1.35 ?? 0),
      windDir80m: Math.round(h.wind_direction_80m?.[i] ?? h.wind_direction_10m?.[i] ?? 0),
      windDir120m: Math.round(h.wind_direction_120m?.[i] ?? h.wind_direction_10m?.[i] ?? 0),
      windShear: Math.round(windShear),
    };
  });

  // Build daily forecast
  const dailyTimes = d.time as string[];
  const days = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  const daysShort = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

  const daily: DayForecast[] = dailyTimes.map((date, i) => {
    const dt = new Date(date + "T12:00:00");
    const maxWind = Math.round((d.wind_speed_10m_max as number[])[i] ?? 0);
    const precipProb = Math.round((d.precipitation_probability_max as number[])[i] ?? 0);
    const maxCape = hourly
      .filter((hh) => hh.time.startsWith(date) && hh.hour >= 10 && hh.hour <= 16)
      .reduce((acc, hh) => Math.max(acc, hh.capeIndex), 0);
    const maxBlh = hourly
      .filter((hh) => hh.time.startsWith(date) && hh.hour >= 10 && hh.hour <= 16)
      .reduce((acc, hh) => Math.max(acc, hh.blh), 500);
    const maxTemp = Math.round((d.temperature_2m_max as number[])[i] ?? 20);
    const minTemp = Math.round((d.temperature_2m_min as number[])[i] ?? 10);
    const weatherCode = (d.weather_code as number[])[i] ?? 0;

    const xcScoreDay = Math.min(10, Math.max(1, Math.round(
      (maxBlh > 1500 ? 3 : maxBlh > 1000 ? 2 : 1) +
      (maxCape > 200 ? Math.min(3, maxCape / 200) : 0.5) +
      (maxWind < 20 ? 3 : maxWind < 30 ? 2 : maxWind < 40 ? 1 : 0) +
      (precipProb < 20 ? 2 : precipProb < 40 ? 1 : 0)
    )));

    const thermalScore = Math.min(10, Math.max(1, Math.round(
      (maxCape > 300 ? 4 : maxCape > 100 ? 2.5 : 1) +
      (maxBlh > 1500 ? 3 : maxBlh > 800 ? 2 : 1) +
      (maxTemp > 25 ? 2 : maxTemp > 18 ? 1.5 : 1)
    )));

    const arrivalScore = Math.min(10, Math.max(1, Math.round(
      (maxWind < 15 ? 3 : maxWind < 25 ? 2 : 1) +
      (precipProb < 20 ? 3 : precipProb < 50 ? 2 : 1) +
      (weatherCode < 10 ? 3 : weatherCode < 50 ? 2 : 1)
    )));

    const totalVol = hourly
      .filter((hh) => hh.time.startsWith(date) && hh.hour >= 10 && hh.hour <= 16)
      .reduce((acc, hh, _, arr) => acc + hh.volability / arr.length, 0);

    const flightIndex = Math.round(Math.min(100, totalVol * 10));
    const flightLabel: 'GO' | 'CAUTION' | 'STOP' = totalVol >= 7 ? 'GO' : totalVol >= 4 ? 'CAUTION' : 'STOP';

    return {
      date,
      dayName: days[dt.getDay()],
      dayShort: daysShort[dt.getDay()],
      maxTemp,
      minTemp,
      maxWind,
      maxCape,
      precipProb,
      weatherCode,
      flightIndex,
      flightLabel,
      xcScoreDay,
      xcQuality: xcScoreDay >= 8 ? "Eccellente" : xcScoreDay >= 6 ? "Buono" : xcScoreDay >= 4 ? "Limitato" : "Sconsigliato",
      arrivalScore,
      arrivalQuality: arrivalScore >= 8 ? "Liscia" : arrivalScore >= 5 ? "Moderata" : "Turbolenta",
      thermalScore,
      thermalQuality: thermalScore >= 8 ? "Forti" : thermalScore >= 6 ? "Buone" : thermalScore >= 4 ? "Deboli" : "Assenti",
      maxBlh,
      liftedIndex: maxCape > 500 ? -3 : maxCape > 200 ? -1 : 1,
      windShear: Math.round(maxWind * 0.3),
    };
  });

  // Current conditions
  const ci = safeIdx;
  const currentCape = Math.round(h.cape?.[ci] ?? 0);
  const currentBlh = Math.round(h.boundary_layer_height?.[ci] ?? 800);
  const currentTemp = h.temperature_2m?.[ci] ?? 15;
  const currentDewpoint = h.dew_point_2m?.[ci] ?? 8;
  const currentWind = Math.round(h.wind_speed_10m?.[ci] ?? 0);
  const currentGust = Math.round(h.wind_gusts_10m?.[ci] ?? 0);
  const currentWindDir = Math.round(h.wind_direction_10m?.[ci] ?? 0);
  const currentWindShear = Math.round(Math.abs((h.wind_speed_120m?.[ci] ?? 0) - (h.wind_speed_10m?.[ci] ?? 0)));
  const currentCloudbaseM = estimateCloudbaseM(currentTemp, currentDewpoint, site.altitude);
  const currentCeiling = Math.round(site.altitude + currentBlh * 0.85);
  const currentThermalMs = estimateThermalMs(currentCape, currentTemp, site.altitude, currentBlh);
  const currentCloudCover = Math.round(h.cloud_cover?.[ci] ?? 0);
  const currentVisibility = Math.round((h.visibility?.[ci] ?? 10000) / 1000);
  const currentLiftedIndex = currentCape > 500 ? -3 : currentCape > 200 ? -1 : 1;
  const turbulenceScore = Math.min(10, Math.max(1, Math.round(
    currentWindShear / 5 + (currentCape > 400 ? 3 : currentCape > 200 ? 1.5 : 0) + (currentGust > 30 ? 2 : 0)
  )));
  const turbulence: 'LOW' | 'MOD' | 'SEV' = turbulenceScore <= 3 ? 'LOW' : turbulenceScore <= 6 ? 'MOD' : 'SEV';

  const volability = calcVolability({
    windDir: currentWindDir,
    windSpeed: currentWind,
    gust: currentGust,
    cape: currentCape,
    temp: currentTemp,
    dewpoint: currentDewpoint,
    precipProb: Math.round(h.precipitation_probability?.[ci] ?? 0),
    visibility: currentVisibility,
    code: h.weather_code?.[ci] ?? 0,
    cloudCover: currentCloudCover,
    blh: currentBlh,
    windShear: currentWindShear,
    site,
  });

  const xcScore = Math.min(10, Math.max(1, Math.round(
    (currentBlh / 300) * 2 + (currentCape > 50 ? Math.min(3, currentCape / 150) : 0) + (volability.total / 10) * 5
  )));

  const thermalBase = currentCloudbaseM;
  const thermalTop = currentCeiling;
  const thermalStrength = currentThermalMs > 3 ? 3 : currentThermalMs > 2 ? 2 : currentThermalMs > 1 ? 1 : 0;

  const sun = calcSunTimes(site.lat, site.lon, now);

  const partialData: WeatherData = {
    site,
    currentTemp,
    currentWind,
    currentGust,
    currentWindDir,
    currentCape,
    currentCloudCover,
    currentVisibility,
    currentThermalMs,
    currentCloudbaseM,
    currentBlh,
    currentCeiling,
    currentDewpoint,
    currentLiftedIndex,
    currentWindShear,
    flightIndex: Math.round(volability.total * 10),
    flightLabel: volability.label,
    volability,
    thermalBase,
    thermalTop,
    thermalStrength,
    turbulence,
    turbulenceScore,
    xcScore,
    hourly,
    daily,
    sun,
    alerts: [],
    briefingText: "",
    xcRoute: xcRouteLabel(site, xcScore),
    windgram: buildWindgram(h, site.altitude),
  };

  partialData.alerts = buildAlerts(partialData);
  partialData.briefingText = buildBriefing(partialData);

  return partialData;
}

export async function fetchRanking(site: LaunchSite) {
  const params = new URLSearchParams({
    latitude: site.lat.toString(),
    longitude: site.lon.toString(),
    hourly: ["wind_speed_10m", "wind_gusts_10m", "wind_direction_10m", "cape", "boundary_layer_height", "temperature_2m", "dew_point_2m", "precipitation_probability", "visibility", "weather_code", "cloud_cover"].join(","),
    timezone: "Europe/Rome",
    forecast_days: "1",
    wind_speed_unit: "kmh",
  });

  const response = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!response.ok) throw new Error(`Ranking fetch error for ${site.id}`);
  const json = await response.json();
  const h = json.hourly as Record<string, number[]>;

  const now = new Date();
  const ci = now.getHours();
  const cape = h.cape?.[ci] ?? 0;
  const blh = h.boundary_layer_height?.[ci] ?? 800;
  const temp = h.temperature_2m?.[ci] ?? 15;
  const dewpoint = h.dew_point_2m?.[ci] ?? 8;
  const windSpeed = Math.round(h.wind_speed_10m?.[ci] ?? 0);
  const windGust = Math.round(h.wind_gusts_10m?.[ci] ?? 0);
  const windDir = h.wind_direction_10m?.[ci] ?? 0;
  const windShear = Math.abs((h.wind_speed_10m?.[ci] ?? 0) - (h.wind_speed_10m?.[Math.min(ci + 3, 23)] ?? 0));

  const vol = calcVolability({
    windDir, windSpeed, gust: windGust, cape, temp, dewpoint,
    precipProb: h.precipitation_probability?.[ci] ?? 0,
    visibility: (h.visibility?.[ci] ?? 10000) / 1000,
    code: h.weather_code?.[ci] ?? 0,
    cloudCover: h.cloud_cover?.[ci] ?? 0,
    blh, windShear, site,
  });

  const thermalMs = estimateThermalMs(cape, temp, site.altitude, blh);
  const cloudbaseM = estimateCloudbaseM(temp, dewpoint, site.altitude);

  return {
    volability: vol.total,
    label: vol.label,
    wind: windSpeed,
    gust: windGust,
    thermalMs,
    cloudbaseM,
  };
}
