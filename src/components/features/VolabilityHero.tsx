import { useState } from "react";
import { WeatherData } from "@/types/weather";
import { cn, windDirLabel, windDirArrow } from "@/lib/utils";
import AnimatedWeatherIcon from "@/components/features/AnimatedWeatherIcon";

interface Props {
  data: WeatherData;
}

const volBg = (label: string) =>
  label === "GO" ? "bg-emerald-50 border-emerald-200" :
  label === "CAUTION" ? "bg-amber-50 border-amber-200" :
  "bg-red-50 border-red-200";

const volTextColor = (label: string) =>
  label === "GO" ? "#16a34a" :
  label === "CAUTION" ? "#d97706" :
  "#dc2626";

const volLightBg = (label: string) =>
  label === "GO" ? "#f0fdf4" :
  label === "CAUTION" ? "#fffbeb" :
  "#fef2f2";

const valLabel = (label: string) =>
  label === "GO" ? "🪂 VOLA ORA" :
  label === "CAUTION" ? "⚠️ VALUTA" :
  "🚫 NON VOLARE";

const valDesc = (label: string) =>
  label === "GO" ? "Condizioni eccellenti per il decollo" :
  label === "CAUTION" ? "Condizioni variabili — monitorare il meteo" :
  "Condizioni avverse — resta a terra";

const tcol = (t: number) => t >= 3 ? "#ea580c" : t >= 2 ? "#d97706" : t >= 1 ? "#16a34a" : t >= 0.5 ? "#65a30d" : "#9ca3af";
const wcol = (w: number) => w > 30 ? "#dc2626" : w > 20 ? "#d97706" : w > 12 ? "#d97706" : "#16a34a";
const pcol = (p: number) => p > 60 ? "#dc2626" : p > 30 ? "#d97706" : "#16a34a";
const capecol = (c: number) => c > 600 ? "#dc2626" : c > 300 ? "#d97706" : c > 50 ? "#65a30d" : "#9ca3af";

const thermalDesc = (t: number) =>
  t >= 3 ? "Forti 🚀" : t >= 2 ? "Ottime" : t >= 1 ? "Buone" : t >= 0.5 ? "Deboli" : "Assenti";

const capeDesc = (c: number) =>
  c > 600 ? "⚠️ Pericoloso — CuNb" : c > 300 ? "Attivo — sviluppi possibili" : c > 50 ? "Moderato — buone termiche" : "Stabile — termiche assenti";

function ScoreGauge({ value, max = 10, color, size = 90 }: { value: number; max?: number; color: string; size?: number }) {
  const pct = value / max;
  const r = (size / 2) * 0.72;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(1, pct);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-black text-base leading-none" style={{ color }}>{value.toFixed(1)}</div>
        <div className="text-[9px] text-gray-400">/{max}</div>
      </div>
    </div>
  );
}

