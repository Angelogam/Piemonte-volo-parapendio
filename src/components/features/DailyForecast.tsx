import { useState } from "react";
import { DayForecast, HourlyForecast } from "@/types/weather";
import { cn } from "@/lib/utils";
import AnimatedWeatherIcon from "@/components/features/AnimatedWeatherIcon";

interface Props {
  daily: DayForecast[];
  hourly?: HourlyForecast[];
  onDaySelect?: (dayIndex: number) => void;
}

function getVolColor(label: "GO" | "CAUTION" | "STOP") {
  if (label === "GO") return { text: "hsl(142 76% 65%)", bg: "hsl(142 76% 45% / 0.12)", border: "hsl(142 76% 45% / 0.5)", glow: "shadow-[0_0_10px_hsl(142_76%_35%/0.3)]" };
  if (label === "CAUTION") return { text: "hsl(43 100% 68%)", bg: "hsl(43 100% 52% / 0.10)", border: "hsl(43 100% 52% / 0.45)", glow: "shadow-[0_0_10px_hsl(43_100%_35%/0.25)]" };
  return { text: "hsl(0 90% 68%)", bg: "hsl(0 90% 55% / 0.08)", border: "hsl(0 90% 55% / 0.45)", glow: "" };
}

function getVolLabel(label: "GO" | "CAUTION" | "STOP") {
  if (label === "GO") return { text: "VOLA", emoji: "🪂" };
  if (label === "CAUTION") return { text: "VALUTA", emoji: "⚠️" };
  return { text: "NON VOLARE", emoji: "🚫" };
}

function ScoreBar({ score, color, max = 10 }: { score: number; color: string; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5 flex-1">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex-1 h-2 rounded-sm transition-all"
            style={{ background: i < Math.round(score * (10 / max)) ? color : "hsl(220 16% 18%)" }} />
        ))}
      </div>
      <span className="text-sm font-black font-mono w-10 text-right" style={{ color }}>{score}/{max}</span>
    </div>
  );
}

const xcColor = (s: number) => s >= 8 ? "hsl(142 76% 65%)" : s >= 6 ? "hsl(43 100% 68%)" : s >= 4 ? "hsl(25 90% 60%)" : "hsl(0 90% 65%)";
const thermalColorFn = (s: number) => s >= 8 ? "hsl(25 90% 60%)" : s >= 6 ? "hsl(43 100% 68%)" : s >= 4 ? "hsl(142 76% 65%)" : "hsl(215 14% 60%)";
const volCol = (v: number) => v >= 7 ? "hsl(142 76% 65%)" : v >= 4 ? "hsl(43 100% 65%)" : "hsl(0 90% 65%)";
const windCol = (w: number) => w > 30 ? "hsl(0 90% 68%)" : w > 20 ? "hsl(43 100% 68%)" : "hsl(200 90% 82%)";
const thermalCol = (t: number) => t > 2.5 ? "hsl(25 90% 68%)" : t > 1.5 ? "hsl(43 100% 68%)" : t > 0.5 ? "hsl(142 76% 65%)" : "hsl(215 14% 50%)";
const precipCol = (p: number) => p > 60 ? "hsl(0 90% 65%)" : p > 30 ? "hsl(43 100% 65%)" : "hsl(215 14% 55%)";

// Estimated hourly data used when real API data is missing for future days
interface HourRow {
  hour: number;
  temp: number;
  wind: number;
  gust: number;
  cloudbase: number;
  thermalMs: number;
  volability: number;
  blh: number;
  xcScore: number;
  thermalGain: number;
  precipProb: number;
  weatherCode: number;
  isReal: boolean;
  realHourly?: HourlyForecast;
}

