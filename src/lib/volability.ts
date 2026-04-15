import { LaunchSite, VolabilityBreakdown } from "@/types/weather";

/**
 * Stima le termiche in m/s basandosi su CAPE e umidità relativa
 * Formula basata su specifica utente:
 * CAPE > 500 → 3-5 m/s (Forte)
 * CAPE 100-500 → 1-3 m/s (Moderata)
 * CAPE 50-100 → 0.5-1 m/s (Debole)
 * CAPE < 50 → 0-0.5 m/s (Assenti)
 */
export function estimateThermalMs(cape: number, tempC: number, altM: number, blh: number = 800): number {
  console.log(`[Termica] CAPE=${cape} J/kg, Temp=${tempC}°C, Alt=${altM}m, BLH=${blh}m`);
  
  let base: number;
  if (cape > 500) {
    // Forte: scala lineare da 3 a 5 m/s
    base = 3.0 + Math.min(2.0, (cape - 500) / 500);
  } else if (cape >= 100) {
    // Moderata: scala lineare da 1 a 3 m/s
    base = 1.0 + ((cape - 100) / 400) * 2.0;
  } else if (cape >= 50) {
    // Debole: scala lineare da 0.5 a 1 m/s
    base = 0.5 + ((cape - 50) / 50) * 0.5;
  } else if (cape >= 10) {
    // Assenti ma minime: 0.1 - 0.5 m/s
    base = 0.1 + (cape / 50) * 0.4;
  } else {
    // Quasi nullo
    base = 0.0;
  }

  // Bonus temperatura (surriscaldamento suolo)
  const tempBonus = Math.max(0, (tempC - 15) / 25) * 0.5;
  
  const result = Math.min(6, Math.round((base + tempBonus) * 10) / 10);
  console.log(`[Termica] Risultato: ${result} m/s`);
  return result;
}

/**
 * Calcola quota base nuvole in metri slm
 * Formula: base_nuvole = (100 - umidita) * 25 + altitudine_decollo
 * Oppure: spread = temp - dewpoint → cloud_base_agl = spread * 125m
 */
export function estimateCloudbaseM(tempC: number, dewpointC: number, siteAltM: number): number {
  const spread = Math.max(1, tempC - dewpointC);
  const cloudbaseAgl = spread * 125; // 125m per ogni grado di spread
  const result = Math.round(siteAltM + Math.max(150, cloudbaseAgl));
  console.log(`[Cloudbase] Temp=${tempC}°C, DP=${dewpointC}°C, Spread=${spread}°, AGL=${cloudbaseAgl}m, MSL=${result}m`);
  return result;
}

/**
 * Calcola quota base nuvole usando umidità relativa
 * Formula alternativa: (100 - RH) * 25 + altitudine
 */
export function estimateCloudbaseMFromRH(tempC: number, humidity: number, siteAltM: number): number {
  const cloudbaseAgl = (100 - humidity) * 25;
  const result = Math.round(siteAltM + Math.max(150, cloudbaseAgl));
  console.log(`[Cloudbase RH] Temp=${tempC}°C, RH=${humidity}%, AGL=${cloudbaseAgl}m, MSL=${result}m`);
  return result;
}

/**
 * Calcola XC Score secondo formula utente:
 * XC Score = (punteggio_vento * 0.4) + (punteggio_termica * 0.6)
 * punteggio_vento = max(0, min(10, (30 - velocita_vento_media) / 3))
 * punteggio_termica = max(0, min(10, termica_mps * 2))
 */
export function calcXcScore(windSpeed: number, thermalMs: number): number {
  const punteggioVento = Math.max(0, Math.min(10, (30 - windSpeed) / 3));
  const punteggioTermica = Math.max(0, Math.min(10, thermalMs * 2));
  const xcScore = Math.round((punteggioVento * 0.4 + punteggioTermica * 0.6) * 10) / 10;
  console.log(`[XC] Vento=${windSpeed}km/h→${punteggioVento.toFixed(1)}, Termica=${thermalMs}m/s→${punteggioTermica.toFixed(1)}, XC=${xcScore}`);
  return Math.round(xcScore);
}

/**
 * GO/NO-GO secondo regole utente:
 * GO se: vento_10m < 25 km/h AND vento_80m < 35 km/h AND CAPE > 50 AND pioggia_prob < 30%
 */
export function calcGoNoGo(windSpeed10m: number, windSpeed80m: number, cape: number, precipProb: number): 'GO' | 'CAUTION' | 'STOP' {
  console.log(`[GO/NOGO] Vento10m=${windSpeed10m}, Vento80m=${windSpeed80m}, CAPE=${cape}, Pioggia=${precipProb}%`);
  
  // STOP conditions
  if (windSpeed10m >= 30 || windSpeed80m >= 45 || precipProb >= 60) {
    return 'STOP';
  }
  
  // GO conditions (secondo specifica)
  if (windSpeed10m < 25 && windSpeed80m < 35 && cape > 50 && precipProb < 30) {
    return 'GO';
  }
  
  // CAUTION per tutto il resto
  return 'CAUTION';
}

