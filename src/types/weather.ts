export interface LaunchSite {
  id: string;
  name: string;
  region: string; // "CN" | "TO"
  zone: string;
  altitude: number;
  lat: number;
  lon: number;
  icon: string;
  windyLat: number;
  windyLon: number;
  windyZoom: number;
  description: string;
  orientation: string;
  bestWindDirs: number[];
  maxWindKmh: number;
  xcKm: number;
}

export interface HourlyForecast {
  time: string;
  hour: number;
  temp: number;
  windSpeed: number;
  windDir: number;
  windGust: number;
  cloudCover: number;
  capeIndex: number;
  precipProb: number;
  visibility: number;
  weatherCode: number;
  flightIndex: number;
  flightLabel: 'GO' | 'CAUTION' | 'STOP';
  volability: number;
  blh: number;
  dewpoint: number;
  temp80m: number;
  xcScore: number;
  turbScore: number;
  thermalMs?: number;
  thermalWidthM?: number;
  cloudbaseM?: number;
  ceilingM?: number;
  windSpeed80m?: number;
  windSpeed120m?: number;
  windDir80m?: number;
  windDir120m?: number;
  windShear?: number;
}

export interface DayForecast {
  date: string;
  dayName: string;
  dayShort: string;
  maxTemp: number;
  minTemp: number;
  maxWind: number;
  maxCape: number;
  precipProb: number;
  weatherCode: number;
  flightIndex: number;
  flightLabel: 'GO' | 'CAUTION' | 'STOP';
  xcScoreDay: number;
  xcQuality: string;
  arrivalQuality: string;
  arrivalScore: number;
  thermalQuality: string;
  thermalScore: number;
  maxBlh: number;
  liftedIndex: number;
  windShear: number;
}

export interface SunTimes {
  sunrise: string;
  sunset: string;
  daylightHours: number;
  progressPercent: number;
}

export interface WeatherAlert {
  type: 'danger' | 'warning' | 'info' | 'ok';
  icon: string;
  message: string;
}

export interface WindgramRow {
  altitudeM: number;
  hours: {
    hour: number;
    speedKmh: number;
    dirDeg: number;
  }[];
}

export interface VolabilityBreakdown {
  windDir: number;
  windSpeed: number;
  gusts: number;
  thermals: number;
  cloudbase: number;
  stability: number;
  total: number;
  label: 'GO' | 'CAUTION' | 'STOP';
}

export interface WeatherData {
  site: LaunchSite;
  currentTemp: number;
  currentWind: number;
  currentGust: number;
  currentWindDir: number;
  currentCape: number;
  currentCloudCover: number;
  currentVisibility: number;
  currentThermalMs: number;
  currentCloudbaseM: number;
  currentBlh: number;
  currentCeiling: number;
  currentDewpoint: number;
  currentLiftedIndex: number;
  currentWindShear: number;
  flightIndex: number;
  flightLabel: 'GO' | 'CAUTION' | 'STOP';
  volability: VolabilityBreakdown;
  thermalBase: number;
  thermalTop: number;
  thermalStrength: number;
  turbulence: 'LOW' | 'MOD' | 'SEV';
  turbulenceScore: number;
  xcScore: number;
  hourly: HourlyForecast[];
  daily: DayForecast[];
  sun: SunTimes;
  alerts: WeatherAlert[];
  briefingText: string;
  xcRoute: string | null;
  windgram: WindgramRow[];
}

export interface SiteRanking {
  site: LaunchSite;
  volability: number;
  label: 'GO' | 'CAUTION' | 'STOP';
  wind: number;
  gust: number;
  thermalMs: number;
  cloudbaseM: number;
  loading: boolean;
  error: boolean;
}
