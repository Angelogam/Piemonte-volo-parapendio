import { LaunchSite, VolabilityBreakdown } from "@/types/weather";

export function calcVolability(params: {
  windDir: number;
  windSpeed: number;
  gust: number;
  cape: number;
  temp: number;
  dewpoint: number;
  precipProb: number;
  visibility: number;
  code: number;
  cloudCover: number;
  blh: number;
  windShear: number;
  site: LaunchSite;
}): VolabilityBreakdown {
  const { windDir, windSpeed, gust, cape, temp, dewpoint, precipProb, visibility, code, cloudCover, blh, windShear, site } = params;

  if (code >= 95) {
    return { windDir: 0, windSpeed: 0, gusts: 0, thermals: 0, cloudbase: 0, stability: 0, total: 0.5, label: "STOP" };
  }
  if (code >= 80 || precipProb >= 85) {
    return { windDir: 0, windSpeed: 0, gusts: 0, thermals: 0, cloudbase: 0, stability: 0.2, total: 1.0, label: "STOP" };
  }
  if (code >= 63) {
    return { windDir: 0, windSpeed: 0, gusts: 0, thermals: 0, cloudbase: 0.1, stability: 0.3, total: 1.5, label: "STOP" };
  }
  if (windSpeed > site.maxWindKmh + 10 || gust > 55) {
    return { windDir: 0, windSpeed: 0, gusts: 0, thermals: 0, cloudbase: 0.3, stability: 0.5, total: 1.0, label: "STOP" };
  }

  const bestMatch = Math.min(...site.bestWindDirs.map((d) => angularDiff(windDir, d)));
  let windDirScore: number;
  if (bestMatch <= 20) windDirScore = 3.0;
  else if (bestMatch <= 45) windDirScore = 2.2;
  else if (bestMatch <= 80) windDirScore = 1.2;
  else if (bestMatch <= 120) windDirScore = 0.4;
  else windDirScore = 0.0;

  let windSpeedScore: number;
  if (windSpeed <= 8) windSpeedScore = 2.0;
  else if (windSpeed <= 15) windSpeedScore = 1.8;
  else if (windSpeed <= 22) windSpeedScore = 1.2;
  else if (windSpeed <= site.maxWindKmh) windSpeedScore = 0.5;
  else windSpeedScore = 0.0;

  let gustScore: number;
  const gustDelta = gust - windSpeed;
  if (gust <= 15) gustScore = 1.5;
  else if (gust <= 25) gustScore = 1.1;
  else if (gust <= 35) gustScore = 0.5;
  else gustScore = 0.0;
  if (gustDelta > 15) gustScore = Math.max(0, gustScore - 0.5);
  if (windShear > 25) gustScore = Math.max(0, gustScore - 0.5);
  else if (windShear > 15) gustScore = Math.max(0, gustScore - 0.25);

  const thermalMs = estimateThermalMs(cape, temp, site.altitude, blh);
  let thermalScore: number;
  if (thermalMs < 0.5) thermalScore = 0.3;
  else if (thermalMs <= 1.5) thermalScore = 1.1;
  else if (thermalMs <= 2.5) thermalScore = 1.5;
  else if (thermalMs <= 4.0) thermalScore = 0.8;
  else thermalScore = 0.2;
  if (cape > 800) thermalScore = Math.min(thermalScore, 0.3);
  const ceilingAbove = blh - site.altitude;
  if (ceilingAbove > 1500) thermalScore = Math.min(1.5, thermalScore + 0.3);
  else if (ceilingAbove > 800) thermalScore = Math.min(1.5, thermalScore + 0.1);

  const cloudbaseM = estimateCloudbaseM(temp, dewpoint, site.altitude);
  const cbAboveSite = cloudbaseM - site.altitude;
  let cloudbaseScore: number;
  if (cbAboveSite > 1500) cloudbaseScore = 1.0;
  else if (cbAboveSite > 800) cloudbaseScore = 0.8;
  else if (cbAboveSite > 400) cloudbaseScore = 0.5;
  else cloudbaseScore = 0.1;

  let stabilityScore = 1.0;
  if (code >= 60) stabilityScore -= 0.8;
  else if (code >= 51) stabilityScore -= 0.5;
  else if (code >= 45) stabilityScore -= 0.3;
  if (precipProb >= 70) stabilityScore -= 0.7;
  else if (precipProb >= 50) stabilityScore -= 0.5;
  else if (precipProb >= 30) stabilityScore -= 0.25;
  else if (precipProb >= 15) stabilityScore -= 0.1;
  if (visibility < 3) stabilityScore -= 0.5;
  else if (visibility < 5) stabilityScore -= 0.3;
  else if (visibility < 10) stabilityScore -= 0.1;
  if (cloudCover > 95) stabilityScore -= 0.35;
  else if (cloudCover > 80) stabilityScore -= 0.15;
  stabilityScore = Math.max(0, stabilityScore);

  const raw = windDirScore + windSpeedScore + gustScore + thermalScore + cloudbaseScore + stabilityScore;
  let total = Math.max(0, Math.min(10, Math.round(raw * 10) / 10));
  if (precipProb >= 70 || code >= 60) total = Math.min(total, 3.0);
  else if (precipProb >= 50 || code >= 51) total = Math.min(total, 4.5);
  else if (precipProb >= 30) total = Math.min(total, 6.0);

  const label: 'GO' | 'CAUTION' | 'STOP' = total >= 7 ? 'GO' : total >= 4 ? 'CAUTION' : 'STOP';

  return {
    windDir: Math.round(windDirScore * 10) / 10,
    windSpeed: Math.round(windSpeedScore * 10) / 10,
    gusts: Math.round(gustScore * 10) / 10,
    thermals: Math.round(thermalScore * 10) / 10,
    cloudbase: Math.round(cloudbaseScore * 10) / 10,
    stability: Math.round(stabilityScore * 10) / 10,
    total,
    label,
  };
}

function angularDiff(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

export function estimateThermalMs(cape: number, tempC: number, altM: number, blh: number = 800): number {
  if (cape < 30) return 0.1;
  const wStar = Math.pow(Math.max(0, (9.8 / 300) * blh * (cape / 1000)), 1 / 3);
  const tempBonus = Math.max(0, (tempC - 12) / 20) * 0.4;
  return Math.min(6, Math.round((wStar + tempBonus) * 10) / 10);
}

export function estimateCloudbaseM(tempC: number, dewpointC: number, siteAltM: number): number {
  const spread = Math.max(2, tempC - dewpointC);
  const cloudbaseAgl = (spread / 8) * 1000;
  return Math.round(siteAltM + Math.max(200, cloudbaseAgl));
}