function angularDiff(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

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
  humidity?: number;
  windSpeed80m?: number;
  site: LaunchSite;
}): VolabilityBreakdown {
  const { windDir, windSpeed, gust, cape, temp, dewpoint, precipProb, visibility, code, cloudCover, blh, windShear, site } = params;
  const windSpeed80m = params.windSpeed80m ?? Math.round(windSpeed * 1.2);

  // HARD STOP
  if (code >= 95) return { windDir: 0, windSpeed: 0, gusts: 0, thermals: 0, cloudbase: 0, stability: 0, total: 0.5, label: "STOP" };
  if (code >= 80 || precipProb >= 85) return { windDir: 0, windSpeed: 0, gusts: 0, thermals: 0, cloudbase: 0, stability: 0.2, total: 1.0, label: "STOP" };
  if (code >= 63) return { windDir: 0, windSpeed: 0, gusts: 0, thermals: 0, cloudbase: 0.1, stability: 0.3, total: 1.5, label: "STOP" };
  if (windSpeed > site.maxWindKmh + 10 || gust > 55) return { windDir: 0, windSpeed: 0, gusts: 0, thermals: 0, cloudbase: 0.3, stability: 0.5, total: 1.0, label: "STOP" };

  // 1. Wind Direction (0–3)
  const bestMatch = Math.min(...site.bestWindDirs.map((d) => angularDiff(windDir, d)));
  let windDirScore: number;
  if (bestMatch <= 20) windDirScore = 3.0;
  else if (bestMatch <= 45) windDirScore = 2.2;
  else if (bestMatch <= 80) windDirScore = 1.2;
  else if (bestMatch <= 120) windDirScore = 0.4;
  else windDirScore = 0.0;

  // 2. Wind Speed (0–2)
  let windSpeedScore: number;
  if (windSpeed <= 8) windSpeedScore = 2.0;
  else if (windSpeed <= 15) windSpeedScore = 1.8;
  else if (windSpeed <= 22) windSpeedScore = 1.2;
  else if (windSpeed <= site.maxWindKmh) windSpeedScore = 0.5;
  else windSpeedScore = 0.0;

  // 3. Gusts (0–1.5)
  let gustScore: number;
  const gustDelta = gust - windSpeed;
  if (gust <= 15) gustScore = 1.5;
  else if (gust <= 25) gustScore = 1.1;
  else if (gust <= 35) gustScore = 0.5;
  else gustScore = 0.0;
  if (gustDelta > 15) gustScore = Math.max(0, gustScore - 0.5);
  if (windShear > 25) gustScore = Math.max(0, gustScore - 0.5);
  else if (windShear > 15) gustScore = Math.max(0, gustScore - 0.25);

  // 4. Thermals (0–1.5) — basato su CAPE reale
  const thermalMs = estimateThermalMs(cape, temp, site.altitude, blh);
  let thermalScore: number;
  if (thermalMs < 0.1) thermalScore = 0.1;
  else if (thermalMs < 0.5) thermalScore = 0.3;
  else if (thermalMs <= 1.5) thermalScore = 1.0;
  else if (thermalMs <= 2.5) thermalScore = 1.5;
  else if (thermalMs <= 4.0) thermalScore = 0.9;
  else thermalScore = 0.3; // troppo forti = pericolose
  if (cape > 800) thermalScore = Math.min(thermalScore, 0.3);

  // 5. Cloudbase (0–1)
  const cloudbaseM = estimateCloudbaseM(temp, dewpoint, site.altitude);
  const cbAboveSite = cloudbaseM - site.altitude;
  let cloudbaseScore: number;
  if (cbAboveSite > 1500) cloudbaseScore = 1.0;
  else if (cbAboveSite > 800) cloudbaseScore = 0.8;
  else if (cbAboveSite > 400) cloudbaseScore = 0.5;
  else cloudbaseScore = 0.1;

  // 6. Stability (0–1)
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

  // GO/NO-GO override con regole semplici
  const goNogo = calcGoNoGo(windSpeed, windSpeed80m, cape, precipProb);
  let label: 'GO' | 'CAUTION' | 'STOP';
  if (goNogo === 'STOP') label = 'STOP';
  else if (goNogo === 'GO' && total >= 5) label = 'GO';
  else if (total >= 7) label = 'GO';
  else if (total >= 4) label = 'CAUTION';
  else label = 'STOP';

  console.log(`[Volabilità] ${site.name}: dir=${windDirScore} vel=${windSpeedScore} gusts=${gustScore} thermal=${thermalScore} cloud=${cloudbaseScore} stab=${stabilityScore} → total=${total} → ${label}`);

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
