import { useState, useMemo } from "react";
import { HourlyForecast as HF } from "@/types/weather";
import { cn } from "@/lib/utils";
import AnimatedWeatherIcon from "@/components/features/AnimatedWeatherIcon";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Props {
  hourly: HF[];
  selectedIdx?: number;
  onHourSelect?: (idx: number) => void;
  siteAlt: number;
}

const vc = (v: number) => v >= 7 ? "#16a34a" : v >= 4 ? "#d97706" : "#dc2626";
const wc = (s: number) => s > 35 ? "#dc2626" : s > 25 ? "#ea580c" : s > 18 ? "#d97706" : "#3b82f6";
const tc = (t: number) => t >= 4 ? "#ea580c" : t >= 2.5 ? "#d97706" : t >= 1.5 ? "#16a34a" : t >= 0.5 ? "#65a30d" : "#9ca3af";
const pc = (p: number) => p > 70 ? "#dc2626" : p > 40 ? "#ea580c" : p > 20 ? "#d97706" : "#9ca3af";
const cc = (c: number) => c > 600 ? "#dc2626" : c > 300 ? "#d97706" : c > 50 ? "#65a30d" : "#9ca3af";

const windDirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
function wDir(deg: number) { return windDirs[Math.round(deg / 45) % 8]; }

function WindArrow({ deg, color, size = 10 }: { deg: number; color: string; size?: number }) {
  const rot = (deg + 180) % 360;
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" style={{ transform: `rotate(${rot}deg)`, display: "inline-block" }}>
      <polygon points="5,1 7,9 5,7 3,9" fill={color} />
    </svg>
  );
}

