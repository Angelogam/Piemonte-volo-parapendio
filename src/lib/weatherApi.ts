import { LaunchSite, WeatherData, HourlyForecast, DayForecast, WeatherAlert, WindgramRow } from "@/types/weather";
import { calcVolability, estimateThermalMs, estimateCloudbaseM, estimateCloudbaseMFromRH, calcXcScore } from "./volability";
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
  else if (currentCape > 300) alerts.push({ type: "warning", icon: "⛅", message: `CAPE ${currentCape} J/kg — possibili sviluppi convettivi nel pomeriggio.` });
  else if (currentCape < 50) alerts.push({ type: "info", icon: "🌡️", message: `CAPE ${currentCape} J/kg — atmosfera stabile, termiche assenti o deboli.` });
  if (currentCloudCover > 90) alerts.push({ type: "info", icon: "☁️", message: "Copertura nuvolosa totale. Termiche assenti o molto deboli." });
  return alerts;
}

function buildBriefing(data: WeatherData): string {
  const { site, currentWind, currentTemp, volability, currentCeiling, currentCloudbaseM, currentThermalMs, xcScore } = data;
  const windDirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const windDir = windDirs[Math.round(data.currentWindDir / 45) % 8];
  const label = volability.label;

  let text = `${site.name} · ${site.altitude}m slm. Vento ${windDir} ${currentWind} km/h, ${currentTemp}°C. `;
  text += `CAPE ${data.currentCape} J/kg. `;
  text += `Base cumuli stimata ${currentCloudbaseM.toLocaleString()}m, tetto termiche ${currentCeiling.toLocaleString()}m. `;
  text += `Termiche stimate ${currentThermalMs.toFixed(1)} m/s. `;

  if (label === "GO") {
    text += `✅ VOLA — Volabilità ${volability.total}/10, XC ${xcScore}/10. `;
  } else if (label === "CAUTION") {
    text += `⚠️ VALUTA — Volabilità ${volability.total}/10, attenzione al meteo. `;
  } else {
    text += `🚫 NON VOLARE — Volabilità ${volability.total}/10. `;
  }

  if (currentWind > 30) text += "⚠️ Vento forte. ";
  if (data.currentCape > 500) text += "⚠️ CAPE elevato, rischio CuNb. ";
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

function xcRouteLabel(site: LaunchSite, xcScore: number): string | null {
  if (xcScore < 5) return null;
  if (xcScore >= 8) return `${site.name} → Valle Pianura (${site.xcKm} km FAI)`;
  if (xcScore >= 6) return `${site.name} → XC locale (${Math.round(site.xcKm * 0.6)} km)`;
  return null;
}

export async function fetchWeather(site: LaunchSite): Promise<WeatherData> {
  console.log(`[API] Fetching weather for ${site.name} (${site.lat}, ${site.lon})`);
  
  const params = new URLSearchParams({
    latitude: site.lat.toString(),
    longitude: site.lon.toString(),
    // Dati correnti REALI
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "pressure_msl",
      "cloud_cover",
      "rain",
      "showers",
      "snowfall",
      "weather_code",
      "cape",
    ].join(","),
    // Dati orari
    hourly: [
      "temperature_2m",
      "dew_point_2m",
      "relative_humidity_2m",
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
      "wind_direction_80m",
      "wind_speed_120m",
      "wind_direction_120m",
    ].join(","),
    // Dati giornalieri
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const response = await fetch(`${BASE_URL}?${params.toString()}`, { signal: controller.signal });
  clearTimeout(timeout);
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Open-Meteo error ${response.status}: ${err}`);
  }
  const json = await response.json();

  // ── CURRENT (dati istantanei reali) ──────────────────────────────────
  const cur = json.current as Record<string, number>;
  const currentTemp = cur.temperature_2m ?? 15;
  const currentHumidity = cur.relative_humidity_2m ?? 60;
  const currentWind = Math.round(cur.wind_speed_10m ?? 0);
  const currentGust = Math.round(cur.wind_gusts_10m ?? 0);
  const currentWindDir = Math.round(cur.wind_direction_10m ?? 0);
  const currentCape = Math.round(cur.cape ?? 0);
  const currentCloudCover = Math.round(cur.cloud_cover ?? 0);
  const currentWeatherCode = cur.weather_code ?? 0;

  console.log(`[Current] ${site.name}: Temp=${currentTemp}°C, Vento=${currentWind}km/h, CAPE=${currentCape}J/kg, Nuvole=${currentCloudCover}%`);

  // ── HOURLY ─────────────────────────────────────────────────────────────
  const h = json.hourly as Record<string, number[]>;
  const times: string[] = h.time as unknown as string[];
  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = now.toISOString().slice(0, 10);

  const nowIdx = times.findIndex((t) => t.startsWith(todayStr) && parseInt(t.slice(11, 13)) === currentHour);
  const safeIdx = nowIdx >= 0 ? nowIdx : currentHour;

  const hourly: HourlyForecast[] = times.map((time, i) => {
    const hour = parseInt(time.slice(11, 13));
    const cape = h.cape?.[i] ?? 0;
    const blh = h.boundary_layer_height?.[i] ?? 500;
    const temp = h.temperature_2m?.[i] ?? 15;
    const dewpoint = h.dew_point_2m?.[i] ?? (temp - 8);
    const humidity = h.relative_humidity_2m?.[i] ?? 65;
    const windSpeed = Math.round(h.wind_speed_10m?.[i] ?? 0);
    const windDir = Math.round(h.wind_direction_10m?.[i] ?? 0);
    const windGust = Math.round(h.wind_gusts_10m?.[i] ?? 0);
    const windSpeed80m = Math.round(h.wind_speed_80m?.[i] ?? windSpeed * 1.2);
    const windSpeed120m = Math.round(h.wind_speed_120m?.[i] ?? windSpeed * 1.35);
    const windDir80m = Math.round(h.wind_direction_80m?.[i] ?? windDir);
    const windDir120m = Math.round(h.wind_direction_120m?.[i] ?? windDir);
    const windShear = Math.abs(windSpeed120m - windSpeed);
    const precipProb = Math.round(h.precipitation_probability?.[i] ?? 0);
    const vis = Math.round((h.visibility?.[i] ?? 10000) / 1000);
    const cloudCover = Math.round(h.cloud_cover?.[i] ?? 0);
    const weatherCode = h.weather_code?.[i] ?? 0;

    const vol = calcVolability({
      windDir, windSpeed, gust: windGust, cape, temp, dewpoint,
      precipProb, visibility: vis, code: weatherCode, cloudCover,
      blh, windShear, humidity, windSpeed80m, site,
    });

    const thermalMs = estimateThermalMs(cape, temp, site.altitude, blh);
    const cloudbaseM = estimateCloudbaseM(temp, dewpoint, site.altitude);
    const ceiling = Math.round(site.altitude + blh * 0.85);
    const xcScore = calcXcScore(windSpeed, thermalMs);
    const turbScore = Math.min(10, Math.max(1, Math.round(
      windShear / 5 + (cape > 400 ? 3 : cape > 200 ? 1.5 : 0) + (windGust > 30 ? 2 : 0)
    )));

    return {
      time,
      hour,
      temp,
      windSpeed,
      windDir,
      windGust,
      cloudCover,
      capeIndex: Math.round(cape),
      precipProb,
      visibility: vis,
      weatherCode,
      flightIndex: Math.round(vol.total * 10),
      flightLabel: vol.label,
      volability: vol.total,
      blh: Math.round(blh),
      dewpoint: Math.round(dewpoint * 10) / 10,
      temp80m: temp - 0.65,
      xcScore,
      turbScore,
      thermalMs,
      cloudbaseM,
      ceilingM: ceiling,
      windSpeed80m,
      windSpeed120m,
      windDir80m,
      windDir120m,
      windShear: Math.round(windShear),
    };
  });

  // ── DAILY ─────────────────────────────────────────────────────────────
  const d = json.daily as Record<string, unknown[]>;
  const dailyTimes = d.time as string[];
  const dayNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  const dayNamesShort = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

  const daily: DayForecast[] = dailyTimes.map((date, i) => {
    const dt = new Date(date + "T12:00:00");
    const maxWind = Math.round((d.wind_speed_10m_max as number[])[i] ?? 0);
    const precipProb = Math.round((d.precipitation_probability_max as number[])[i] ?? 0);
    const maxTemp = Math.round((d.temperature_2m_max as number[])[i] ?? 20);
    const minTemp = Math.round((d.temperature_2m_min as number[])[i] ?? 10);
    const weatherCode = (d.weather_code as number[])[i] ?? 0;

    const dayHours = hourly.filter((hh) => hh.time.startsWith(date) && hh.hour >= 10 && hh.hour <= 16);
    const maxCape = dayHours.reduce((acc, hh) => Math.max(acc, hh.capeIndex), 0);
    const maxBlh = dayHours.reduce((acc, hh) => Math.max(acc, hh.blh), 500);

    const avgThermal = dayHours.length > 0
      ? dayHours.reduce((acc, hh) => acc + (hh.thermalMs ?? 0), 0) / dayHours.length
      : estimateThermalMs(maxCape, maxTemp, site.altitude, maxBlh);

    const xcScoreDay = Math.min(10, Math.max(1, Math.round(calcXcScore(maxWind, avgThermal))));

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

    const avgVol = dayHours.length > 0
      ? dayHours.reduce((acc, hh) => acc + hh.volability, 0) / dayHours.length
      : 0;

    const flightIndex = Math.round(Math.min(100, avgVol * 10));
    const flightLabel: 'GO' | 'CAUTION' | 'STOP' = avgVol >= 7 ? 'GO' : avgVol >= 4 ? 'CAUTION' : 'STOP';

    return {
      date,
      dayName: dayNames[dt.getDay()],
      dayShort: dayNamesShort[dt.getDay()],
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

  // ── CURRENT CONDITIONS (usando dati reali da /current) ────────────────
  const currentDewpoint = currentTemp - ((100 - currentHumidity) / 5);
  const currentCloudbaseM = estimateCloudbaseMFromRH(currentTemp, currentHumidity, site.altitude);
  const currentBlh = Math.round(h.boundary_layer_height?.[safeIdx] ?? 800);
  const currentCeiling = Math.round(site.altitude + currentBlh * 0.85);
  const currentThermalMs = estimateThermalMs(currentCape, currentTemp, site.altitude, currentBlh);
  const currentVisibility = Math.round((h.visibility?.[safeIdx] ?? 10000) / 1000);
  const currentWindShear = Math.abs(
    Math.round(h.wind_speed_120m?.[safeIdx] ?? currentWind * 1.35) - currentWind
  );
  const currentLiftedIndex = currentCape > 500 ? -3 : currentCape > 200 ? -1 : 1;
  const turbulenceScore = Math.min(10, Math.max(1, Math.round(
    currentWindShear / 5 + (currentCape > 400 ? 3 : currentCape > 200 ? 1.5 : 0) + (currentGust > 30 ? 2 : 0)
  )));
  const turbulence: 'LOW' | 'MOD' | 'SEV' = turbulenceScore <= 3 ? 'LOW' : turbulenceScore <= 6 ? 'MOD' : 'SEV';
  const currentWindSpeed80m = Math.round(h.wind_speed_80m?.[safeIdx] ?? currentWind * 1.2);

  console.log(`[Conditions] ${site.name}: CAPE=${currentCape}, Thermals=${currentThermalMs}m/s, Cloudbase=${currentCloudbaseM}m, Ceiling=${currentCeiling}m`);

  const volability = calcVolability({
    windDir: currentWindDir,
    windSpeed: currentWind,
    gust: currentGust,
    cape: currentCape,
    temp: currentTemp,
    dewpoint: currentDewpoint,
    precipProb: Math.round(h.precipitation_probability?.[safeIdx] ?? 0),
    visibility: currentVisibility,
    code: currentWeatherCode,
    cloudCover: currentCloudCover,
    blh: currentBlh,
    windShear: currentWindShear,
    humidity: currentHumidity,
    windSpeed80m: currentWindSpeed80m,
    site,
  });

  const xcScore = calcXcScore(currentWind, currentThermalMs);
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
    currentDewpoint: Math.round(currentDewpoint * 10) / 10,
    currentLiftedIndex,
    currentWindShear,
    flightIndex: Math.round(volability.total * 10),
    flightLabel: volability.label,
    volability,
    thermalBase: currentCloudbaseM,
    thermalTop: currentCeiling,
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

// ── Ranking fetch (leggero, per la lista a sinistra) ──────────────────
export async function fetchRanking(site: LaunchSite) {
  const params = new URLSearchParams({
    latitude: site.lat.toString(),
    longitude: site.lon.toString(),
    current: ["temperature_2m", "relative_humidity_2m", "wind_speed_10m", "wind_gusts_10m", "wind_direction_10m", "cape", "cloud_cover", "weather_code"].join(","),
    hourly: ["wind_speed_80m", "precipitation_probability", "cape", "boundary_layer_height", "dew_point_2m"].join(","),
    timezone: "Europe/Rome",
    forecast_days: "1",
    wind_speed_unit: "kmh",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  const response = await fetch(`${BASE_URL}?${params.toString()}`, { signal: controller.signal });
  clearTimeout(timeout);
  
  if (!response.ok) throw new Error(`Ranking fetch error for ${site.id}`);
  const json = await response.json();

  const cur = json.current as Record<string, number>;
  const h = json.hourly as Record<string, number[]>;
  const ci = new Date().getHours();

  const cape = cur.cape ?? 0;
  const temp = cur.temperature_2m ?? 15;
  const humidity = cur.relative_humidity_2m ?? 65;
  const windSpeed = Math.round(cur.wind_speed_10m ?? 0);
  const windGust = Math.round(cur.wind_gusts_10m ?? 0);
  const windDir = cur.wind_direction_10m ?? 0;
  const windSpeed80m = Math.round(h.wind_speed_80m?.[ci] ?? windSpeed * 1.2);
  const blh = h.boundary_layer_height?.[ci] ?? 800;
  const dewpoint = h.dew_point_2m?.[ci] ?? (temp - 8);
  const windShear = Math.abs(windSpeed80m - windSpeed);
  const precipProb = h.precipitation_probability?.[ci] ?? 0;

  const vol = calcVolability({
    windDir, windSpeed, gust: windGust, cape, temp, dewpoint,
    precipProb,
    visibility: 15,
    code: cur.weather_code ?? 0,
    cloudCover: cur.cloud_cover ?? 0,
    blh, windShear, humidity, windSpeed80m, site,
  });

  const thermalMs = estimateThermalMs(cape, temp, site.altitude, blh);
  const cloudbaseM = estimateCloudbaseMFromRH(temp, humidity, site.altitude);

  console.log(`[Ranking] ${site.name}: V=${vol.total.toFixed(1)} (${vol.label}), Termica=${thermalMs}m/s, CAPE=${Math.round(cape)}`);

  return {
    volability: vol.total,
    label: vol.label,
    wind: windSpeed,
    gust: windGust,
    thermalMs,
    cloudbaseM,
  };
}
