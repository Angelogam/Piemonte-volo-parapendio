import { useMemo } from "react";
import { HourlyForecast, WeatherData } from "@/types/weather";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Props {
  data: WeatherData;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs shadow-lg">
      <div className="font-bold text-gray-700 mb-1">{label}:00</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-bold text-gray-900">{typeof p.value === "number" ? p.value.toFixed(1) : p.value} {p.unit ?? ""}</span>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <h4 className="font-black text-gray-900 text-sm">{children}</h4>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function volColor(v: number): string {
  if (v >= 7) return "#16a34a";
  if (v >= 4) return "#d97706";
  return "#dc2626";
}

export default function SoaringChart({ data }: Props) {
  const todayHours = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return data.hourly.filter((h) => {
      const hStr = h.time?.slice(0, 10);
      const hour = h.hour;
      return hStr === today && hour >= 9 && hour <= 18;
    });
  }, [data.hourly]);

  const surfaceData = useMemo(() => todayHours.map((h) => {
    const hh = h as HourlyForecast & Record<string, any>;
    return {
      hour: h.hour,
      temp: h.temp,
      dewpoint: h.dewpoint ?? h.temp - 8,
      windSpeed10m: h.windSpeed,
      windSpeed80m: hh.windSpeed80m ?? Math.round(h.windSpeed * 1.3),
      gust: h.windGust,
      precipProb: h.precipProb,
      cloudCover: h.cloudCover,
    };
  }), [todayHours]);

  const stabilityData = useMemo(() => todayHours.map((h) => {
    const hh = h as HourlyForecast & Record<string, any>;
    const thermalMs = hh.thermalMs ?? 0;
    return {
      hour: h.hour,
      thermalMs: parseFloat(thermalMs.toFixed(1)),
      cape: h.capeIndex,
      blh: h.blh ?? 800,
      volability: h.volability,
      cloudbase: (hh.cloudbaseM ?? h.blh + data.site.altitude) - data.site.altitude,
    };
  }), [todayHours, data.site.altitude]);

  const windData = useMemo(() => todayHours.map((h) => {
    const hh = h as HourlyForecast & Record<string, any>;
    return {
      hour: h.hour,
      sfc: h.windSpeed,
      m80: hh.windSpeed80m ?? Math.round(h.windSpeed * 1.2),
      m120: hh.windSpeed120m ?? Math.round(h.windSpeed * 1.4),
      shear: hh.windShear ?? Math.abs((hh.windSpeed120m ?? h.windSpeed * 1.4) - h.windSpeed),
    };
  }), [todayHours]);

  if (todayHours.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-400 text-sm card-shadow">
        Dati orari non disponibili per oggi
      </div>
    );
  }

  const xFormatter = (v: number) => `${v}h`;
  const gridColor = "#f3f4f6";
  const axisColor = "#9ca3af";

  return (
    <div className="flex flex-col gap-4">

      {/* 1. Surface conditions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 card-shadow">
        <SectionTitle sub="Temperatura · Vento a 10m/80m · Precipitazioni">
          🌡️ Condizioni alla Superficie
        </SectionTitle>

        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">Temperatura & Punto di Rugiada (°C)</div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={surfaceData} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradDew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="hour" tickFormatter={xFormatter} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
              <Area type="monotone" dataKey="temp" name="Temperatura" stroke="#dc2626" fill="url(#gradTemp)" strokeWidth={2} unit="°C" dot={false} />
              <Area type="monotone" dataKey="dewpoint" name="Punto di Rugiada" stroke="#3b82f6" fill="url(#gradDew)" strokeWidth={1.5} strokeDasharray="4 2" unit="°C" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">Vento a 10m, 80m e Raffiche (km/h)</div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={surfaceData} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="hour" tickFormatter={xFormatter} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
              <ReferenceLine y={25} stroke="#dc2626" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Line type="monotone" dataKey="windSpeed10m" name="Vento 10m" stroke="#3b82f6" strokeWidth={2} unit="km/h" dot={false} />
              <Line type="monotone" dataKey="windSpeed80m" name="Vento 80m" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 2" unit="km/h" dot={false} />
              <Line type="monotone" dataKey="gust" name="Raffiche" stroke="#ea580c" strokeWidth={1.5} strokeDasharray="3 3" unit="km/h" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-2">Probabilità Precipitazione (%) & Copertura Nuvolosa</div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={surfaceData} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="hour" tickFormatter={xFormatter} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="precipProb" name="Precipit. %" stroke="#6366f1" fill="#6366f130" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="cloudCover" name="Nuvole %" stroke="#9ca3af" fill="#9ca3af20" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Stability */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 card-shadow">
        <SectionTitle sub="Volabilità oraria · Termiche · BLH · CAPE reale">
          📊 Indici di Stabilità & Volo
        </SectionTitle>

        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">Volabilità ora per ora (0–10)</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={stabilityData} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="hour" tickFormatter={xFormatter} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={7} stroke="#16a34a" strokeDasharray="4 2" strokeOpacity={0.6} />
              <ReferenceLine y={4} stroke="#d97706" strokeDasharray="4 2" strokeOpacity={0.6} />
              <Bar dataKey="volability" name="Volabilità" radius={[3, 3, 0, 0]}
                fill="#16a34a" label={{ position: "top", fontSize: 9, fill: "#6b7280" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">Termiche (m/s) & BLH (m ÷ 10 per scala)</div>
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={stabilityData} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="hour" tickFormatter={xFormatter} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
              <Area type="monotone" dataKey="thermalMs" name="Termiche" stroke="#ea580c" fill="#ea580c20" strokeWidth={2} unit="m/s" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">CAPE (J/kg) — energia convettiva reale</div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={stabilityData} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="hour" tickFormatter={xFormatter} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={500} stroke="#dc2626" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Area type="monotone" dataKey="cape" name="CAPE" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={2} unit="J/kg" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                {["Ora", "Vol.", "Termiche", "BLH (m)", "CAPE", "Base ☁️ AGL", "Giudizio"].map((col) => (
                  <th key={col} className="px-2 py-2 text-left text-[10px] font-black text-gray-500">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stabilityData.map((row, i) => {
                const vc = volColor(row.volability);
                const isWindow = row.hour >= 10 && row.hour <= 16;
                return (
                  <tr key={i} className={`border-b border-gray-100 ${isWindow ? "bg-emerald-50/50" : "bg-white"}`}>
                    <td className="px-2 py-2 font-mono font-bold text-gray-800">
                      {row.hour.toString().padStart(2, "0")}:00
                      {isWindow && <span className="ml-1 text-emerald-600">🪂</span>}
                    </td>
                    <td className="px-2 py-2 font-bold" style={{ color: vc }}>{row.volability.toFixed(1)}</td>
                    <td className="px-2 py-2" style={{ color: row.thermalMs > 2 ? "#d97706" : row.thermalMs > 1 ? "#16a34a" : "#9ca3af" }}>
                      {row.thermalMs.toFixed(1)} m/s
                    </td>
                    <td className="px-2 py-2 text-gray-600">{row.blh.toLocaleString()}</td>
                    <td className="px-2 py-2" style={{ color: row.cape > 700 ? "#dc2626" : row.cape > 300 ? "#ea580c" : "#9ca3af" }}>{row.cape}</td>
                    <td className="px-2 py-2 text-blue-500">+{row.cloudbase.toLocaleString()}m</td>
                    <td className="px-2 py-2 font-bold" style={{ color: vc }}>
                      {row.volability >= 7 ? "🪂 VOLA" : row.volability >= 4 ? "⚠️ VALUTA" : "🚫 STOP"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Wind in quota */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 card-shadow">
        <SectionTitle sub="Vento superficiale, 80m, 120m e gradiente verticale">
          💨 Vento in Quota & Gradiente Verticale
        </SectionTitle>

        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={windData} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="hour" tickFormatter={xFormatter} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
            <ReferenceLine y={25} stroke="#dc2626" strokeDasharray="4 2" strokeOpacity={0.4} />
            <Line type="monotone" dataKey="sfc" name="10m" stroke="#3b82f6" strokeWidth={2} unit="km/h" dot={false} />
            <Line type="monotone" dataKey="m80" name="80m" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 2" unit="km/h" dot={false} />
            <Line type="monotone" dataKey="m120" name="120m" stroke="#ec4899" strokeWidth={1.5} strokeDasharray="3 3" unit="km/h" dot={false} />
            <Line type="monotone" dataKey="shear" name="Shear" stroke="#dc2626" strokeWidth={1.5} strokeDasharray="2 4" unit="km/h" dot={false} />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          {[
            { color: "#16a34a", label: "Shear < 5: Termiche ottimali" },
            { color: "#d97706", label: "Shear 5-10: Termiche perturbate" },
            { color: "#ea580c", label: "Shear 10-20: Termiche difficili" },
            { color: "#dc2626", label: "Shear > 20: Pericoloso" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-[10px] text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