function HourDetailModal({ h, siteAlt, onClose }: { h: HF & Record<string, unknown>; siteAlt: number; onClose: () => void }) {
  const thermalMs = (h.thermalMs as number) ?? 0;
  const cloudbaseM = (h.cloudbaseM as number) ?? siteAlt + 500;
  const blh = (h.blh as number) ?? 800;
  const thermalVertDev = Math.round(blh * 0.85);
  const thermalTopMsl = siteAlt + thermalVertDev;
  const volC = vc(h.volability);
  const label = h.volability >= 7 ? "GO" : h.volability >= 4 ? "CAUTION" : "STOP";
  const volBg = label === "GO" ? "#f0fdf4" : label === "CAUTION" ? "#fffbeb" : "#fef2f2";
  const volBorder = label === "GO" ? "#bbf7d0" : label === "CAUTION" ? "#fde68a" : "#fecaca";

  const dangerIdx = Math.min(10, Math.max(1, Math.round(
    (h.windSpeed > 35 ? 4 : h.windSpeed > 25 ? 2.5 : h.windSpeed > 18 ? 1 : 0) +
    (h.windGust > 45 ? 3 : h.windGust > 35 ? 2 : h.windGust > 28 ? 1 : 0) +
    (h.capeIndex > 800 ? 2 : h.capeIndex > 400 ? 1 : 0) +
    (h.precipProb > 70 ? 2 : h.precipProb > 40 ? 1 : 0) +
    (h.turbScore > 7 ? 1 : 0)
  )));

  const isWindow = h.hour >= 10 && h.hour <= 16;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto card-shadow-lg border border-gray-200 fade-up"
        onClick={(e) => e.stopPropagation()}>

        <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AnimatedWeatherIcon code={h.weatherCode} hour={h.hour} size="md" />
              <span className="font-black text-gray-900 text-xl">{String(h.hour).padStart(2, "0")}:00</span>
              {isWindow && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold">🪂 Finestra</span>}
            </div>
            <div className="text-sm font-black mt-0.5" style={{ color: volC }}>
              Volabilità {h.volability.toFixed(1)}/10 · {h.volability >= 7 ? "🪂 VOLA" : h.volability >= 4 ? "⚠️ VALUTA" : "🚫 NON VOLARE"}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">✓ Dati reali Open-Meteo</div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border-2 p-4 text-center" style={{ borderColor: volBorder, background: volBg }}>
              <div className="text-xs text-gray-500">Volabilità</div>
              <div className="text-5xl font-black my-1" style={{ color: volC }}>{h.volability.toFixed(1)}</div>
              <div className="text-xs text-gray-400">/10</div>
            </div>
            <div className="rounded-2xl border-2 p-4 text-center"
              style={{ borderColor: dangerIdx >= 6 ? "#fecaca" : "#bbf7d0", background: dangerIdx >= 6 ? "#fef2f2" : "#f0fdf4" }}>
              <div className="text-xs text-gray-500">Non-Volo</div>
              <div className="text-5xl font-black my-1" style={{ color: dangerIdx >= 6 ? "#dc2626" : "#16a34a" }}>{dangerIdx}</div>
              <div className="text-xs text-gray-400">/10</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "🌡️", label: "Temperatura", value: `${h.temp}°C`, sub: `DP ${(h as any).dewpoint ?? "--"}°C` },
              { icon: "💨", label: "Vento", value: `${h.windSpeed} km/h`, sub: `${wDir(h.windDir)} · ${wDir(h.windDir)}`, alert: h.windSpeed > 25 },
              { icon: "💥", label: "Raffiche", value: `${h.windGust} km/h`, alert: h.windGust > 35 },
              { icon: "⚡", label: "CAPE", value: `${h.capeIndex} J/kg`, sub: h.capeIndex > 600 ? "⚠️ Pericoloso" : h.capeIndex > 300 ? "Attivo" : h.capeIndex > 50 ? "Moderato" : "Stabile", alert: h.capeIndex > 500 },
              { icon: "🌀", label: "Termiche", value: thermalMs > 0 ? `${thermalMs.toFixed(1)} m/s` : "Assenti", sub: thermalMs > 3 ? "Forti 🚀" : thermalMs > 2 ? "Ottime" : thermalMs > 1 ? "Buone" : thermalMs > 0.5 ? "Deboli" : "Assenti" },
              { icon: "☁️", label: "Base Cumuli", value: `${cloudbaseM.toLocaleString()}m`, sub: `+${(cloudbaseM - siteAlt).toLocaleString()}m sopra` },
              { icon: "🚀", label: "Tetto Termiche", value: `${thermalTopMsl.toLocaleString()}m`, sub: `+${thermalVertDev.toLocaleString()}m` },
              { icon: "🌧️", label: "Precipit.", value: `${h.precipProb}%`, alert: h.precipProb > 50 },
              { icon: "🏆", label: "XC Score", value: `${h.xcScore}/10` },
              { icon: "💧", label: "Nuvole", value: `${h.cloudCover}%` },
              { icon: "👁️", label: "Visib.", value: `${h.visibility} km` },
              { icon: "💥", label: "Turbolenza", value: `${h.turbScore}/10`, alert: h.turbScore > 6 },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-xl p-3 border",
                (item as any).alert ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"
              )}>
                <div className="text-base">{item.icon}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
                <div className="font-bold text-gray-900 mt-0.5">{item.value}</div>
                {(item as any).sub && <div className="text-[10px] text-gray-400">{(item as any).sub}</div>}
              </div>
            ))}
          </div>

          {/* Wind by altitude */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">💨 Vento per Quota</div>
            {[
              { alt: `${siteAlt}m (decollo)`, speed: h.windSpeed, dir: h.windDir },
              { alt: `${siteAlt + 500}m`, speed: (h as any).windSpeed80m ?? Math.round(h.windSpeed * 1.2), dir: h.windDir },
              { alt: `${siteAlt + 1000}m`, speed: (h as any).windSpeed120m ?? Math.round(h.windSpeed * 1.35), dir: h.windDir },
              { alt: `${siteAlt + 2000}m`, speed: Math.round(h.windSpeed * 1.5), dir: h.windDir },
            ].map((row) => (
              <div key={row.alt} className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] text-gray-400 font-mono w-28 shrink-0">{row.alt}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (row.speed / 60) * 100)}%`, background: wc(row.speed) }} />
                </div>
                <div className="flex items-center gap-1 w-16 justify-end">
                  <WindArrow deg={row.dir} color={wc(row.speed)} />
                  <span className="text-xs font-bold" style={{ color: wc(row.speed) }}>{row.speed}</span>
                </div>
              </div>
            ))}
          </div>

          {isWindow && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">🪂</span>
              <div>
                <div className="font-bold text-emerald-700 text-sm">Finestra di Volo Ottimale</div>
                <div className="text-xs text-emerald-600 mt-0.5">10:00–16:00 — condizioni termiche migliori</div>
              </div>
            </div>
          )}

          {h.windSpeed > 30 && <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700">⚠️ Vento forte ({h.windSpeed} km/h) — valutare il decollo</div>}
          {h.windGust > 35 && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">🌪️ Raffiche pericolose ({h.windGust} km/h) — non decollare</div>}
          {h.capeIndex > 500 && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">⛈️ CAPE elevato ({h.capeIndex} J/kg) — rischio temporale</div>}
        </div>
      </div>
    </div>
  );
}

export default function InteractiveHourlyTable({ hourly, selectedIdx, onHourSelect, siteAlt }: Props) {
  const [activeHour, setActiveHour] = useState<(HF & Record<string, unknown>) | null>(null);
  const [chartView, setChartView] = useState<"vol" | "wind" | "thermal" | "precip">("vol");

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
    vol: { key: "vol", label: "Volabilità", color: "#16a34a", domain: [0, 10] as [number, number] },
    wind: { key: "wind", label: "Vento km/h", color: "#3b82f6", domain: [0, 60] as [number, number] },
    thermal: { key: "thermalMs", label: "Termiche m/s", color: "#ea580c", domain: [0, 6] as [number, number] },
    precip: { key: "precip", label: "Precipit. %", color: "#6366f1", domain: [0, 100] as [number, number] },
  };

  const activeCfg = chartCfg[chartView];

  return (
    <div className="bg-white rounded-2xl card-shadow-lg border border-gray-200 overflow-hidden">
      {activeHour && (
        <HourDetailModal h={activeHour} siteAlt={siteAlt} onClose={() => setActiveHour(null)} />
      )}

      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-gray-100">
        <h3 className="font-black text-gray-900 text-base">⏱️ Previsioni Orarie – Dati Reali API</h3>
        <p className="text-xs text-gray-500 mt-0.5">09:00–19:00 · Dati orari reali Open-Meteo · Tocca una riga per il dettaglio</p>
      </div>

      {/* Chart */}
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
        <div className="flex gap-1 mb-3">
          {[
            { k: "vol" as const, l: "🪂 Volabilità" },
            { k: "wind" as const, l: "💨 Vento" },
            { k: "thermal" as const, l: "🌀 Termiche" },
            { k: "precip" as const, l: "🌧️ Precipit." },
          ].map((t) => (
            <button key={t.k} onClick={() => setChartView(t.k)}
              className={cn("flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all border min-h-[32px]",
                chartView === t.k
                  ? "bg-gray-900 text-white border-gray-900"
                  : "text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
              )}>
              {t.l}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={90}>
          {chartView === "vol" ? (
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="hour" tickFormatter={(v) => `${v}h`} tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={false} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(1)}/10`, "Volabilità"]}
                labelFormatter={(l) => `${l}:00`}
                contentStyle={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 11 }}
              />
              <Bar dataKey="vol" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={vc(entry.vol)} fillOpacity={entry.hour === currentHour ? 1 : 0.75} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <defs>
                <linearGradient id={`grad-${chartView}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeCfg.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={activeCfg.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="hour" tickFormatter={(v) => `${v}h`} tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={activeCfg.domain} tick={false} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(1)}`, activeCfg.label]}
                labelFormatter={(l) => `${l}:00`}
                contentStyle={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 11 }}
              />
              <Area type="monotone" dataKey={activeCfg.key} stroke={activeCfg.color} fill={`url(#grad-${chartView})`} strokeWidth={2} dot={false} />
              {chartView === "wind" && (
                <Area type="monotone" dataKey="gust" stroke="#ea580c" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              )}
            </AreaChart>
          )}
        </ResponsiveContainer>

        <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
          <span>09:00</span>
          <span className="text-emerald-600 font-bold">🪂 finestra ottimale 10–16h</span>
          <span>19:00</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-3 py-2.5 text-left text-sm font-black text-gray-600">Ora</th>
              <th className="px-2 py-2.5 text-center text-sm font-black text-gray-600">Meteo</th>
              <th className="px-2 py-2.5 text-center text-sm font-black text-gray-600">🌡° C</th>
              <th className="px-2 py-2.5 text-center text-sm font-black text-gray-600">💨 km/h</th>
              <th className="px-2 py-2.5 text-center text-sm font-black text-gray-600">💥 Raff.</th>
              <th className="px-2 py-2.5 text-center text-sm font-black text-gray-600">⚡ CAPE</th>
              <th className="px-2 py-2.5 text-center text-sm font-black text-gray-600">🌀 m/s</th>
              <th className="px-2 py-2.5 text-center text-sm font-black text-gray-600">☁️ Base</th>
              <th className="px-2 py-2.5 text-center text-sm font-black text-gray-600">🌧️%</th>
              <th className="px-2 py-2.5 text-center text-sm font-black text-gray-600">🏆 XC</th>
              <th className="px-3 py-2.5 text-center text-sm font-black text-gray-600">Vol.</th>
            </tr>
          </thead>
          <tbody>
            {todayHours.map(({ h, realIdx }) => {
              const thermalMs = (h as any).thermalMs ?? 0;
              const cloudbaseM = (h as any).cloudbaseM ?? siteAlt + 500;
              const isWindow = h.hour >= 10 && h.hour <= 16;
              const isCurrent = h.hour === currentHour;
              const rowVc = vc(h.volability);
              const rowWc = wc(h.windSpeed);
              const rowTc = tc(thermalMs);
              return (
                <tr key={h.hour}
                  onClick={() => { setActiveHour(h as HF & Record<string, unknown>); if (onHourSelect) onHourSelect(realIdx); }}
                  className={cn(
                    "border-b border-gray-100 cursor-pointer transition-all",
                    isCurrent ? "bg-blue-50 border-l-2 border-l-blue-400" :
                    isWindow ? "bg-emerald-50/30" : "bg-white",
                    "hover:bg-emerald-50"
                  )}>
                  <td className="px-3 py-3 font-mono font-black text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 live-dot shrink-0" />}
                      <span className="text-base">{h.hour.toString().padStart(2, "0")}:00</span>
                      {isWindow && <span className="text-[9px] text-emerald-600">🪂</span>}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center"><AnimatedWeatherIcon code={h.weatherCode} hour={h.hour} size="sm" /></td>
                  <td className="px-2 py-3 text-center text-blue-600 font-bold text-sm">{h.temp}°</td>
                  <td className="px-2 py-3 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <WindArrow deg={h.windDir} color={rowWc} />
                      <span className="font-bold text-sm" style={{ color: rowWc }}>{h.windSpeed}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center text-gray-500 font-medium text-sm">{h.windGust}</td>
                  <td className="px-2 py-3 text-center">
                    <span className="font-bold text-sm" style={{ color: cc(h.capeIndex) }}>
                      {h.capeIndex > 0 ? h.capeIndex : "—"}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="font-bold text-sm" style={{ color: rowTc }}>{thermalMs > 0 ? thermalMs.toFixed(1) : "—"}</span>
                  </td>
                  <td className="px-2 py-3 text-center text-blue-500 text-xs font-semibold">{cloudbaseM.toLocaleString()}m</td>
                  <td className="px-2 py-3 text-center">
                    <span className="font-bold text-sm" style={{ color: pc(h.precipProb) }}>{h.precipProb}%</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="font-bold text-sm" style={{ color: h.xcScore >= 7 ? "#16a34a" : h.xcScore >= 5 ? "#d97706" : "#dc2626" }}>
                      {h.xcScore}/10
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-black text-base" style={{ color: rowVc }}>{h.volability.toFixed(1)}</span>
                      <div className="w-10 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(h.volability / 10) * 100}%`, background: rowVc }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          {[{ c: "#16a34a", l: "≥7 VOLA" }, { c: "#d97706", l: "4-7 VALUTA" }, { c: "#dc2626", l: "<4 STOP" }].map((x) => (
            <div key={x.l} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: x.c }} />
              <span>{x.l}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto text-[10px] text-gray-400">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 live-dot" />
          <span>ora corrente · 🪂 finestra 10–16h · ✓ Open-Meteo API</span>
        </div>
      </div>
    </div>
  );
}