function buildEstimatedHourly(d: DayForecast): HourRow[] {
  const rows: HourRow[] = [];
  for (let h = 9; h <= 19; h++) {
    const tempFactor = Math.sin(((h - 6) / 15) * Math.PI);
    const temp = Math.round(d.minTemp + (d.maxTemp - d.minTemp) * tempFactor);
    const windFactor = 0.6 + 0.4 * Math.sin(((h - 8) / 12) * Math.PI);
    const wind = Math.round(d.maxWind * windFactor * 0.85);
    const gust = Math.round(wind * 1.35);
    const thermalFactor = h >= 10 && h <= 16
      ? Math.sin(((h - 9) / 8) * Math.PI)
      : h < 10 ? ((h - 6) / 4) * 0.3 : ((21 - h) / 6) * 0.2;
    const thermalMs = Math.max(0, Math.round((d.maxCape / 400) * 3.5 * thermalFactor * 10) / 10);
    const blh = Math.round(d.maxBlh * thermalFactor * 0.9);
    const spreadProxy = Math.max(3, (d.maxTemp - d.minTemp) * 0.4 + 4);
    const cloudbase = Math.round(800 + spreadProxy * 125 + (temp - d.minTemp) * 50);
    const thermalGain = Math.max(0, Math.round(blh * 0.85));
    const windScore = wind < 15 ? 3 : wind < 25 ? 2 : wind < 35 ? 1 : 0;
    const thermalScore = thermalMs > 2 ? 2.5 : thermalMs > 1 ? 2 : thermalMs > 0.5 ? 1 : 0;
    const cloudScore = cloudbase > 1800 ? 1.5 : cloudbase > 1200 ? 1 : 0.5;
    const precipScore = d.precipProb < 10 ? 2 : d.precipProb < 30 ? 1 : d.precipProb < 60 ? 0.5 : 0;
    const hourScore = h >= 10 && h <= 16 ? 1 : 0;
    const volability = Math.min(10, Math.max(0, windScore + thermalScore + cloudScore + precipScore + hourScore));
    const xcH = Math.min(10, Math.round(
      (blh > 1500 ? 3 : blh > 1000 ? 2 : 1) + (thermalMs > 2 ? 3 : thermalMs > 1 ? 2 : 0.5) +
      (wind < 20 ? 2 : wind < 30 ? 1 : 0) + (d.precipProb < 20 ? 2 : 0)
    ));
    rows.push({
      hour: h, temp, wind, gust, cloudbase,
      thermalMs: Math.round(thermalMs * 10) / 10,
      volability: Math.round(volability * 10) / 10,
      blh, xcScore: xcH, thermalGain,
      precipProb: d.precipProb,
      weatherCode: d.weatherCode,
      isReal: false,
    });
  }
  return rows;
}

function buildRealHourly(date: string, hourly: HourlyForecast[]): HourRow[] {
  return hourly
    .filter((h) => h.time?.startsWith(date) && h.hour >= 9 && h.hour <= 19)
    .map((h) => {
      const thermalMs = (h as any).thermalMs ?? 0;
      const cloudbaseM = (h as any).cloudbaseM ?? 1200;
      return {
        hour: h.hour,
        temp: h.temp,
        wind: h.windSpeed,
        gust: h.windGust,
        cloudbase: cloudbaseM,
        thermalMs,
        volability: h.volability,
        blh: h.blh ?? 800,
        xcScore: h.xcScore,
        thermalGain: Math.round((h.blh ?? 800) * 0.85),
        precipProb: h.precipProb,
        weatherCode: h.weatherCode,
        isReal: true,
        realHourly: h,
      };
    });
}

