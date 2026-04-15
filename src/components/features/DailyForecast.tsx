import { useState } from "react";
import { DayForecast, HourlyForecast } from "@/types/weather";
import { cn } from "@/lib/utils";
import AnimatedWeatherIcon from "@/components/features/AnimatedWeatherIcon";

interface Props {
  daily: DayForecast[];
  hourly?: HourlyForecast[];
  onDaySelect?: (dayIndex: number) => void;
}

const volColor = (l: string) => l === "GO" ? "#16a34a" : l === "CAUTION" ? "#d97706" : "#dc2626";
const volBg = (l: string) => l === "GO" ? "#f0fdf4" : l === "CAUTION" ? "#fffbeb" : "#fef2f2";
const volBorder = (l: string) => l === "GO" ? "#bbf7d0" : l === "CAUTION" ? "#fde68a" : "#fecaca";
const volLabel = (l: string) => l === "GO" ? "🪂 VOLA" : l === "CAUTION" ? "⚠️ VALUTA" : "🚫 STOP";
const volLabelFull = (l: string) => l === "GO" ? "🪂 VOLA" : l === "CAUTION" ? "⚠️ VALUTA" : "🚫 NON VOLARE";

const vc = (v: number) => v >= 7 ? "#16a34a" : v >= 4 ? "#d97706" : "#dc2626";
const wc = (w: number) => w > 30 ? "#dc2626" : w > 20 ? "#d97706" : w > 12 ? "#d97706" : "#16a34a";
const tc = (t: number) => t >= 3 ? "#ea580c" : t >= 2 ? "#d97706" : t >= 1 ? "#16a34a" : t >= 0.5 ? "#65a30d" : "#9ca3af";
const pc = (p: number) => p > 60 ? "#dc2626" : p > 30 ? "#d97706" : "#9ca3af";
const cc = (c: number) => c > 600 ? "#dc2626" : c > 300 ? "#d97706" : c > 50 ? "#65a30d" : "#9ca3af";

function thermalDesc(t: number) {
  return t >= 3 ? "Forti 🚀" : t >= 2 ? "Ottime" : t >= 1 ? "Buone" : t >= 0.5 ? "Deboli" : "Assenti";
}
function capeDesc(c: number) {
  return c > 600 ? "⚠️ CuNb rischio" : c > 300 ? "Attivo" : c > 50 ? "Moderato" : "Stabile";
}

interface HourRow {
  hour: number;
  temp: number;
  wind: number;
  gust: number;
  cloudbase: number;
  thermalMs: number;
  volability: number;
  precipProb: number;
  weatherCode: number;
  cape: number;
  xcScore: number;
  isReal: boolean;
  realData?: HourlyForecast;
}

// Stima oraria per giorni futuri (senza dati reali API)
function buildEstimatedHours(d: DayForecast): HourRow[] {
  const rows: HourRow[] = [];
  for (let h = 10; h <= 16; h++) {
    const tempFactor = Math.sin(((h - 6) / 15) * Math.PI);
    const temp = Math.round(d.minTemp + (d.maxTemp - d.minTemp) * tempFactor);
    const windFactor = 0.7 + 0.3 * Math.sin(((h - 9) / 8) * Math.PI);
    const wind = Math.round(d.maxWind * windFactor * 0.85);
    const gust = Math.round(wind * 1.3);
    const thermalFactor = Math.sin(((h - 9) / 8) * Math.PI);
    const cape = Math.round(d.maxCape * thermalFactor);
    const thermalMs = cape > 500 ? 3 + Math.min(2, (cape - 500) / 500)
      : cape >= 100 ? 1 + ((cape - 100) / 400) * 2
      : cape >= 50 ? 0.5 + ((cape - 50) / 50) * 0.5
      : cape >= 10 ? 0.1 + (cape / 50) * 0.4 : 0;
    const spread = Math.max(1, (d.maxTemp - d.minTemp) * 0.3 + 3);
    const cloudbase = Math.round(d.maxBlh * thermalFactor * 0.85) + 800;
    const windScore = Math.max(0, Math.min(10, (30 - wind) / 3));
    const thermalScore = Math.max(0, Math.min(10, Math.round(thermalMs * 10) / 10 * 2));
    const volability = Math.min(10, Math.max(0, Math.round((windScore * 0.4 + thermalScore * 0.6) * 10) / 10));
    const xcScore = Math.round(windScore * 0.4 + thermalScore * 0.6);
    rows.push({
      hour: h, temp, wind, gust, cloudbase,
      thermalMs: Math.round(thermalMs * 10) / 10,
      volability, precipProb: d.precipProb, weatherCode: d.weatherCode, cape,
      xcScore, isReal: false,
    });
  }
  return rows;
}