function MetricRow({ icon, label, value, color, sub }: { icon: string; label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-right">
        <div className="font-bold text-sm" style={{ color: color ?? "#111827" }}>{value}</div>
        {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
      </div>
    </div>
  );
}

function BreakdownBar({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  const pct = Math.min(100, (val / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-500 w-32 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold w-6 text-right" style={{ color }}>{val}</span>
    </div>
  );
}

export default function VolabilityHero({ data }: Props) {
  const [activePanel, setActivePanel] = useState<"breakdown" | "danger" | "thermal">("breakdown");

  const vol = data.volability;
  const label = vol.label;
  const mainColor = volTextColor(label);
  const wDir = windDirLabel(data.currentWindDir);
  const wArrow = windDirArrow(data.currentWindDir);
  const thermalMs = data.currentThermalMs;
  const cloudbaseAbove = data.currentCloudbaseM - data.site.altitude;
  const thermalVertDev = Math.round(data.currentBlh * 0.85);
  const hourNow = new Date().getHours();

  // Danger index
  let dangerIdx = 0;
  if (data.currentWind > 35) dangerIdx += 3.5;
  else if (data.currentWind > 25) dangerIdx += 2;
  else if (data.currentWind > 18) dangerIdx += 1;
  if (data.currentGust > 45) dangerIdx += 2.5;
  else if (data.currentGust > 35) dangerIdx += 1.5;
  if (data.currentCape > 700) dangerIdx += 2;
  else if (data.currentCape > 400) dangerIdx += 1;
  if (data.turbulenceScore > 7) dangerIdx += 1.5;
  else if (data.turbulenceScore > 5) dangerIdx += 0.5;
  dangerIdx = Math.min(10, Math.max(1, Math.round(dangerIdx)));

  const dangerColor = dangerIdx >= 7 ? "#dc2626" : dangerIdx >= 4 ? "#d97706" : "#16a34a";

  const nowLabel = new Date().toLocaleString("it-IT", {
    weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="bg-white rounded-2xl card-shadow-lg border border-gray-200 overflow-hidden">
      {/* Top color bar */}
      <div className="h-1.5 w-full" style={{ background: mainColor }} />

      <div className="p-4 sm:p-5">

        {/* Site header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-2xl shrink-0">
              {data.site.icon}
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-lg leading-tight">{data.site.name}</h2>
              <div className="text-xs text-gray-500 mt-0.5">
                ⛰️ {data.site.altitude}m slm · 🧭 {data.site.orientation} · {data.site.zone}
              </div>
              <div className="text-[10px] text-gray-400">
                Max vento: {data.site.maxWindKmh} km/h
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right hidden sm:block">
            <div className="text-[10px] text-gray-400">{nowLabel}</div>
            <div className="flex items-center gap-1 justify-end mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
              <span className="text-[10px] font-bold text-emerald-600">DATI LIVE API</span>
            </div>
          </div>
        </div>

        {/* GO/NO-GO banner */}
        <div className="rounded-2xl border-2 p-4 mb-4 flex items-center gap-4"
          style={{ borderColor: mainColor, background: volLightBg(label) }}>
          <div>
            <div className="text-[80px] font-black leading-none" style={{ color: mainColor }}>
              {vol.total.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 text-center">/10</div>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-black mb-1" style={{ color: mainColor }}>{valLabel(label)}</div>
            <div className="text-sm text-gray-600 mb-3">{valDesc(label)}</div>
            {/* Progress bar */}
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="flex-[4] bg-red-100" />
                <div className="flex-[3] bg-amber-100" />
                <div className="flex-[3] bg-emerald-100" />
              </div>
              <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
                style={{ width: `${(vol.total / 10) * 100}%`, background: mainColor }} />
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 mt-1">
              <span>0 — STOP</span><span>4 — CAUTION</span><span>7 — GO</span>
            </div>
          </div>
          {/* Weather icon */}
          <div className="shrink-0 text-5xl">
            <AnimatedWeatherIcon code={data.hourly[hourNow]?.weatherCode ?? 0} hour={hourNow} size="xl" />
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* LEFT: key metrics (2 cols) */}
          <div className="lg:col-span-2 space-y-3">

            {/* Radial gauges */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Indici Chiave</div>
              <div className="flex items-center justify-around gap-2">
                <div className="flex flex-col items-center gap-1">
                  <ScoreGauge value={vol.total} color={mainColor} size={80} />
                  <span className="text-[10px] text-gray-500">Volabilità</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ScoreGauge value={dangerIdx} color={dangerColor} size={80} />
                  <span className="text-[10px] text-gray-500">Non-Volo</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ScoreGauge value={thermalMs} max={6} color={tcol(thermalMs)} size={80} />
                  <span className="text-[10px] text-gray-500">Termiche m/s</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ScoreGauge value={data.xcScore} color={data.xcScore >= 7 ? "#16a34a" : data.xcScore >= 5 ? "#d97706" : "#dc2626"} size={80} />
                  <span className="text-[10px] text-gray-500">XC Score</span>
                </div>
              </div>
            </div>

            {/* Key conditions */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Condizioni Attuali</div>
              <div className="space-y-0">
                <MetricRow icon="💨" label="Vento 10m" value={`${wArrow} ${data.currentWind} km/h`} color={wcol(data.currentWind)} sub={wDir} />
                <MetricRow icon="💥" label="Raffiche" value={`${data.currentGust} km/h`} color={data.currentGust > 35 ? "#dc2626" : "#6b7280"} />
                <MetricRow icon="🌡️" label="Temperatura" value={`${data.currentTemp}°C`} sub={`Umidità rel. est.`} />
                <MetricRow icon="🌀" label="Termiche" value={`${thermalMs.toFixed(1)} m/s`} color={tcol(thermalMs)} sub={thermalDesc(thermalMs)} />
                <MetricRow icon="☁️" label="Base Cumuli" value={`${data.currentCloudbaseM.toLocaleString()}m`} color="#3b82f6" sub={`+${cloudbaseAbove.toLocaleString()}m sopra decollo`} />
                <MetricRow icon="🚀" label="Tetto Termiche" value={`${data.currentCeiling.toLocaleString()}m`} color="#f59e0b" sub={`+${thermalVertDev.toLocaleString()}m sviluppo`} />
                <MetricRow icon="⚡" label="CAPE" value={`${data.currentCape} J/kg`} color={capecol(data.currentCape)} sub={capeDesc(data.currentCape)} />
                <MetricRow icon="🌫️" label="Nuvole" value={`${data.currentCloudCover}%`} color={data.currentCloudCover > 80 ? "#6b7280" : "#111827"} />
                <MetricRow icon="👁️" label="Visibilità" value={`${data.currentVisibility} km`} color={data.currentVisibility > 10 ? "#16a34a" : "#d97706"} />
              </div>
            </div>

            {/* Wind by altitude */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">💨 Vento per Quota</div>
              <div className="space-y-2">
                {[
                  { alt: `${data.site.altitude}m (decollo)`, speed: data.currentWind },
                  { alt: `${data.site.altitude + 500}m`, speed: Math.round(data.currentWind * 1.2) },
                  { alt: `${data.site.altitude + 1000}m`, speed: Math.round(data.currentWind * 1.35) },
                  { alt: `${data.site.altitude + 2000}m`, speed: Math.round(data.currentWind * 1.5) },
                ].map((row) => (
                  <div key={row.alt} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-mono w-32 shrink-0">{row.alt}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (row.speed / 60) * 100)}%`, background: wcol(row.speed) }} />
                    </div>
                    <span className="text-xs font-bold w-14 text-right" style={{ color: wcol(row.speed) }}>{row.speed} km/h</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">Limite sito: {data.site.maxWindKmh} km/h</span>
                <span className="font-bold" style={{ color: data.currentWind > data.site.maxWindKmh ? "#dc2626" : "#16a34a" }}>
                  {data.currentWind > data.site.maxWindKmh ? "⚠️ OLTRE LIMITE" : "✓ NEI LIMITI"}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: panels (3 cols) */}
          <div className="lg:col-span-3 space-y-3">

            {/* Panel tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[
                { id: "breakdown" as const, label: "📋 Dettaglio Volabilità" },
                { id: "danger" as const, label: "🚨 Indice Non-Volo" },
                { id: "thermal" as const, label: "🌀 Colonna Termica" },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActivePanel(tab.id)}
                  className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                    activePanel === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Breakdown */}
            {activePanel === "breakdown" && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 fade-up">
                <div className="text-sm font-bold text-gray-700 mb-3">Componenti Volabilità (totale: {vol.total}/10)</div>
                <div className="space-y-2">
                  <BreakdownBar label="🧭 Direzione Vento" val={vol.windDir} max={3} color={mainColor} />
                  <BreakdownBar label="💨 Velocità Vento" val={vol.windSpeed} max={2} color={mainColor} />
                  <BreakdownBar label="💥 Raffiche" val={vol.gusts} max={1.5} color={mainColor} />
                  <BreakdownBar label="🌀 Termiche" val={vol.thermals} max={1.5} color="#ea580c" />
                  <BreakdownBar label="☁️ Base Cumuli" val={vol.cloudbase} max={1} color="#3b82f6" />
                  <BreakdownBar label="🌤️ Stabilità Meteo" val={vol.stability} max={1} color="#8b5cf6" />
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs font-bold text-gray-500 mb-1">XC Score (formula: vento×0.4 + termica×0.6)</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(data.xcScore / 10) * 100}%`, background: data.xcScore >= 7 ? "#16a34a" : data.xcScore >= 5 ? "#d97706" : "#dc2626" }} />
                    </div>
                    <span className="font-black text-lg" style={{ color: data.xcScore >= 7 ? "#16a34a" : data.xcScore >= 5 ? "#d97706" : "#dc2626" }}>
                      {data.xcScore}/10
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Danger */}
            {activePanel === "danger" && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 fade-up">
                <div className="text-sm font-bold text-gray-700 mb-3">Indice Pericolo Non-Volo (1=sicuro, 10=pericoloso)</div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-6xl font-black" style={{ color: dangerColor }}>{dangerIdx}</div>
                    <div className="text-xs text-gray-400">/10</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg" style={{ color: dangerColor }}>
                      {dangerIdx >= 8 ? "PERICOLOSO" : dangerIdx >= 6 ? "ELEVATO" : dangerIdx >= 4 ? "MODERATO" : dangerIdx >= 2 ? "BASSO" : "SICURO"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 max-w-[180px]">
                      {dangerIdx >= 7 ? "Non decollare. Condizioni pericolose." :
                       dangerIdx >= 5 ? "Solo piloti esperti. Massima attenzione." :
                       dangerIdx >= 3 ? "Condizioni moderate. Valutare con cura." :
                       "Condizioni sicure per il volo."}
                    </div>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex-1 h-3 rounded-sm transition-all"
                      style={{ background: i < dangerIdx ? dangerColor : "#e5e7eb" }} />
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { icon: "💨", label: "Vento sup.", value: data.currentWind, unit: "km/h", max: 60, danger: data.site.maxWindKmh },
                    { icon: "💥", label: "Raffiche", value: data.currentGust, unit: "km/h", max: 70, danger: 40 },
                    { icon: "🌀", label: "Wind Shear", value: data.currentWindShear, unit: "km/h", max: 50, danger: 25 },
                    { icon: "⚡", label: "CAPE", value: data.currentCape, unit: "J/kg", max: 1000, danger: 400 },
                    { icon: "💥", label: "Turbolenza", value: data.turbulenceScore, unit: "/10", max: 10, danger: 6 },
                  ].map((b) => (
                    <div key={b.label} className="flex items-center gap-2">
                      <span className="text-sm">{b.icon}</span>
                      <span className="text-xs text-gray-500 w-24 shrink-0">{b.label}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (b.value / b.max) * 100)}%`, background: b.value >= b.danger ? "#dc2626" : "#16a34a" }} />
                      </div>
                      <span className="text-xs font-bold w-16 text-right" style={{ color: b.value >= b.danger ? "#dc2626" : "#16a34a" }}>
                        {b.value} {b.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thermal */}
            {activePanel === "thermal" && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 fade-up">
                <div className="text-sm font-bold text-gray-700 mb-3">🌀 Colonna Termica Stimata da CAPE Reale</div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "CAPE reale", value: `${data.currentCape} J/kg`, color: capecol(data.currentCape), desc: capeDesc(data.currentCape) },
                    { label: "Vel. Termica", value: `${thermalMs.toFixed(1)} m/s`, color: tcol(thermalMs), desc: thermalDesc(thermalMs) },
                    { label: "Base Cumuli", value: `${data.currentCloudbaseM.toLocaleString()}m`, color: "#3b82f6", desc: `+${cloudbaseAbove.toLocaleString()}m AGL` },
                    { label: "Tetto Termiche", value: `${data.currentCeiling.toLocaleString()}m`, color: "#f59e0b", desc: `+${thermalVertDev.toLocaleString()}m sviluppo` },
                    { label: "BLH Grezzo", value: `${data.currentBlh.toLocaleString()}m`, color: "#6b7280", desc: "Boundary Layer Height" },
                    { label: "Turbolenza", value: data.turbulence === "LOW" ? "😊 Bassa" : data.turbulence === "MOD" ? "😐 Moderata" : "😱 Severa",
                      color: data.turbulence === "LOW" ? "#16a34a" : data.turbulence === "MOD" ? "#d97706" : "#dc2626", desc: `${data.turbulenceScore}/10` },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="text-[10px] text-gray-400 font-medium">{item.label}</div>
                      <div className="font-bold text-sm mt-0.5" style={{ color: item.color }}>{item.value}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{item.desc}</div>
                    </div>
                  ))}
                </div>
                {/* Thermal speed scale */}
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-1">Scala velocità termica</div>
                  <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                    <span>0 Assenti</span><span>0.5 Deboli</span><span>1.5 Buone</span><span>3+ Forti</span><span>6 Max</span>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (thermalMs / 6) * 100)}%`, background: tcol(thermalMs) }} />
                  </div>
                  <div className="text-center mt-1 font-black text-base" style={{ color: tcol(thermalMs) }}>
                    {thermalMs.toFixed(1)} m/s — {thermalDesc(thermalMs)}
                  </div>
                </div>
                {/* CAPE interpretation */}
                <div className="mt-3 p-3 rounded-lg border" style={{ background: `${capecol(data.currentCape)}08`, borderColor: `${capecol(data.currentCape)}30` }}>
                  <div className="text-xs font-bold" style={{ color: capecol(data.currentCape) }}>
                    ⚡ CAPE {data.currentCape} J/kg: {capeDesc(data.currentCape)}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {data.currentCape > 500 ? "3–5 m/s (Forti)" : data.currentCape >= 100 ? "1–3 m/s (Moderate)" : data.currentCape >= 50 ? "0.5–1 m/s (Deboli)" : "0–0.5 m/s (Assenti)"}
                  </div>
                </div>
              </div>
            )}

            {/* Briefing text */}
            {data.xcRoute && data.xcScore >= 5 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <div className="flex-1">
                  <div className="text-xs font-bold text-amber-700">XC Route Consigliata</div>
                  <div className="text-sm font-bold text-amber-900">{data.xcRoute}</div>
                </div>
                <span className="font-black text-xl text-amber-700">{data.xcScore}/10</span>
              </div>
            )}

            {/* Briefing */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📋 Briefing di Volo</div>
              <p className="text-sm text-gray-700 leading-relaxed">{data.briefingText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
