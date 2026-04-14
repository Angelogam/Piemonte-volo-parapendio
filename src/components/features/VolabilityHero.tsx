import { useState } from "react";
import { WeatherData } from "@/types/weather";
import { cn, windDirLabel, windDirArrow } from "@/lib/utils";
import AnimatedWeatherIcon from "@/components/features/AnimatedWeatherIcon";

interface Props {
  data: WeatherData;
}

const vcol = (v: number) => v >= 7 ? "#4ade80" : v >= 4 ? "#fbbf24" : "#f87171";
const dcol = (d: number) => d <= 2 ? "#4ade80" : d <= 4 ? "#86efac" : d <= 6 ? "#fbbf24" : d <= 8 ? "#fb923c" : "#f87171";
const tcol = (t: number) => t >= 4 ? "#f97316" : t >= 2.5 ? "#fbbf24" : t >= 1.5 ? "#4ade80" : t >= 0.5 ? "#86efac" : "#6b7280";

const VOL_CFG = {
  GO: {
    gradient: "from-[#052e16]/70 via-[#14532d]/30 to-transparent",
    border: "border-[#16a34a]/50",
    glow: "shadow-[0_0_40px_hsl(142_76%_35%/0.25)]",
    numColor: "#4ade80",
    badge: "bg-[#16a34a] text-white",
    badgeBorder: "border border-[#22c55e]/50",
    bar: "#4ade80",
    label: "VOLA ORA",
    emoji: "🪂",
    desc: "Condizioni eccellenti per il decollo",
    textPrimary: "text-[#4ade80]",
  },
  CAUTION: {
    gradient: "from-[#422006]/70 via-[#78350f]/30 to-transparent",
    border: "border-[#ca8a04]/50",
    glow: "shadow-[0_0_40px_hsl(43_100%_45%/0.2)]",
    numColor: "#fbbf24",
    badge: "bg-[#ca8a04] text-black",
    badgeBorder: "border border-[#eab308]/50",
    bar: "#fbbf24",
    label: "VALUTA",
    emoji: "⚠️",
    desc: "Condizioni variabili — monitorare il meteo",
    textPrimary: "text-[#fbbf24]",
  },
  STOP: {
    gradient: "from-[#3f0d0d]/70 via-[#7f1d1d]/30 to-transparent",
    border: "border-[#dc2626]/50",
    glow: "shadow-[0_0_40px_hsl(0_90%_45%/0.2)]",
    numColor: "#f87171",
    badge: "bg-[#dc2626] text-white",
    badgeBorder: "border border-[#ef4444]/50",
    bar: "#f87171",
    label: "NON VOLARE",
    emoji: "🚫",
    desc: "Condizioni avverse — resta a terra",
    textPrimary: "text-[#f87171]",
  },
};

function calcDanger(data: WeatherData) {
  let d = 0;
  if (data.currentWind > 35) d += 3.5;
  else if (data.currentWind > 25) d += 2;
  else if (data.currentWind > 18) d += 1;
  if (data.currentGust > 45) d += 2.5;
  else if (data.currentGust > 35) d += 1.5;
  if (data.currentCape > 700) d += 2;
  else if (data.currentCape > 400) d += 1;
  if (data.turbulenceScore > 7) d += 1.5;
  else if (data.turbulenceScore > 5) d += 0.5;
  if (data.currentCloudCover > 90) d += 0.5;
  return Math.min(10, Math.max(1, Math.round(d)));
}

function RadialScore({ value, max = 10, color, label, size = 100 }: {
  value: number; max?: number; color: string; label: string; size?: number;
}) {
  const pct = value / max;
  const r = (size / 2) * 0.75;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(220 16% 18%)" strokeWidth={6} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-black text-xl leading-none" style={{ color }}>{value.toFixed(1)}</div>
          <div className="text-[9px] text-[hsl(215_14%_50%)]">/{max}</div>
        </div>
      </div>
      <div className="text-[10px] text-[hsl(215_14%_50%)] text-center">{label}</div>
    </div>
  );
}

