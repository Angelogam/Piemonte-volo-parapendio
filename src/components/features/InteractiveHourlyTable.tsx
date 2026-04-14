import { useState, useMemo } from "react";
import { HourlyForecast as HF } from "@/types/weather";
import { cn } from "@/lib/utils";
import AnimatedWeatherIcon from "@/components/features/AnimatedWeatherIcon";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

interface Props {
  hourly: HF[];
  selectedIdx?: number;
  onHourSelect?: (idx: number) => void;
  siteAlt: number;
}

const volColor = (v: number) => v >= 7 ? "#4ade80" : v >= 4 ? "#fbbf24" : "#f87171";
const windColor = (s: number) => s > 35 ? "#f87171" : s > 25 ? "#fb923c" : s > 18 ? "#fbbf24" : "#60a5fa";
const thermalColor = (t: number) => t >= 4 ? "#f97316" : t >= 2.5 ? "#fbbf24" : t >= 1.5 ? "#4ade80" : t >= 0.5 ? "#86efac" : "#6b7280";
const precipColor = (p: number) => p > 70 ? "#f87171" : p > 40 ? "#fb923c" : p > 20 ? "#fbbf24" : "#94a3b8";

const windDirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
function wDir(deg: number) { return windDirs[Math.round(deg / 45) % 8]; }

function WindArrow({ deg, color, size = 12 }: { deg: number; color: string; size?: number }) {
  const rot = (deg + 180) % 360;
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" style={{ transform: `rotate(${rot}deg)`, display: "inline-block" }}>
      <polygon points="6,1 8.5,10 6,8 3.5,10" fill={color} />
    </svg>
  );
}

