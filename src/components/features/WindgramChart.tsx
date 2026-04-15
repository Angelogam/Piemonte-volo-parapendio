import { WindgramRow } from "@/types/weather";
import { cn } from "@/lib/utils";

interface Props {
  windgram: WindgramRow[];
  siteAlt: number;
}

function windColor(speed: number): string {
  if (speed <= 5) return "#16a34a";
  if (speed <= 10) return "#65a30d";
  if (speed <= 15) return "#d97706";
  if (speed <= 20) return "#ea580c";
  if (speed <= 25) return "#dc2626";
  if (speed <= 35) return "#b91c1c";
  return "#7f1d1d";
}

function windBg(speed: number): string {
  if (speed <= 5) return "rgba(22,163,74,0.08)";
  if (speed <= 10) return "rgba(101,163,13,0.08)";
  if (speed <= 15) return "rgba(217,119,6,0.10)";
  if (speed <= 20) return "rgba(234,88,12,0.12)";
  if (speed <= 25) return "rgba(220,38,38,0.12)";
  if (speed <= 35) return "rgba(185,28,28,0.15)";
  return "rgba(127,29,29,0.2)";
}

function WindArrow({ deg, color }: { deg: number; color: string }) {
  const rotation = (deg + 180) % 360;
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: `rotate(${rotation}deg)`, display: "inline-block" }}>
      <polygon points="5,1 7,9 5,7 3,9" fill={color} />
    </svg>
  );
}

const LEGEND = [
  { label: "0–5", color: "#16a34a" },
  { label: "6–10", color: "#65a30d" },
  { label: "11–15", color: "#d97706" },
  { label: "16–20", color: "#ea580c" },
  { label: "21–25", color: "#dc2626" },
  { label: "26–35", color: "#b91c1c" },
  { label: ">35", color: "#7f1d1d" },
];

export default function WindgramChart({ windgram, siteAlt }: Props) {
  const rowsReversed = [...windgram].reverse();
  const hours = windgram[0]?.hours ?? [];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden card-shadow-lg">
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-gray-100">
        <h3 className="font-black text-gray-900 text-base">📊 Windgram — Vento per Quota</h3>
        <p className="text-xs text-gray-500 mt-0.5">Intensità e direzione in km/h · Dati orari Open-Meteo</p>
      </div>

      <div className="overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="px-3 py-2 text-left text-xs font-black text-gray-600 bg-gray-50">Quota (m)</th>
              {hours.map((h) => (
                <th key={h.hour} className="px-2 py-2 text-center text-xs font-black text-gray-600 bg-gray-50">
                  {h.hour.toString().padStart(2, "0")}h
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsReversed.map((row) => (
              <tr key={row.altitudeM} className="border-b border-gray-100">
                <td className="px-3 py-2.5 font-mono font-bold text-gray-700 bg-gray-50 whitespace-nowrap">
                  {row.altitudeM.toLocaleString()}m
                  {row.altitudeM === siteAlt && <span className="ml-1 text-[10px] text-emerald-600">⛰️ decollo</span>}
                </td>
                {row.hours.map((h, ci) => (
                  <td key={ci} className="px-1 py-1.5 text-center" style={{ background: windBg(h.speedKmh) }}>
                    <div className="flex items-center justify-center gap-0.5">
                      <span className="font-black text-sm" style={{ color: windColor(h.speedKmh) }}>{h.speedKmh}</span>
                      <WindArrow deg={h.dirDeg} color={windColor(h.speedKmh)} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4 flex items-center flex-wrap gap-1.5">
        <span className="text-[10px] font-bold text-gray-400 mr-1">km/h:</span>
        {LEGEND.map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
            <span className="text-[10px] text-gray-500">{l.label}</span>
          </div>
        ))}
        <span className="ml-2 text-[10px] text-gray-400">▲ direzione vento</span>
      </div>
    </div>
  );
}