// ── Hour Detail Modal ─────────────────────────────────────────────────
function HourDetailModal({ row, dayName, onClose }: { row: HourRow; dayName: string; onClose: () => void }) {
  const vc = volCol(row.volability);
  const volLabel = row.volability >= 7 ? "🪂 VOLA" : row.volability >= 4 ? "⚠️ VALUTA" : "🚫 NON VOLARE";
  const isWindow = row.hour >= 10 && row.hour <= 16;
  const h = row.realHourly;

  const dangerIdx = Math.min(10, Math.max(1, Math.round(
    (row.wind > 30 ? 3 : row.wind > 20 ? 1.5 : 0) +
    (row.gust > 40 ? 2 : row.gust > 30 ? 1 : 0) +
    (row.thermalMs > 4 ? 1.5 : 0) +
    (row.precipProb > 60 ? 2 : row.precipProb > 30 ? 1 : 0) +
    (h?.turbScore && h.turbScore > 7 ? 1 : 0)
  )));

  const windDir80 = h ? ((h as any).windSpeed80m ?? Math.round(h.windSpeed * 1.2)) : Math.round(row.wind * 1.2);
  const windDir120 = h ? ((h as any).windSpeed120m ?? Math.round(h.windSpeed * 1.35)) : Math.round(row.wind * 1.35);
  const windDirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const wDirLabel = h ? windDirs[Math.round((h.windDir ?? 0) / 45) % 8] : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[hsl(220_23%_9%)] border border-[hsl(220_16%_22%)] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto fade-up"
        onClick={(e) => e.stopPropagation()}>

        {/* Sticky header */}
        <div className="sticky top-0 bg-[hsl(220_23%_9%)] px-5 pt-5 pb-4 border-b border-[hsl(220_16%_18%)] flex items-start justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ background: `${vc}15`, border: `1px solid ${vc}30` }}>
              <AnimatedWeatherIcon code={row.weatherCode} hour={row.hour} size="lg" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-white text-2xl">{row.hour.toString().padStart(2, "0")}:00</span>
                <span className="text-sm text-[hsl(215_14%_50%)]">{dayName}</span>
                {isWindow && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(142_76%_45%/0.2)] text-[hsl(142_76%_65%)] border border-[hsl(142_76%_45%/0.4)] font-bold">
                    🪂 Finestra
                  </span>
                )}
              </div>
              <div className="text-base font-black mt-0.5" style={{ color: vc }}>{volLabel}</div>
              {!row.isReal && (
                <div className="text-[10px] text-[hsl(215_14%_40%)] mt-0.5">⚠️ Dati stimati — previsioni giornaliere</div>
              )}
              {row.isReal && (
                <div className="text-[10px] text-[hsl(142_76%_50%)] mt-0.5">✓ Dati reali API meteo</div>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-[hsl(220_16%_18%)] text-[hsl(215_14%_60%)] hover:text-white text-xl transition-colors shrink-0">
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">

          {/* Big score pair */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border p-5 text-center" style={{ borderColor: `${vc}40`, background: `${vc}0d` }}>
              <div className="text-sm text-[hsl(215_14%_55%)] font-medium">Volabilità</div>
              <div className="text-6xl font-black my-2 leading-none" style={{ color: vc }}>{row.volability.toFixed(1)}</div>
              <div className="text-sm text-[hsl(215_14%_50%)]">/10</div>
              <div className="mt-2 h-2 bg-[hsl(220_16%_18%)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(row.volability / 10) * 100}%`, background: vc }} />
              </div>
            </div>
            <div className="rounded-2xl border p-5 text-center"
              style={{
                borderColor: `${dangerIdx >= 6 ? "#f87171" : dangerIdx >= 4 ? "#fbbf24" : "#4ade80"}40`,
                background: `${dangerIdx >= 6 ? "#f87171" : dangerIdx >= 4 ? "#fbbf24" : "#4ade80"}0d`
              }}>
              <div className="text-sm text-[hsl(215_14%_55%)] font-medium">Non-Volo</div>
              <div className="text-6xl font-black my-2 leading-none"
                style={{ color: dangerIdx >= 6 ? "#f87171" : dangerIdx >= 4 ? "#fbbf24" : "#4ade80" }}>
                {dangerIdx}
              </div>
              <div className="text-sm text-[hsl(215_14%_50%)]">/10</div>
              <div className="mt-2 h-2 bg-[hsl(220_16%_18%)] rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{ width: `${dangerIdx * 10}%`, background: dangerIdx >= 6 ? "#f87171" : dangerIdx >= 4 ? "#fbbf24" : "#4ade80" }} />
              </div>
            </div>
          </div>

          {/* Main conditions grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "🌡️", label: "Temperatura", value: `${row.temp}°C`, sub: h ? `Rugiada ${(h as any).dewpoint?.toFixed(0) ?? "—"}°C` : undefined },
              { icon: "💨", label: "Vento", value: `${row.wind} km/h`, sub: wDirLabel !== "—" ? `Direzione ${wDirLabel}` : undefined, alert: row.wind > 25 },
              { icon: "💥", label: "Raffiche", value: `${row.gust} km/h`, sub: row.gust > 35 ? "⚠️ Pericolose" : "OK", alert: row.gust > 35 },
              { icon: "🌧️", label: "Precipitazioni", value: `${row.precipProb}%`, sub: "probabilità", alert: row.precipProb > 50 },
              { icon: "🌀", label: "Termiche", value: row.thermalMs > 0 ? `${row.thermalMs.toFixed(1)} m/s` : "Assenti", sub: row.thermalMs > 3 ? "Forti 🚀" : row.thermalMs > 2 ? "Ottime" : row.thermalMs > 1 ? "Buone" : "Deboli" },
              { icon: "☁️", label: "Base Cumuli", value: `${row.cloudbase.toLocaleString()} m`, sub: `+${(row.cloudbase - 0).toLocaleString()}m AGL` },
              { icon: "🚀", label: "Tetto Termico", value: `${(row.blh + 0).toLocaleString()} m AGL`, sub: `+${row.thermalGain.toLocaleString()}m sviluppo` },
              { icon: "⚡", label: "CAPE", value: h ? `${h.capeIndex} J/kg` : "—", sub: h && h.capeIndex > 600 ? "⚠️ Pericoloso" : h && h.capeIndex > 300 ? "Attivo" : "Stabile", alert: h ? h.capeIndex > 500 : false },
              { icon: "🏆", label: "XC Score", value: `${row.xcScore}/10`, sub: row.xcScore >= 7 ? "Eccellente" : row.xcScore >= 5 ? "Buono" : "Limitato" },
              { icon: "💧", label: "Copertura Nuvole", value: h ? `${h.cloudCover}%` : "—" },
              { icon: "👁️", label: "Visibilità", value: h ? `${h.visibility} km` : "—", sub: h && h.visibility > 10 ? "Eccellente" : h && h.visibility > 5 ? "Buona" : h ? "Ridotta ⚠️" : undefined },
              { icon: "💥", label: "Turbolenza", value: h ? `${h.turbScore}/10` : "—", alert: h ? h.turbScore > 6 : false },
            ].map((item) => (
              <div key={item.label}
                className={cn("rounded-xl p-3.5 border",
                  (item as any).alert
                    ? "bg-[hsl(0_90%_55%/0.08)] border-[hsl(0_90%_55%/0.3)]"
                    : "bg-[hsl(220_20%_11%)] border-[hsl(220_16%_18%)]"
                )}>
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="text-xs text-[hsl(215_14%_50%)] font-medium">{item.label}</div>
                <div className="font-black text-white text-base mt-0.5">{item.value}</div>
                {(item as any).sub && <div className="text-xs text-[hsl(215_14%_45%)] mt-0.5">{(item as any).sub}</div>}
              </div>
            ))}
          </div>

          {/* Wind by altitude */}
          <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_18%)] rounded-xl p-4">
            <div className="text-sm font-black text-white mb-3">💨 Vento per Quota</div>
            <div className="flex flex-col gap-2.5">
              {[
                { label: "Decollo", speed: row.wind },
                { label: "+500m", speed: windDir80 },
                { label: "+1000m", speed: windDir120 },
                { label: "+2000m", speed: Math.round(row.wind * 1.5) },
              ].map((alt) => (
                <div key={alt.label} className="flex items-center gap-3">
                  <span className="text-sm text-[hsl(215_14%_45%)] w-20 shrink-0 font-mono">{alt.label}</span>
                  <div className="flex-1 h-2.5 bg-[hsl(220_16%_16%)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (alt.speed / 60) * 100)}%`, background: windCol(alt.speed) }} />
                  </div>
                  <span className="text-sm font-black w-14 text-right" style={{ color: windCol(alt.speed) }}>{alt.speed} km/h</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flight window */}
          {isWindow && (
            <div className="flex items-center gap-3 px-4 py-4 bg-[hsl(142_76%_45%/0.08)] border border-[hsl(142_76%_45%/0.3)] rounded-xl">
              <span className="text-3xl">🪂</span>
              <div>
                <div className="text-base font-black text-[hsl(142_76%_65%)]">Finestra di Volo Ottimale</div>
                <div className="text-sm text-[hsl(215_14%_55%)] mt-0.5">10:00–16:00 · condizioni termiche al massimo</div>
              </div>
            </div>
          )}

          {/* Alerts */}
          <div className="flex flex-col gap-2">
            {row.wind > 30 && (
              <div className="px-4 py-3 bg-[hsl(43_100%_52%/0.08)] border border-[hsl(43_100%_52%/0.3)] rounded-xl text-sm text-[hsl(43_100%_65%)] font-medium">
                ⚠️ Vento forte ({row.wind} km/h) — valutare attentamente prima del decollo
              </div>
            )}
            {row.gust > 35 && (
              <div className="px-4 py-3 bg-[hsl(0_90%_55%/0.08)] border border-[hsl(0_90%_55%/0.3)] rounded-xl text-sm text-[hsl(0_90%_65%)] font-medium">
                🌪️ Raffiche pericolose ({row.gust} km/h) — non decollare
              </div>
            )}
            {h && h.capeIndex > 500 && (
              <div className="px-4 py-3 bg-[hsl(0_90%_55%/0.08)] border border-[hsl(0_90%_55%/0.3)] rounded-xl text-sm text-[hsl(0_90%_65%)] font-medium">
                ⛈️ CAPE elevato ({h.capeIndex} J/kg) — rischio sviluppi temporaleschi
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function DailyForecast({ daily, hourly, onDaySelect }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedRow, setSelectedRow] = useState<HourRow | null>(null);

  const selected = daily[selectedIdx];

  // Build hour rows: real data for today, estimated for future days
  const hourRows: HourRow[] = (() => {
    if (hourly && hourly.length > 0) {
      const real = buildRealHourly(selected.date, hourly);
      if (real.length >= 5) return real;
    }
    return buildEstimatedHourly(selected);
  })();

  function handleDayClick(i: number) {
    setSelectedIdx(i);
    if (onDaySelect) onDaySelect(i);
  }

  return (
    <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl overflow-hidden">
      {selectedRow && (
        <HourDetailModal row={selectedRow} dayName={selected.dayName} onClose={() => setSelectedRow(null)} />
      )}

      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-[hsl(220_16%_18%)]">
        <div className="font-black text-white text-lg">📅 Previsioni 7 Giorni</div>
        <div className="text-sm text-[hsl(215_14%_50%)] mt-0.5">Seleziona un giorno · clicca sull'ora per i dettagli completi</div>
      </div>

      {/* Day strip */}
      <div className="px-3 py-3 border-b border-[hsl(220_16%_18%)]">
        <div className="grid grid-cols-7 gap-1.5">
          {daily.map((d, i) => {
            const vol = getVolColor(d.flightLabel);
            const lbl = getVolLabel(d.flightLabel);
            const isSelected = i === selectedIdx;
            const isToday = i === 0;
            return (
              <button key={d.date} onClick={() => handleDayClick(i)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 transition-all duration-200 min-h-[44px]",
                  isSelected
                    ? cn("scale-105", vol.glow)
                    : "bg-[hsl(220_20%_9%)] border-[hsl(220_16%_18%)] hover:border-[hsl(220_16%_30%)]"
                )}
                style={isSelected ? { borderColor: vol.border, backgroundColor: vol.bg } : {}}>
                <div className="text-[11px] font-black" style={{ color: isSelected ? vol.text : "hsl(215 14% 60%)" }}>
                  {isToday ? "OGGI" : d.dayShort}
                </div>
                <div className="text-[10px] text-[hsl(215_14%_40%)]">{d.date.slice(5)}</div>
                <AnimatedWeatherIcon code={d.weatherCode} size="sm" />
                <div className="text-[11px] font-bold text-white leading-tight">
                  {d.maxTemp}°<span className="text-[hsl(215_14%_40%)] font-normal">/{d.minTemp}°</span>
                </div>
                <div className="text-sm font-bold" style={{ color: vol.text }}>{lbl.emoji}</div>
                <div className="text-[9px] text-[hsl(215_14%_40%)]">XC {d.xcScoreDay}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day info + hourly table */}
      {selected && (
        <div className="p-4 sm:p-5 flex flex-col gap-4">

          {/* Day summary bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-black text-white text-2xl">{selected.dayName}</div>
              <div className="text-sm text-[hsl(215_14%_50%)] mt-0.5">
                {selected.date} · 🌡️ {selected.maxTemp}°/{selected.minTemp}° · 💨 max {selected.maxWind} km/h
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-xs text-[hsl(215_14%_50%)]">Pioggia</div>
                <div className="text-lg font-black" style={{ color: precipCol(selected.precipProb) }}>{selected.precipProb}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[hsl(215_14%_50%)]">XC</div>
                <div className="text-lg font-black" style={{ color: xcColor(selected.xcScoreDay) }}>{selected.xcScoreDay}/10</div>
              </div>
              <div className="px-3 py-2 rounded-xl text-sm font-black"
                style={{
                  color: getVolColor(selected.flightLabel).text,
                  background: getVolColor(selected.flightLabel).bg,
                  border: `1.5px solid ${getVolColor(selected.flightLabel).border}`
                }}>
                {getVolLabel(selected.flightLabel).emoji} {getVolLabel(selected.flightLabel).text}
              </div>
            </div>
          </div>

          {/* Score cards row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "🏆", title: "XC", score: selected.xcScoreDay, quality: selected.xcQuality, color: xcColor(selected.xcScoreDay) },
              { icon: "🛬", title: "Arrivo", score: selected.arrivalScore, quality: selected.arrivalQuality, color: xcColor(selected.arrivalScore) },
              { icon: "🌀", title: "Termiche", score: selected.thermalScore, quality: selected.thermalQuality, color: thermalColorFn(selected.thermalScore) },
            ].map((card) => (
              <div key={card.title} className="bg-[hsl(220_20%_9%)] border border-[hsl(220_16%_18%)] rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <div className="text-xs font-bold text-white">{card.icon} {card.title}</div>
                    <div className="text-[10px] font-bold mt-0.5" style={{ color: card.color }}>{card.quality}</div>
                  </div>
                  <div className="text-2xl font-black" style={{ color: card.color }}>{card.score}</div>
                </div>
                <ScoreBar score={card.score} color={card.color} />
              </div>
            ))}
          </div>

          {/* ── HOURLY TABLE 09–19 ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-black text-white text-base">🕐 Previsioni Ora per Ora</div>
                <div className="text-sm text-[hsl(215_14%_50%)]">
                  09:00–19:00 · {hourRows[0]?.isReal ? "✓ Dati reali Open-Meteo" : "⚠️ Dati stimati"} · Clicca per i dettagli
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[hsl(215_14%_45%)]">
                <div className="w-2 h-2 rounded-full bg-[hsl(142_76%_55%)]" />
                <span>finestra 10–16h</span>
              </div>
            </div>

            <div className="rounded-xl border border-[hsl(220_16%_18%)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[hsl(220_20%_8%)] border-b-2 border-[hsl(220_16%_22%)]">
                    <th className="px-3 py-3 text-left text-sm font-black text-[hsl(215_14%_60%)] whitespace-nowrap">Ora</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-[hsl(215_14%_60%)]">Meteo</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-[hsl(215_14%_60%)] whitespace-nowrap">🌡° C</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-[hsl(215_14%_60%)] whitespace-nowrap">💨 km/h</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-[hsl(215_14%_60%)] whitespace-nowrap">💥 Raff.</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-[hsl(215_14%_60%)] whitespace-nowrap">🌀 m/s</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-[hsl(215_14%_60%)] whitespace-nowrap">☁️ Base</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-[hsl(215_14%_60%)] whitespace-nowrap">🌧️%</th>
                    <th className="px-3 py-3 text-center text-sm font-black text-[hsl(215_14%_60%)] whitespace-nowrap">Vol.</th>
                  </tr>
                </thead>
                <tbody>
                  {hourRows.map((row, idx) => {
                    const vc = volCol(row.volability);
                    const wc = windCol(row.wind);
                    const tc = thermalCol(row.thermalMs);
                    const isWindow = row.hour >= 10 && row.hour <= 16;
                    const currentHour = new Date().getHours();
                    const isCurrent = row.realHourly && row.hour === currentHour;

                    return (
                      <tr
                        key={row.hour}
                        onClick={() => setSelectedRow(row)}
                        className={cn(
                          "border-b border-[hsl(220_16%_14%)] cursor-pointer transition-all group",
                          isCurrent ? "bg-[hsl(205_90%_45%/0.1)] border-l-2 border-l-[hsl(205_90%_55%/0.7)]" :
                          isWindow ? "bg-[hsl(142_76%_45%/0.05)]" : "bg-transparent",
                          "hover:bg-[hsl(220_18%_15%)]"
                        )}>

                        {/* Ora */}
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            {isCurrent && <div className="w-2 h-2 rounded-full bg-[hsl(205_90%_55%)] live-dot shrink-0" />}
                            <span className="font-black text-white text-base font-mono">
                              {row.hour.toString().padStart(2, "0")}:00
                            </span>
                            {isWindow && <span className="text-xs text-[hsl(142_76%_55%)]">🪂</span>}
                          </div>
                        </td>

                        {/* Meteo icon */}
                        <td className="px-2 py-3.5 text-center">
                          <AnimatedWeatherIcon code={row.weatherCode} hour={row.hour} size="sm" />
                        </td>

                        {/* Temperatura */}
                        <td className="px-2 py-3.5 text-center">
                          <span className="font-black text-base text-[hsl(200_80%_78%)]">{row.temp}°</span>
                        </td>

                        {/* Vento */}
                        <td className="px-2 py-3.5 text-center">
                          <span className="font-black text-base" style={{ color: wc }}>{row.wind}</span>
                        </td>

                        {/* Raffiche */}
                        <td className="px-2 py-3.5 text-center">
                          <span className="font-semibold text-sm text-[hsl(215_14%_60%)]">{row.gust}</span>
                        </td>

                        {/* Termiche */}
                        <td className="px-2 py-3.5 text-center">
                          <span className="font-black text-sm" style={{ color: tc }}>
                            {row.thermalMs > 0 ? row.thermalMs.toFixed(1) : "—"}
                          </span>
                        </td>

                        {/* Base cumuli */}
                        <td className="px-2 py-3.5 text-center">
                          <span className="text-sm font-semibold text-[hsl(205_80%_65%)]">
                            {row.cloudbase.toLocaleString()}m
                          </span>
                        </td>

                        {/* Precipitazioni */}
                        <td className="px-2 py-3.5 text-center">
                          <span className="font-bold text-sm" style={{ color: precipCol(row.precipProb) }}>
                            {row.precipProb}%
                          </span>
                        </td>

                        {/* Volabilità */}
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="font-black text-lg leading-none" style={{ color: vc }}>
                              {row.volability.toFixed(1)}
                            </span>
                            <div className="w-12 h-1.5 bg-[hsl(220_16%_18%)] rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${(row.volability / 10) * 100}%`, background: vc }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-2.5 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-[hsl(215_14%_45%)]">
                {[
                  { c: "hsl(142 76% 65%)", l: "≥7 VOLA" },
                  { c: "hsl(43 100% 65%)", l: "4–7 VALUTA" },
                  { c: "hsl(0 90% 65%)", l: "<4 STOP" },
                ].map((x) => (
                  <div key={x.l} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: x.c }} />
                    <span>{x.l}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 ml-auto text-xs text-[hsl(215_14%_45%)]">
                <div className="w-2 h-2 rounded-full bg-[hsl(142_76%_55%)]" />
                <span>🪂 finestra ottimale 10–16h</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