function HourDetailModal({ h, siteAlt, onClose }: { h: HF & Record<string, unknown>; siteAlt: number; onClose: () => void }) {
  const thermalMs = (h.thermalMs as number) ?? 0;
  const cloudbaseM = (h.cloudbaseM as number) ?? siteAlt + 500;
  const blh = (h.blh as number) ?? 800;
  const thermalVertDev = Math.round(blh * 0.85);
  const thermalTopMsl = siteAlt + thermalVertDev;
  const volC = volColor(h.volability);

  const dangerIdx = Math.min(10, Math.max(1, Math.round(
    (h.windSpeed > 35 ? 4 : h.windSpeed > 25 ? 2.5 : h.windSpeed > 18 ? 1 : 0) +
    (h.windGust > 45 ? 3 : h.windGust > 35 ? 2 : h.windGust > 28 ? 1 : 0) +
    (h.capeIndex > 800 ? 2 : h.capeIndex > 400 ? 1 : 0) +
    (h.precipProb > 70 ? 2 : h.precipProb > 40 ? 1 : 0) +
    (h.turbScore > 7 ? 1 : 0)
  )));

  const isFlightWindow = h.hour >= 10 && h.hour <= 16;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[hsl(220_23%_9%)] border border-[hsl(220_16%_22%)] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto fade-up"
        onClick={(e) => e.stopPropagation()}>

        {/* Sticky header */}
        <div className="sticky top-0 bg-[hsl(220_23%_9%)] px-5 pt-4 pb-3 border-b border-[hsl(220_16%_18%)] flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <AnimatedWeatherIcon code={h.weatherCode} hour={h.hour} size="md" />
              <div className="font-black text-white text-xl">{String(h.hour).padStart(2, "0")}:00</div>
              {isFlightWindow && <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(142_76%_45%/0.2)] text-[hsl(142_76%_65%)] border border-[hsl(142_76%_45%/0.4)] font-bold">🪂 Finestra</span>}
            </div>
            <div className="text-sm font-bold mt-0.5" style={{ color: volC }}>
              Volabilità {h.volability.toFixed(1)}/10 · {h.volability >= 7 ? "🪂 VOLA" : h.volability >= 4 ? "⚠️ VALUTA" : "🚫 NON VOLARE"}
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-[hsl(220_16%_18%)] text-[hsl(215_14%_60%)] hover:text-white text-lg transition-colors">✕</button>
        </div>

        <div className="p-5 flex flex-col gap-5">

          {/* Big scores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border p-4 text-center" style={{ borderColor: `${volC}40`, background: `${volC}0d` }}>
              <div className="text-xs text-[hsl(215_14%_50%)]">Indice Volabilità</div>
              <div className="text-5xl font-black my-1" style={{ color: volC }}>{h.volability.toFixed(1)}</div>
              <div className="text-xs text-[hsl(215_14%_50%)]">/10</div>
            </div>
            <div className="rounded-2xl border p-4 text-center" style={{ borderColor: `${dangerIdx >= 6 ? "#f87171" : "#4ade80"}40`, background: `${dangerIdx >= 6 ? "#f87171" : "#4ade80"}0d` }}>
              <div className="text-xs text-[hsl(215_14%_50%)]">Indice Non-Volo</div>
              <div className="text-5xl font-black my-1" style={{ color: dangerIdx >= 6 ? "#f87171" : dangerIdx >= 4 ? "#fbbf24" : "#4ade80" }}>{dangerIdx}</div>
              <div className="text-xs text-[hsl(215_14%_50%)]">/10</div>
            </div>
          </div>

          {/* Detailed grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "🌡️", label: "Temperatura", value: `${h.temp}°C`, sub: `DP ${(h as any).dewpoint ?? "--"}°C` },
              { icon: "💨", label: "Vento", value: `${h.windSpeed} km/h`, sub: `${wDir(h.windDir)} · ${wDir(h.windDir)}`, alert: h.windSpeed > 25 },
              { icon: "💥", label: "Raffiche", value: `${h.windGust} km/h`, alert: h.windGust > 35 },
              { icon: "🌧️", label: "Precipit.", value: `${h.precipProb}%`, sub: "probabilità", alert: h.precipProb > 50 },
              { icon: "🌀", label: "Termiche", value: thermalMs > 0 ? `${thermalMs.toFixed(1)} m/s` : "Assenti", sub: thermalMs > 3 ? "Forti 🚀" : thermalMs > 2 ? "Ottime" : thermalMs > 1 ? "Buone" : "Deboli" },
              { icon: "☁️", label: "Base Cumuli", value: `${cloudbaseM.toLocaleString()}m`, sub: `+${(cloudbaseM - siteAlt).toLocaleString()}m sopra` },
              { icon: "🚀", label: "Tetto Termico", value: `${thermalTopMsl.toLocaleString()}m slm`, sub: `+${thermalVertDev.toLocaleString()}m sviluppo` },
              { icon: "⚡", label: "CAPE", value: `${h.capeIndex} J/kg`, alert: h.capeIndex > 500 },
              { icon: "🏆", label: "XC Score", value: `${h.xcScore}/10` },
              { icon: "💧", label: "Nuvole", value: `${h.cloudCover}%` },
              { icon: "👁️", label: "Visib.", value: `${h.visibility ?? "--"} km` },
              { icon: "🌡️", label: "Turbolenza", value: `${h.turbScore}/10`, alert: h.turbScore > 6 },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-xl p-3 border",
                (item as any).alert ? "bg-[hsl(0_90%_55%/0.08)] border-[hsl(0_90%_55%/0.3)]" : "bg-[hsl(220_20%_11%)] border-[hsl(220_16%_18%)]"
              )}>
                <div className="text-base">{item.icon}</div>
                <div className="text-xs text-[hsl(215_14%_50%)] mt-0.5">{item.label}</div>
                <div className="font-bold text-white mt-0.5">{item.value}</div>
                {(item as any).sub && <div className="text-[10px] text-[hsl(215_14%_40%)]">{(item as any).sub}</div>}
              </div>
            ))}
          </div>

          {/* Wind at altitude */}
          <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_18%)] rounded-xl p-3">
            <div className="text-xs font-bold text-[hsl(215_14%_50%)] uppercase tracking-wider mb-2">💨 Vento per Quota</div>
            <div className="flex flex-col gap-1.5">
              {[
                { alt: `${siteAlt}m (decollo)`, speed: h.windSpeed, dir: h.windDir },
                { alt: `${siteAlt + 500}m`, speed: (h as any).windSpeed80m ?? Math.round(h.windSpeed * 1.2), dir: h.windDir },
                { alt: `${siteAlt + 1000}m`, speed: (h as any).windSpeed120m ?? Math.round(h.windSpeed * 1.35), dir: h.windDir },
                { alt: `${siteAlt + 2000}m`, speed: Math.round(h.windSpeed * 1.5), dir: h.windDir },
              ].map((row) => (
                <div key={row.alt} className="flex items-center gap-2">
                  <span className="text-[10px] text-[hsl(215_14%_45%)] w-28 shrink-0 font-mono">{row.alt}</span>
                  <div className="flex-1 h-1.5 bg-[hsl(220_16%_16%)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (row.speed / 60) * 100)}%`, background: windColor(row.speed) }} />
                  </div>
                  <div className="flex items-center gap-1 w-16 justify-end">
                    <WindArrow deg={row.dir} color={windColor(row.speed)} />
                    <span className="text-xs font-bold" style={{ color: windColor(row.speed) }}>{row.speed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flight window notice */}
          {isFlightWindow && (
            <div className="bg-[hsl(142_76%_45%/0.08)] border border-[hsl(142_76%_45%/0.3)] rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">🪂</span>
              <div>
                <div className="font-bold text-[hsl(142_76%_65%)] text-sm">Finestra di Volo Ottimale</div>
                <div className="text-xs text-[hsl(215_14%_55%)] mt-0.5">10:00–16:00 — condizioni termiche migliori della giornata</div>
              </div>
            </div>
          )}

          {/* Alerts */}
          <div className="flex flex-col gap-2">
            {h.windSpeed > 30 && (
              <div className="bg-[hsl(0_90%_55%/0.08)] border border-[hsl(0_90%_55%/0.3)] rounded-xl px-4 py-2.5 text-sm text-[hsl(0_90%_65%)]">
                ⚠️ Vento forte ({h.windSpeed} km/h) — valutare attentamente il decollo
              </div>
            )}
            {h.windGust > 35 && (
              <div className="bg-[hsl(0_90%_55%/0.08)] border border-[hsl(0_90%_55%/0.3)] rounded-xl px-4 py-2.5 text-sm text-[hsl(0_90%_65%)]">
                🌪️ Raffiche pericolose ({h.windGust} km/h) — non decollare
              </div>
            )}
            {h.capeIndex > 500 && (
              <div className="bg-[hsl(43_100%_52%/0.08)] border border-[hsl(43_100%_52%/0.3)] rounded-xl px-4 py-2.5 text-sm text-[hsl(43_100%_65%)]">
                ⛈️ CAPE elevato ({h.capeIndex} J/kg) — rischio sviluppi temporaleschi
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InteractiveHourlyTable({ hourly, selectedIdx, onHourSelect, siteAlt }: Props) {
  const [activeHour, setActiveHour] = useState<(HF & Record<string, unknown>) | null>(null);
  const [chartView, setChartView] = useState<"vol" | "wind" | "thermal" | "precip">("vol");

  // 09–19h window
  const todayHours = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return hourly
      .filter((h) => h.time?.startsWith(today) && h.hour >= 9 && h.hour <= 19)
      .map((h, i) => ({ h, realIdx: i }));
  }, [hourly]);

  const currentHour = new Date().getHours();

  const chartData = todayHours.map(({ h }) => ({
    hour: h.hour,
    vol: h.volability,
    wind: h.windSpeed,
    gust: h.windGust,
    thermalMs: (h as any).thermalMs ?? 0,
    precip: h.precipProb,
  }));

  const chartCfg = {
    vol: { key: "vol", label: "Volabilità", color: "#4ade80", max: 10, unit: "/10", domain: [0, 10] as [number, number] },
    wind: { key: "wind", label: "Vento km/h", color: "#60a5fa", max: 60, unit: "km/h", domain: [0, 60] as [number, number] },
    thermal: { key: "thermalMs", label: "Termiche m/s", color: "#f97316", max: 6, unit: "m/s", domain: [0, 6] as [number, number] },
    precip: { key: "precip", label: "Precipit. %", color: "#818cf8", max: 100, unit: "%", domain: [0, 100] as [number, number] },
  };

  const activeCfg = chartCfg[chartView];

  return (
    <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl overflow-hidden">
      {activeHour && (
        <HourDetailModal h={activeHour} siteAlt={siteAlt} onClose={() => setActiveHour(null)} />
      )}

      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-[hsl(220_16%_18%)]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-black text-white text-base">⏱️ Previsioni Orarie</div>
            <div className="text-xs text-[hsl(215_14%_50%)] mt-0.5">09:00 – 19:00 · Tocca una riga per il dettaglio completo</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[hsl(142_76%_55%)]" />
              <span className="text-[10px] text-[hsl(215_14%_50%)]">Finestra ottimale 10–16h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart section */}
      <div className="px-4 sm:px-5 py-4 border-b border-[hsl(220_16%_18%)]">
        {/* Chart type selector */}
        <div className="flex gap-1 mb-3">
          {[
            { k: "vol" as const, l: "🪂 Volabilità" },
            { k: "wind" as const, l: "💨 Vento" },
            { k: "thermal" as const, l: "🌀 Termiche" },
            { k: "precip" as const, l: "🌧️ Precipit." },
          ].map((t) => (
            <button key={t.k} onClick={() => setChartView(t.k)}
              className={cn("flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all border min-h-[32px] whitespace-nowrap",
                chartView === t.k
                  ? "bg-[hsl(220_16%_18%)] text-white border-[hsl(220_16%_28%)]"
                  : "text-[hsl(215_14%_50%)] border-[hsl(220_16%_16%)] hover:text-white"
              )}>
              {t.l}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={100}>
          {chartView === "vol" ? (
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 16%)" vertical={false} />
              <XAxis dataKey="hour" tickFormatter={(v) => `${v}h`} tick={{ fill: "hsl(215 14% 45%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={false} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`${(v as number).toFixed(1)}/10`, "Volabilità"]}
                labelFormatter={(l) => `${l}:00`}
                contentStyle={{ background: "hsl(220 23% 10%)", border: "1px solid hsl(220 16% 25%)", borderRadius: 8, fontSize: 11 }}
              />
              <ReferenceLine y={7} stroke="#4ade80" strokeDasharray="4 2" strokeOpacity={0.5} />
              <ReferenceLine y={4} stroke="#fbbf24" strokeDasharray="4 2" strokeOpacity={0.5} />
              <Bar dataKey="vol" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={volColor(entry.vol)} fillOpacity={entry.hour === currentHour ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <defs>
                <linearGradient id={`grad-${chartView}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeCfg.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={activeCfg.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 16%)" vertical={false} />
              <XAxis dataKey="hour" tickFormatter={(v) => `${v}h`} tick={{ fill: "hsl(215 14% 45%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={activeCfg.domain} tick={false} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(1)} ${activeCfg.unit}`, activeCfg.label]}
                labelFormatter={(l) => `${l}:00`}
                contentStyle={{ background: "hsl(220 23% 10%)", border: "1px solid hsl(220 16% 25%)", borderRadius: 8, fontSize: 11 }}
              />
              <Area type="monotone" dataKey={activeCfg.key} stroke={activeCfg.color} fill={`url(#grad-${chartView})`} strokeWidth={2} dot={false} />
              {chartView === "wind" && (
                <Area type="monotone" dataKey="gust" stroke="#fb923c" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              )}
            </AreaChart>
          )}
        </ResponsiveContainer>

        <div className="flex justify-between text-[10px] text-[hsl(215_14%_40%)] mt-1 px-1">
          <span>09:00</span>
          <span className="text-[hsl(142_76%_50%)] font-bold">🪂 finestra ottimale 10–16h</span>
          <span>19:00</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[600px]">
          <thead>
            <tr className="border-b border-[hsl(220_16%_18%)] bg-[hsl(220_20%_9%)]">
              <th className="px-3 py-2.5 text-left text-[hsl(215_14%_50%)] font-semibold">Ora</th>
              <th className="px-2 py-2.5 text-center text-[hsl(215_14%_50%)] font-semibold">Meteo</th>
              <th className="px-2 py-2.5 text-center text-[hsl(215_14%_50%)] font-semibold">🌡° C</th>
              <th className="px-2 py-2.5 text-center text-[hsl(215_14%_50%)] font-semibold">💨 km/h</th>
              <th className="px-2 py-2.5 text-center text-[hsl(215_14%_50%)] font-semibold">💥 Raff.</th>
              <th className="px-2 py-2.5 text-center text-[hsl(215_14%_50%)] font-semibold">🌀 m/s</th>
              <th className="px-2 py-2.5 text-center text-[hsl(215_14%_50%)] font-semibold">☁️ Base</th>
              <th className="px-2 py-2.5 text-center text-[hsl(215_14%_50%)] font-semibold">🌧️%</th>
              <th className="px-2 py-2.5 text-center text-[hsl(215_14%_50%)] font-semibold">🏆 XC</th>
              <th className="px-3 py-2.5 text-center text-[hsl(215_14%_50%)] font-semibold">Vol.</th>
            </tr>
          </thead>
          <tbody>
            {todayHours.map(({ h, realIdx }) => {
              const thermalMs = (h as any).thermalMs ?? 0;
              const cloudbaseM = (h as any).cloudbaseM ?? siteAlt + 500;
              const isWindow = h.hour >= 10 && h.hour <= 16;
              const isCurrent = h.hour === currentHour;
              const vc = volColor(h.volability);
              const wc = windColor(h.windSpeed);
              const tc = thermalColor(thermalMs);
              const pc = precipColor(h.precipProb);
              return (
                <tr
                  key={h.hour}
                  onClick={() => { setActiveHour(h as HF & Record<string, unknown>); if (onHourSelect) onHourSelect(realIdx); }}
                  className={cn(
                    "border-b border-[hsl(220_16%_15%/0.5)] cursor-pointer transition-all group",
                    isCurrent ? "bg-[hsl(205_90%_45%/0.08)] border-l-2 border-l-[hsl(205_90%_55%/0.6)]" :
                    isWindow ? "bg-[hsl(142_76%_45%/0.04)]" : "",
                    "hover:bg-[hsl(220_18%_14%)]"
                  )}>
                  <td className="px-3 py-3 font-mono font-black text-white whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-[hsl(205_90%_55%)] live-dot shrink-0" />}
                      <span>{h.hour.toString().padStart(2, "0")}:00</span>
                      {isWindow && <span className="text-[9px] text-[hsl(142_76%_55%)]">🪂</span>}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <AnimatedWeatherIcon code={h.weatherCode} hour={h.hour} size="sm" />
                  </td>
                  <td className="px-2 py-3 text-center text-[hsl(200_80%_75%)] font-bold">{h.temp}°</td>
                  <td className="px-2 py-3 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <WindArrow deg={h.windDir} color={wc} />
                      <span className="font-bold" style={{ color: wc }}>{h.windSpeed}</span>
                      <span className="text-[9px] text-[hsl(215_14%_45%)]">{wDir(h.windDir)}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center text-[hsl(215_14%_55%)] font-medium">{h.windGust}</td>
                  <td className="px-2 py-3 text-center">
                    <span className="font-bold" style={{ color: tc }}>{thermalMs > 0 ? thermalMs.toFixed(1) : "—"}</span>
                  </td>
                  <td className="px-2 py-3 text-center text-[hsl(205_80%_65%)] text-[11px]">
                    {cloudbaseM.toLocaleString()}m
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="font-bold text-[11px]" style={{ color: pc }}>{h.precipProb}%</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="font-bold text-[11px]" style={{ color: h.xcScore >= 7 ? "#4ade80" : h.xcScore >= 5 ? "#fbbf24" : "#f87171" }}>
                      {h.xcScore}/10
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-black text-sm" style={{ color: vc }}>{h.volability.toFixed(1)}</span>
                      <div className="w-10 h-1 bg-[hsl(220_16%_16%)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(h.volability / 10) * 100}%`, background: vc }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer legend */}
      <div className="px-4 py-3 border-t border-[hsl(220_16%_18%)] flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-[10px] text-[hsl(215_14%_45%)]">
          {[
            { c: "#4ade80", l: "≥7 VOLA" },
            { c: "#fbbf24", l: "4-7 VALUTA" },
            { c: "#f87171", l: "<4 STOP" },
          ].map((x) => (
            <div key={x.l} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: x.c }} />
              <span>{x.l}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto text-[10px] text-[hsl(215_14%_45%)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(205_90%_55%)] live-dot" />
          <span>ora corrente</span>
          <span className="ml-2">🪂 finestra 10–16h</span>
        </div>
      </div>
    </div>
  );
}
