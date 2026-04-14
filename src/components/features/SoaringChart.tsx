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
    <div className="bg-[hsl(220_23%_10%)] border border-[hsl(220_16%_25%)] rounded-xl px-3 py-2 text-xs shadow-xl">
      <div className="font-bold text-[hsl(215_20%_80%)] mb-1">{label}:00</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[hsl(215_14%_55%)]">{p.name}:</span>
          <span className="font-bold text-white">{typeof p.value === "number" ? p.value.toFixed(1) : p.value} {p.unit ?? ""}</span>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-bold text-white text-sm">{children}</h3>
        {sub && <p className="text-xs text-[hsl(215_14%_50%)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function volColor(v: number): string {
  if (v >= 7) return "hsl(142 76% 50%)";
  if (v >= 4) return "hsl(43 100% 52%)";
  return "hsl(0 90% 55%)";
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
      <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl p-6 text-center text-[hsl(215_14%_50%)] text-sm">
        Dati orari non disponibili per oggi
      </div>
    );
  }

  const xFormatter = (v: number) => `${v}h`;

  return (
    <div className="flex flex-col gap-4">
      {/* Surface conditions */}
      <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl p-4 sm:p-5">
        <SectionTitle sub="Temperatura · Punto di rugiada · Precipitazioni · Vento a 10m e 80m">
          🌡️ Condizioni alla Superficie
        </SectionTitle>

        <div className="mb-4">
          <div className="text-xs text-[hsl(215_14%_50%)] mb-2">Temperatura & Punto di Rugiada (°C)</div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={surfaceData} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 80% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0 80% 60%)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradDew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(200 80% 55%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(200 80% 55%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 18%)" />
              <XAxis dataKey="hour" tickFormatter={xFormatter} tick={{ fill: "hsl(215 14% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 14% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "hsl(215 14% 60%)" }} />
              <Area type="monotone" dataKey="temp" name="Temperatura" stroke="hsl(0 80% 60%)" fill="url(#gradTemp)" strokeWidth={2} unit="°C" dot={false} />
              <Area type="monotone" dataKey="dewpoint" name="Punto di Rugiada" stroke="hsl(200 80% 55%)" fill="url(#gradDew)" strokeWidth={1.5} strokeDasharray="4 2" unit="°C" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4">
          <div className="text-xs text-[hsl(215_14%_50%)] mb-2">Vento a 10m, 80m e Raffiche (km/h)</div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={surfaceData} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 18%)" />
              <XAxis dataKey="hour" tickFormatter={xFormatter} tick={{ fill: "hsl(215 14% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 14% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "hsl(215 14% 60%)" }} />
              <ReferenceLine y={25} stroke="hsl(43 100% 52%)" strokeDasharray="4 2" label={{ value: "25", fill: "hsl(43 100% 52%)", fontSize: 10 }} />
              <Line type="monotone" dataKey="windSpeed10m" name="10m" stroke="hsl(205 90% 60%)" strokeWidth={2} dot={false} unit=" km/h" />
              <Line type="monotone" dataKey="windSpeed80m" name="80m" stroke="hsl(142 76% 50%)" strokeWidth={1.5} dot={false} unit=" km/h" />
              <Line type="monotone" dataKey="gust" name="Raffiche" stroke="hsl(0 80% 60%)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} unit=" km/h" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stability indices */}
      <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl p-4 sm:p-5">
        <SectionTitle sub="Volabilità oraria · Velocità termiche · BLH · CAPE">
          📊 Indici di Stabilità & Volo
        </SectionTitle>

        <div className="mb-4">
          <div className="text-xs text-[hsl(215_14%_50%)] mb-2">Volabilità ora per ora (0–10)</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={stabilityData} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 18%)" />
              <XAxis dataKey="hour" tickFormatter={xFormatter} tick={{ fill: "hsl(215 14% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fill: "hsl(215 14% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={7} stroke="hsl(142 76% 50%)" strokeDasharray="4 2" />
              <ReferenceLine y={4} stroke="hsl(43 100% 52%)" strokeDasharray="4 2" />
              <Bar dataKey="volability" name="Volabilità" radius={[2, 2, 0, 0]}>
                {stabilityData.map((entry, index) => (
                  <rect key={`cell-${index}`} fill={volColor(entry.volability)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4">
          <div className="text-xs text-[hsl(215_14%_50%)] mb-2">Velocità Termiche (m/s) & BLH (m ÷ 100)</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={stabilityData} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 18%)" />
              <XAxis dataKey="hour" tickFormatter={xFormatter} tick={{ fill: "hsl(215 14% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 14% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "hsl(215 14% 60%)" }} />
              <Line type="monotone" dataKey="thermalMs" name="Termiche" stroke="hsl(25 90% 60%)" strokeWidth={2} dot={false} unit=" m/s" />
              <Line type="monotone" dataKey={(d: any) => d.blh / 100} name="BLH/100" stroke="hsl(205 90% 60%)" strokeWidth={1.5} strokeDasharray="3 2" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[hsl(220_16%_18%)]">
                <th className="px-2 py-2 text-left text-[hsl(215_14%_50%)] font-medium">Ora</th>
                <th className="px-2 py-2 text-center text-[hsl(215_14%_50%)] font-medium">Vol.</th>
                <th className="px-2 py-2 text-center text-[hsl(215_14%_50%)] font-medium">Termiche</th>
                <th className="px-2 py-2 text-center text-[hsl(215_14%_50%)] font-medium">BLH (m)</th>
                <th className="px-2 py-2 text-center text-[hsl(215_14%_50%)] font-medium">CAPE</th>
                <th className="px-2 py-2 text-center text-[hsl(215_14%_50%)] font-medium">Giudizio</th>
              </tr>
            </thead>
            <tbody>
              {stabilityData.map((row) => {
                const vc = volColor(row.volability);
                const isWindow = row.hour >= 10 && row.hour <= 16;
                return (
                  <tr key={row.hour} className={`border-b border-[hsl(220_16%_15%/0.5)] ${isWindow ? "bg-[hsl(142_76%_45%/0.04)]" : ""}`}>
                    <td className="px-2 py-2 font-mono font-bold text-white">
                      {row.hour.toString().padStart(2, "0")}:00
                      {isWindow && <span className="ml-1 text-[hsl(142_76%_55%)]">🪂</span>}
                    </td>
                    <td className="px-2 py-2 text-center font-black" style={{ color: vc }}>{row.volability.toFixed(1)}</td>
                    <td className="px-2 py-2 text-center" style={{ color: row.thermalMs > 2 ? "hsl(43 100% 65%)" : row.thermalMs > 1 ? "hsl(142 76% 65%)" : "hsl(215 14% 55%)" }}>
                      {row.thermalMs.toFixed(1)} m/s
                    </td>
                    <td className="px-2 py-2 text-center text-[hsl(215_14%_55%)]">{row.blh.toLocaleString()}</td>
                    <td className="px-2 py-2 text-center" style={{ color: row.cape > 700 ? "hsl(0 90% 65%)" : row.cape > 300 ? "hsl(25 90% 65%)" : "hsl(215 14% 55%)" }}>
                      {row.cape}
                    </td>
                    <td className="px-2 py-2 text-center text-xs">
                      {row.volability >= 7 ? "🪂 VOLA" : row.volability >= 4 ? "⚠️ VALUTA" : "🚫 STOP"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wind in quota */}
      <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl p-4 sm:p-5">
        <SectionTitle sub="Vento superficie vs 80m vs 120m — differenza (shear)">
          💨 Vento in Quota & Gradiente Verticale
        </SectionTitle>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={windData} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 18%)" />
            <XAxis dataKey="hour" tickFormatter={xFormatter} tick={{ fill: "hsl(215 14% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215 14% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "hsl(215 14% 60%)" }} />
            <ReferenceLine y={25} stroke="hsl(43 100% 52%)" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="sfc" name="Sup. 10m" stroke="hsl(205 90% 60%)" strokeWidth={2} dot={false} unit=" km/h" />
            <Line type="monotone" dataKey="m80" name="80m" stroke="hsl(142 76% 50%)" strokeWidth={1.5} dot={false} unit=" km/h" />
            <Line type="monotone" dataKey="m120" name="120m" stroke="hsl(25 90% 60%)" strokeWidth={1.5} dot={false} unit=" km/h" />
            <Line type="monotone" dataKey="shear" name="Shear" stroke="hsl(0 80% 60%)" strokeWidth={1} strokeDasharray="4 2" dot={false} unit=" km/h" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