function BreakdownBar({ label, val, max, barColor }: { label: string; val: number; max: number; barColor: string }) {
  const pct = Math.min(100, (val / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[hsl(215_14%_48%)] w-32 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-[hsl(220_16%_17%)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <span className="text-xs font-mono font-bold w-7 text-right" style={{ color: barColor }}>{val}</span>
    </div>
  );
}

function CondTile({ icon, label, value, sub, color, alert }: {
  icon: string; label: string; value: string; sub?: string; color?: string; alert?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-2.5 flex flex-col gap-0.5 transition-all hover:brightness-110",
      alert
        ? "bg-[hsl(0_90%_55%/0.08)] border-[hsl(0_90%_55%/0.35)]"
        : "bg-[hsl(220_20%_9%/0.8)] border-[hsl(220_16%_18%)]"
    )}>
      <div className="text-base leading-none">{icon}</div>
      <div className="text-[10px] text-[hsl(215_14%_45%)] mt-0.5">{label}</div>
      <div className="font-black text-sm leading-tight" style={{ color: color ?? "white" }}>{value}</div>
      {sub && <div className="text-[10px] text-[hsl(215_14%_40%)]">{sub}</div>}
    </div>
  );
}

export default function VolabilityHero({ data }: Props) {
  const [activePanel, setActivePanel] = useState<"breakdown" | "danger" | "thermal">("breakdown");

  const cfg = VOL_CFG[data.volability.label];
  const vol = data.volability;
  const dangerIdx = calcDanger(data);
  const wDir = windDirLabel(data.currentWindDir);
  const wArrow = windDirArrow(data.currentWindDir);
  const thermalMs = data.currentThermalMs;
  const cloudbaseAbove = data.currentCloudbaseM - data.site.altitude;
  const thermalVertDev = Math.round(data.currentBlh * 0.85);
  const thermalTopMsl = data.site.altitude + thermalVertDev;
  const hourNow = new Date().getHours();

  const nowLabel = new Date().toLocaleString("it-IT", {
    weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className={cn("relative rounded-2xl border overflow-hidden", cfg.border, cfg.glow)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br pointer-events-none", cfg.gradient)} />

      <div className="relative p-4 sm:p-5">

        {/* ── TOP BAR: site info + timestamp ── */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[hsl(220_20%_13%)] border border-[hsl(220_16%_22%)] flex items-center justify-center text-2xl shrink-0">
              {data.site.icon}
            </div>
            <div>
              <div className="font-black text-white text-lg leading-tight">{data.site.name}</div>
              <div className="text-xs text-[hsl(215_14%_50%)] mt-0.5">
                ⛰️ {data.site.altitude}m slm · 🧭 {data.site.orientation} · {data.site.zone}
              </div>
              <div className="text-[10px] text-[hsl(215_14%_40%)] mt-0.5">
                Max vento: {data.site.maxWindKmh} km/h · XC tipico: {data.site.xcKm} km
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right hidden sm:block">
            <div className="text-xs text-[hsl(215_14%_45%)]">{nowLabel}</div>
            <div className="flex items-center gap-1 justify-end mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[hsl(142_76%_55%)] live-dot" />
              <span className="text-[10px] font-bold text-[hsl(142_76%_55%)]">DATI LIVE</span>
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* LEFT: Big volability score (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Score + badge */}
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-[hsl(215_14%_50%)] uppercase tracking-widest font-bold mb-1">Volabilità</div>
                <div className="text-[96px] font-black leading-none" style={{ color: cfg.numColor, filter: `drop-shadow(0 0 30px ${cfg.numColor}55)` }}>
                  {vol.total.toFixed(1)}
                </div>
                <div className="text-sm text-[hsl(215_14%_45%)]">/10</div>
              </div>
              <div className="flex flex-col gap-2">
                <div className={cn("px-3 py-1.5 rounded-full text-sm font-black tracking-wide", cfg.badge, cfg.badgeBorder)}>
                  {cfg.emoji} {cfg.label}
                </div>
                <div className="text-xs text-[hsl(215_14%_55%)] max-w-[160px] leading-snug">{cfg.desc}</div>
                <AnimatedWeatherIcon code={data.hourly[hourNow]?.weatherCode ?? 0} hour={hourNow} size="lg" />
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-[10px] text-[hsl(215_14%_45%)] mb-1">
                <span>0 · STOP</span>
                <span>4 · CAUTION</span>
                <span>7 · GO 🪂</span>
              </div>
              <div className="relative h-3 bg-[hsl(220_16%_16%)] rounded-full overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="flex-[4] bg-[hsl(0_90%_55%/0.12)] border-r border-[hsl(0_90%_55%/0.2)]" />
                  <div className="flex-[3] bg-[hsl(43_100%_52%/0.10)] border-r border-[hsl(43_100%_52%/0.2)]" />
                  <div className="flex-[3] bg-[hsl(142_76%_45%/0.08)]" />
                </div>
                <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(vol.total / 10) * 100}%`, background: `linear-gradient(to right, ${cfg.bar}99, ${cfg.bar})` }} />
              </div>
            </div>

            {/* Condition tiles grid */}
            <div className="grid grid-cols-3 gap-1.5">
              <CondTile icon="💨" label="Vento" value={`${wArrow} ${data.currentWind}`} sub={`${wDir} · km/h`}
                color={data.currentWind > 30 ? "#f87171" : data.currentWind > 18 ? "#fbbf24" : "#4ade80"}
                alert={data.currentWind > data.site.maxWindKmh} />
              <CondTile icon="💥" label="Raffiche" value={`${data.currentGust}`} sub="km/h"
                color={data.currentGust > 40 ? "#f87171" : data.currentGust > 28 ? "#fbbf24" : "#94a3b8"}
                alert={data.currentGust > 40} />
              <CondTile icon="🌡️" label="Temp" value={`${data.currentTemp}°C`} sub={`DP ${data.currentDewpoint.toFixed(0)}°C`} color="#7dd3fc" />
              <CondTile icon="🌀" label="Termiche" value={`${thermalMs.toFixed(1)} m/s`}
                sub={thermalMs > 3 ? "Forti 🚀" : thermalMs > 2 ? "Ottime" : thermalMs > 1 ? "Buone" : thermalMs > 0.5 ? "Deboli" : "Assenti"}
                color={tcol(thermalMs)} />
              <CondTile icon="☁️" label="Base" value={`${data.currentCloudbaseM.toLocaleString()}m`}
                sub={`+${cloudbaseAbove.toLocaleString()}m`}
                color={cloudbaseAbove > 1000 ? "#4ade80" : cloudbaseAbove > 500 ? "#60a5fa" : "#f87171"} />
              <CondTile icon="⚡" label="CAPE" value={`${data.currentCape}`} sub="J/kg"
                color={data.currentCape > 700 ? "#f87171" : data.currentCape > 300 ? "#fbbf24" : "#4ade80"}
                alert={data.currentCape > 600} />
              <CondTile icon="🚀" label="Tetto" value={`${data.currentCeiling.toLocaleString()}m`}
                sub={`+${(data.currentCeiling - data.site.altitude).toLocaleString()}m`} color="#fbbf24" />
              <CondTile icon="👁️" label="Visib." value={`${data.currentVisibility}km`}
                color={data.currentVisibility > 10 ? "#4ade80" : data.currentVisibility > 5 ? "#fbbf24" : "#f87171"} />
              <CondTile icon="🌫️" label="Nuvole" value={`${data.currentCloudCover}%`}
                color={data.currentCloudCover > 80 ? "#94a3b8" : "#e2e8f0"} />
            </div>
          </div>

          {/* RIGHT: Score panels (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-3">

            {/* Radial scores row */}
            <div className="bg-[hsl(220_20%_9%/0.8)] border border-[hsl(220_16%_18%)] rounded-xl p-4">
              <div className="text-xs font-bold text-[hsl(215_14%_50%)] uppercase tracking-wider mb-3">Indici Chiave</div>
              <div className="flex items-center justify-around gap-2 flex-wrap">
                <RadialScore value={vol.total} color={cfg.numColor} label="Volabilità" size={90} />
                <RadialScore value={dangerIdx} color={dcol(dangerIdx)} label="Non-Volo" size={90} />
                <RadialScore value={thermalMs} max={6} color={tcol(thermalMs)} label="Termiche m/s" size={90} />
                <RadialScore value={data.xcScore} color={data.xcScore >= 7 ? "#4ade80" : data.xcScore >= 5 ? "#fbbf24" : "#f87171"} label="XC Score" size={90} />
              </div>
            </div>

            {/* Panel switcher */}
            <div className="flex gap-1 bg-[hsl(220_20%_9%/0.8)] border border-[hsl(220_16%_18%)] rounded-xl p-1">
              {[
                { id: "breakdown" as const, label: "📋 Dettaglio" },
                { id: "danger" as const, label: "🚨 Non-Volo" },
                { id: "thermal" as const, label: "🌀 Termiche" },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActivePanel(tab.id)}
                  className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                    activePanel === tab.id ? "bg-[hsl(220_16%_18%)] text-white" : "text-[hsl(215_14%_50%)] hover:text-white"
                  )}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Breakdown panel */}
            {activePanel === "breakdown" && (
              <div className="bg-[hsl(220_20%_9%/0.8)] border border-[hsl(220_16%_18%)] rounded-xl p-4 flex flex-col gap-2 fade-up">
                <div className="text-xs font-bold text-[hsl(215_14%_50%)] uppercase tracking-wider mb-1">Componenti Volabilità /10</div>
                <BreakdownBar label="🧭 Direzione Vento" val={vol.windDir} max={3} barColor={cfg.bar} />
                <BreakdownBar label="💨 Velocità Vento" val={vol.windSpeed} max={2} barColor={cfg.bar} />
                <BreakdownBar label="💥 Raffiche" val={vol.gusts} max={1.5} barColor={cfg.bar} />
                <BreakdownBar label="🌀 Termiche" val={vol.thermals} max={1.5} barColor="#f97316" />
                <BreakdownBar label="☁️ Base Cumuli" val={vol.cloudbase} max={1} barColor="#60a5fa" />
                <BreakdownBar label="🌤️ Stabilità meteo" val={vol.stability} max={1} barColor="#a78bfa" />
                <div className="mt-2 pt-2 border-t border-[hsl(220_16%_18%)] flex items-center justify-between">
                  <span className="text-xs text-[hsl(215_14%_50%)]">Vento sito: max {data.site.maxWindKmh} km/h · ora {data.currentWind} km/h</span>
                  <span className="text-xs font-bold" style={{ color: data.currentWind > data.site.maxWindKmh ? "#f87171" : "#4ade80" }}>
                    {data.currentWind > data.site.maxWindKmh ? "⚠️ Oltre limite" : "✓ Nei limiti"}
                  </span>
                </div>
              </div>
            )}

            {/* Danger panel */}
            {activePanel === "danger" && (
              <div className="bg-[hsl(220_20%_9%/0.8)] border border-[hsl(220_16%_18%)] rounded-xl p-4 flex flex-col gap-3 fade-up">
                <div className="text-xs font-bold text-[hsl(215_14%_50%)] uppercase tracking-wider">Indice Pericolo Non-Volo</div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-6xl font-black" style={{ color: dcol(dangerIdx) }}>{dangerIdx}</div>
                    <div className="text-sm text-[hsl(215_14%_50%)]">/10</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg" style={{ color: dcol(dangerIdx) }}>
                      {dangerIdx >= 8 ? "PERICOLOSO" : dangerIdx >= 6 ? "ELEVATO" : dangerIdx >= 4 ? "MODERATO" : dangerIdx >= 2 ? "BASSO" : "SICURO"}
                    </div>
                    <div className="text-xs text-[hsl(215_14%_50%)] mt-1 max-w-[200px]">
                      {dangerIdx >= 7 ? "Condizioni pericolose. Non decollare assolutamente." :
                       dangerIdx >= 5 ? "Attenzione elevata richiesta. Solo piloti esperti." :
                       dangerIdx >= 3 ? "Condizioni moderate. Valutare con cura." :
                       "Condizioni sicure per il volo."}
                    </div>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex-1 h-2 rounded-sm transition-all"
                      style={{ background: i < dangerIdx ? dcol(dangerIdx) : "hsl(220 16% 18%)" }} />
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { icon: "💨", label: "Vento sup.", value: data.currentWind, unit: "km/h", max: 60, danger: data.site.maxWindKmh },
                    { icon: "💥", label: "Raffiche", value: data.currentGust, unit: "km/h", max: 70, danger: 40 },
                    { icon: "🌀", label: "Wind Shear", value: data.currentWindShear, unit: "km/h", max: 50, danger: 25 },
                    { icon: "⚡", label: "CAPE", value: data.currentCape, unit: "J/kg", max: 1000, danger: 400 },
                    { icon: "💥", label: "Turbolenza", value: data.turbulenceScore, unit: "/10", max: 10, danger: 6 },
                  ].map((b) => (
                    <div key={b.label} className="flex items-center gap-2">
                      <span className="text-sm shrink-0">{b.icon}</span>
                      <span className="text-xs text-[hsl(215_14%_48%)] w-24 shrink-0">{b.label}</span>
                      <div className="flex-1 h-1.5 bg-[hsl(220_16%_17%)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (b.value / b.max) * 100)}%`, background: b.value >= b.danger ? "#f87171" : "#4ade80" }} />
                      </div>
                      <span className="text-xs font-mono w-14 text-right" style={{ color: b.value >= b.danger ? "#f87171" : "#4ade80" }}>
                        {b.value} {b.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thermal panel */}
            {activePanel === "thermal" && (
              <div className="bg-[hsl(220_20%_9%/0.8)] border border-[hsl(220_16%_18%)] rounded-xl p-4 flex flex-col gap-3 fade-up">
                <div className="text-xs font-bold text-[hsl(215_14%_50%)] uppercase tracking-wider">🌀 Colonna Termica Attuale</div>

                <div className="flex gap-4">
                  {/* Visual thermal column */}
                  <div className="relative rounded-xl overflow-hidden shrink-0" style={{ width: 56, height: 160 }}>
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #0f2027 0%, #1a3a4a 50%, #2c5364 100%)" }} />
                    <div className="absolute bottom-0 left-0 right-0 h-6" style={{ background: "linear-gradient(to top, #3d2b1f, #5a3e2b)" }} />
                    {thermalMs >= 0.5 && (
                      <div className="absolute left-1/2 -translate-x-1/2 rounded-t-full"
                        style={{
                          bottom: 24,
                          width: 18,
                          height: `${Math.min(80, (thermalVertDev / 2000) * 100)}%`,
                          background: `linear-gradient(to top, ${tcol(thermalMs)}80, ${tcol(thermalMs)}15)`,
                        }}>
                        {[25, 50, 75].map((p) => (
                          <div key={p} className="absolute left-1/2 -translate-x-1/2 text-[8px] font-bold" style={{ bottom: `${p}%`, color: tcol(thermalMs) }}>↑</div>
                        ))}
                      </div>
                    )}
                    <div className="absolute right-0 left-0 border-t border-dashed border-blue-400/50"
                      style={{ bottom: `${Math.min(88, (cloudbaseAbove / 2000) * 80 + 16)}%` }} />
                    <div className="absolute bottom-6 left-0.5 text-[7px] text-[hsl(215_14%_55%)]">⛰️</div>
                  </div>

                  {/* Stats */}
                  <div className="flex-1 grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Vel. ascendenza", value: `${thermalMs.toFixed(1)} m/s`, color: tcol(thermalMs) },
                      { label: "Tetto termiche", value: `${thermalTopMsl.toLocaleString()}m slm`, color: "#fbbf24" },
                      { label: "Svil. verticale", value: `+${thermalVertDev.toLocaleString()}m`, color: "#fbbf24" },
                      { label: "Base cumuli", value: `${data.currentCloudbaseM.toLocaleString()}m`, color: "#60a5fa" },
                      { label: "BLH (grezzo)", value: `${data.currentBlh.toLocaleString()}m AGL`, color: "#94a3b8" },
                      { label: "Turbolenza", value: data.turbulence === "LOW" ? "😊 Bassa" : data.turbulence === "MOD" ? "😐 Moderata" : "😱 Severa", color: data.turbulence === "LOW" ? "#4ade80" : data.turbulence === "MOD" ? "#fbbf24" : "#f87171" },
                    ].map((item) => (
                      <div key={item.label} className="bg-[hsl(220_20%_11%)] rounded-lg p-2 border border-[hsl(220_16%_18%)]">
                        <div className="text-[9px] text-[hsl(215_14%_45%)]">{item.label}</div>
                        <div className="font-bold text-xs mt-0.5" style={{ color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thermal speed indicator */}
                <div>
                  <div className="flex justify-between text-[10px] text-[hsl(215_14%_45%)] mb-1">
                    <span>0 — Assenti</span><span>2 — Buone</span><span>4+ — Forti</span>
                  </div>
                  <div className="h-2 bg-[hsl(220_16%_16%)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (thermalMs / 6) * 100)}%`, background: tcol(thermalMs) }} />
                  </div>
                </div>
              </div>
            )}

            {/* XC route if available */}
            {data.xcRoute && data.xcScore >= 5 && (
              <div className="bg-[hsl(43_100%_52%/0.07)] border border-[hsl(43_100%_52%/0.3)] rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[hsl(43_100%_65%)]">XC Route Consigliata</div>
                  <div className="text-sm font-bold text-white truncate mt-0.5">{data.xcRoute}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-[hsl(215_14%_50%)]">XC Score</div>
                  <div className="font-black text-xl" style={{ color: data.xcScore >= 7 ? "#4ade80" : "#fbbf24" }}>{data.xcScore}/10</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