// Usa dati reali API orari per il giorno selezionato
function buildRealHours(date: string, hourly: HourlyForecast[]): HourRow[] {
  return hourly
    .filter((h) => h.time?.startsWith(date) && h.hour >= 10 && h.hour <= 16)
    .map((h) => ({
      hour: h.hour,
      temp: h.temp,
      wind: h.windSpeed,
      gust: h.windGust,
      cloudbase: (h as any).cloudbaseM ?? 1200,
      thermalMs: (h as any).thermalMs ?? 0,
      volability: h.volability,
      precipProb: h.precipProb,
      weatherCode: h.weatherCode,
      cape: h.capeIndex,
      xcScore: h.xcScore,
      isReal: true,
      realData: h,
    }));
}

// ── Hour Detail Modal ─────────────────────────────────────────────────
function HourModal({ row, dayName, siteAlt, onClose }: {
  row: HourRow; dayName: string; siteAlt?: number; onClose: () => void;
}) {
  const volC = vc(row.volability);
  const label = row.volability >= 7 ? "GO" : row.volability >= 4 ? "CAUTION" : "STOP";
  const h = row.realData;

  const dangerIdx = Math.min(10, Math.max(1, Math.round(
    (row.wind > 30 ? 3 : row.wind > 20 ? 1.5 : 0) +
    (row.gust > 40 ? 2 : row.gust > 30 ? 1 : 0) +
    (row.thermalMs > 4 ? 1.5 : 0) +
    (row.precipProb > 60 ? 2 : row.precipProb > 30 ? 1 : 0)
  )));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto card-shadow-lg border border-gray-200 fade-up"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white px-5 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ background: volBg(label), border: `1px solid ${volBorder(label)}` }}>
              <AnimatedWeatherIcon code={row.weatherCode} hour={row.hour} size="lg" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-gray-900 text-2xl">{row.hour.toString().padStart(2, "0")}:00</span>
                <span className="text-sm text-gray-400">{dayName}</span>
                {row.hour >= 10 && row.hour <= 16 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold">
                    🪂 Finestra ottimale
                  </span>
                )}
              </div>
              <div className="font-black text-lg mt-0.5" style={{ color: volC }}>{volLabelFull(label)}</div>
              <div className="text-[10px] mt-0.5" style={{ color: row.isReal ? "#16a34a" : "#d97706" }}>
                {row.isReal ? "✓ Dati reali Open-Meteo" : "⚠️ Dati stimati (giorni futuri)"}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-xl transition-colors shrink-0">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Big scores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border-2 p-4 text-center" style={{ borderColor: volBorder(label), background: volBg(label) }}>
              <div className="text-xs font-bold text-gray-500">Volabilità</div>
              <div className="text-6xl font-black my-1" style={{ color: volC }}>{row.volability.toFixed(1)}</div>
              <div className="text-xs text-gray-400">/10</div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(row.volability / 10) * 100}%`, background: volC }} />
              </div>
            </div>
            <div className="rounded-2xl border-2 p-4 text-center"
              style={{
                borderColor: dangerIdx >= 6 ? "#fecaca" : dangerIdx >= 4 ? "#fde68a" : "#bbf7d0",
                background: dangerIdx >= 6 ? "#fef2f2" : dangerIdx >= 4 ? "#fffbeb" : "#f0fdf4"
              }}>
              <div className="text-xs font-bold text-gray-500">Non-Volo</div>
              <div className="text-6xl font-black my-1"
                style={{ color: dangerIdx >= 6 ? "#dc2626" : dangerIdx >= 4 ? "#d97706" : "#16a34a" }}>{dangerIdx}</div>
              <div className="text-xs text-gray-400">/10</div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{ width: `${dangerIdx * 10}%`, background: dangerIdx >= 6 ? "#dc2626" : dangerIdx >= 4 ? "#d97706" : "#16a34a" }} />
              </div>
            </div>
          </div>

          {/* Conditions grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "🌡️", label: "Temperatura", value: `${row.temp}°C`, alert: false },
              { icon: "💨", label: "Vento", value: `${row.wind} km/h`, color: wc(row.wind), alert: row.wind > 25 },
              { icon: "💥", label: "Raffiche", value: `${row.gust} km/h`, alert: row.gust > 35 },
              { icon: "🌧️", label: "Precipitazioni", value: `${row.precipProb}%`, color: pc(row.precipProb), alert: row.precipProb > 50 },
              { icon: "🌀", label: "Termiche", value: row.thermalMs > 0 ? `${row.thermalMs.toFixed(1)} m/s` : "Assenti", color: tc(row.thermalMs), sub: thermalDesc(row.thermalMs) },
              { icon: "⚡", label: "CAPE", value: `${row.cape} J/kg`, color: cc(row.cape), sub: capeDesc(row.cape), alert: row.cape > 500 },
              { icon: "☁️", label: "Base Cumuli", value: `${row.cloudbase.toLocaleString()}m`, color: "#3b82f6" },
              { icon: "🏆", label: "XC Score", value: `${row.xcScore}/10`, color: row.xcScore >= 7 ? "#16a34a" : row.xcScore >= 5 ? "#d97706" : "#dc2626" },
              { icon: "💧", label: "Copertura Nuvole", value: h ? `${h.cloudCover}%` : "N/D" },
              { icon: "👁️", label: "Visibilità", value: h ? `${h.visibility} km` : "N/D" },
              { icon: "🌡️", label: "Turbolenza", value: h ? `${h.turbScore}/10` : "N/D", alert: h ? h.turbScore > 6 : false },
              { icon: "🚀", label: "Tetto Termiche", value: h ? `${((h as any).ceilingM ?? (h.blh + 0)).toLocaleString()}m` : "N/D", color: "#f59e0b" },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-xl p-3 border",
                (item as any).alert ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"
              )}>
                <div className="text-lg">{item.icon}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{item.label}</div>
                <div className="font-black text-base mt-0.5" style={{ color: (item as any).color ?? "#111827" }}>{item.value}</div>
                {(item as any).sub && <div className="text-[10px] text-gray-400 mt-0.5">{(item as any).sub}</div>}
              </div>
            ))}
          </div>

          {/* Wind by altitude */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <div className="text-sm font-bold text-gray-700 mb-3">💨 Vento per Quota</div>
            {[
              { alt: "Decollo (10m)", speed: row.wind },
              { alt: "+500m", speed: h ? ((h as any).windSpeed80m ?? Math.round(row.wind * 1.2)) : Math.round(row.wind * 1.2) },
              { alt: "+1000m", speed: h ? ((h as any).windSpeed120m ?? Math.round(row.wind * 1.35)) : Math.round(row.wind * 1.35) },
              { alt: "+2000m", speed: Math.round(row.wind * 1.5) },
            ].map((alt) => (
              <div key={alt.alt} className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-gray-400 font-mono w-24 shrink-0">{alt.alt}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (alt.speed / 60) * 100)}%`, background: wc(alt.speed) }} />
                </div>
                <span className="text-xs font-bold w-14 text-right" style={{ color: wc(alt.speed) }}>{alt.speed} km/h</span>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {row.wind > 30 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium">
              ⚠️ Vento forte ({row.wind} km/h) — valutare attentamente prima del decollo
            </div>
          )}
          {row.gust > 35 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
              🌪️ Raffiche pericolose ({row.gust} km/h) — non decollare
            </div>
          )}
          {row.cape > 500 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
              ⛈️ CAPE elevato ({row.cape} J/kg) — rischio sviluppi temporaleschi
            </div>
          )}
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
  const siteAlt = 0; // altitudine non disponibile qui, usiamo relative

  const hourRows: HourRow[] = (() => {
    if (hourly && hourly.length > 0) {
      const real = buildRealHours(selected.date, hourly);
      if (real.length >= 4) return real;
    }
    return buildEstimatedHours(selected);
  })();

  function handleDayClick(i: number) {
    setSelectedIdx(i);
    if (onDaySelect) onDaySelect(i);
  }

  const selColor = volColor(selected.flightLabel);

  return (
    <div className="bg-white rounded-2xl card-shadow-lg border border-gray-200 overflow-hidden">
      {selectedRow && (
        <HourModal row={selectedRow} dayName={selected.dayName} onClose={() => setSelectedRow(null)} />
      )}

      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-gray-100">
        <h3 className="font-black text-gray-900 text-lg">📅 Previsioni 7 Giorni</h3>
        <p className="text-sm text-gray-500 mt-0.5">Seleziona un giorno · Clicca sull'ora per i dettagli completi con dati reali API</p>
      </div>

      {/* Day strip */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="grid grid-cols-7 gap-1.5">
          {daily.map((d, i) => {
            const isSelected = i === selectedIdx;
            const isToday = i === 0;
            const dc = volColor(d.flightLabel);
            return (
              <button key={d.date} onClick={() => handleDayClick(i)}
                className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 transition-all duration-200 min-h-[44px] hover:shadow-md"
                style={isSelected
                  ? { borderColor: dc, background: volBg(d.flightLabel) }
                  : { borderColor: "#e5e7eb", background: isToday ? "#f9fafb" : "white" }
                }>
                <div className="text-[11px] font-black" style={{ color: isSelected ? dc : "#6b7280" }}>
                  {isToday ? "OGGI" : d.dayShort}
                </div>
                <div className="text-[9px] text-gray-400">{d.date.slice(5)}</div>
                <AnimatedWeatherIcon code={d.weatherCode} size="sm" />
                <div className="text-[11px] font-bold text-gray-800">
                  {d.maxTemp}°<span className="text-gray-400 font-normal">/{d.minTemp}°</span>
                </div>
                <div className="text-xs" style={{ color: dc }}>{volLabel(d.flightLabel)}</div>
                <div className="text-[9px] text-gray-400">XC {d.xcScoreDay}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day */}
      {selected && (
        <div className="p-4 sm:p-5 space-y-4">

          {/* Day summary */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h4 className="font-black text-gray-900 text-xl">{selected.dayName}</h4>
              <div className="text-sm text-gray-500 mt-0.5">
                {selected.date} · 🌡️ {selected.maxTemp}°/{selected.minTemp}° · 💨 max {selected.maxWind} km/h
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-xs text-gray-400">Pioggia</div>
                <div className="text-xl font-black" style={{ color: pc(selected.precipProb) }}>{selected.precipProb}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">XC</div>
                <div className="text-xl font-black" style={{ color: selColor }}>{selected.xcScoreDay}/10</div>
              </div>
              <div className="px-4 py-2.5 rounded-xl text-sm font-black border-2"
                style={{ color: selColor, background: volBg(selected.flightLabel), borderColor: volBorder(selected.flightLabel) }}>
                {volLabelFull(selected.flightLabel)}
              </div>
            </div>
          </div>

          {/* Score cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "🏆", title: "XC Score", score: selected.xcScoreDay, quality: selected.xcQuality },
              { icon: "🛬", title: "Atterraggio", score: selected.arrivalScore, quality: selected.arrivalQuality },
              { icon: "🌀", title: "Termiche", score: selected.thermalScore, quality: selected.thermalQuality },
            ].map((card) => {
              const cardColor = card.score >= 7 ? "#16a34a" : card.score >= 5 ? "#d97706" : "#dc2626";
              return (
                <div key={card.title} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs font-bold text-gray-700">{card.icon} {card.title}</div>
                      <div className="text-[10px] font-bold mt-0.5" style={{ color: cardColor }}>{card.quality}</div>
                    </div>
                    <div className="text-2xl font-black" style={{ color: cardColor }}>{card.score}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="flex-1 h-1.5 rounded-sm"
                        style={{ background: i < card.score ? cardColor : "#e5e7eb" }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── HOURLY TABLE 10–16h ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h5 className="font-black text-gray-900 text-base">🕐 Previsioni Orarie – Finestra di Volo</h5>
                <p className="text-sm text-gray-500">10:00 – 16:00 · {hourRows[0]?.isReal ? "✓ Dati reali Open-Meteo" : "⚠️ Stima da dati giornalieri"} · Clicca per il dettaglio</p>
              </div>
            </div>

            <div className="rounded-xl border-2 border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-3 py-3 text-left text-sm font-black text-gray-600 whitespace-nowrap">Ora</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-gray-600">Meteo</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-gray-600 whitespace-nowrap">🌡° C</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-gray-600 whitespace-nowrap">💨 km/h</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-gray-600 whitespace-nowrap">💥 Raff.</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-gray-600 whitespace-nowrap">⚡ CAPE</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-gray-600 whitespace-nowrap">🌀 m/s</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-gray-600 whitespace-nowrap">☁️ Base</th>
                    <th className="px-2 py-3 text-center text-sm font-black text-gray-600 whitespace-nowrap">🌧️%</th>
                    <th className="px-3 py-3 text-center text-sm font-black text-gray-600">Vol.</th>
                  </tr>
                </thead>
                <tbody>
                  {hourRows.map((row, idx) => {
                    const rowVc = vc(row.volability);
                    const rowWc = wc(row.wind);
                    const rowTc = tc(row.thermalMs);
                    const currentHour = new Date().getHours();
                    const isCurrent = row.realData && row.hour === currentHour;
                    return (
                      <tr key={row.hour}
                        onClick={() => setSelectedRow(row)}
                        className={cn(
                          "border-b border-gray-100 cursor-pointer transition-all group",
                          isCurrent ? "bg-blue-50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50/50",
                          "hover:bg-emerald-50"
                        )}>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            {isCurrent && <div className="w-2 h-2 rounded-full bg-blue-500 live-dot shrink-0" />}
                            <span className="font-black text-gray-900 text-base font-mono">
                              {row.hour.toString().padStart(2, "0")}:00
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-3.5 text-center">
                          <AnimatedWeatherIcon code={row.weatherCode} hour={row.hour} size="sm" />
                        </td>
                        <td className="px-2 py-3.5 text-center">
                          <span className="font-black text-base text-blue-600">{row.temp}°</span>
                        </td>
                        <td className="px-2 py-3.5 text-center">
                          <span className="font-black text-base" style={{ color: rowWc }}>{row.wind}</span>
                        </td>
                        <td className="px-2 py-3.5 text-center">
                          <span className="font-semibold text-sm text-gray-500">{row.gust}</span>
                        </td>
                        <td className="px-2 py-3.5 text-center">
                          <span className="font-bold text-sm" style={{ color: cc(row.cape) }}>
                            {row.cape > 0 ? row.cape : "—"}
                          </span>
                        </td>
                        <td className="px-2 py-3.5 text-center">
                          <span className="font-black text-sm" style={{ color: rowTc }}>
                            {row.thermalMs > 0 ? row.thermalMs.toFixed(1) : "—"}
                          </span>
                        </td>
                        <td className="px-2 py-3.5 text-center">
                          <span className="text-sm font-semibold text-blue-500">
                            {row.cloudbase > 0 ? `${row.cloudbase.toLocaleString()}m` : "—"}
                          </span>
                        </td>
                        <td className="px-2 py-3.5 text-center">
                          <span className="font-bold text-sm" style={{ color: pc(row.precipProb) }}>{row.precipProb}%</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-black text-lg leading-none" style={{ color: rowVc }}>
                              {row.volability.toFixed(1)}
                            </span>
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${(row.volability / 10) * 100}%`, background: rowVc }} />
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
            <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-gray-500">
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>≥7 VOLA</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span>4–7 VALUTA</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span>&lt;4 STOP</span></div>
              <span className="ml-auto text-[10px]">{hourRows[0]?.isReal ? "✓ Fonte: Open-Meteo API — dati orari reali" : "⚠️ Stima da dati giornalieri — i giorni futuri non hanno dati orari API"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
