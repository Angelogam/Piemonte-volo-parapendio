import { WindgramRow } from "@/types/weather";
import { cn } from "@/lib/utils";

interface Props {
  windgram: WindgramRow[];
  siteAlt: number;
}

function windColor(speed: number): string {
  if (speed <= 5) return "#4ade80";
  if (speed <= 10) return "#86efac";
  if (speed <= 15) return "#fde68a";
  if (speed <= 20) return "#fbbf24";
  if (speed <= 25) return "#fb923c";
  if (speed <= 30) return "#ef4444";
  if (speed <= 40) return "#dc2626";
  return "#991b1b";
}

function windBg(speed: number): string {
  if (speed <= 5) return "rgba(74,222,128,0.15)";
  if (speed <= 10) return "rgba(134,239,172,0.18)";
  if (speed <= 15) return "rgba(253,230,138,0.2)";
  if (speed <= 20) return "rgba(251,191,36,0.22)";
  if (speed <= 25) return "rgba(251,146,60,0.25)";
  if (speed <= 30) return "rgba(239,68,68,0.25)";
  if (speed <= 40) return "rgba(220,38,38,0.3)";
  return "rgba(153,27,27,0.4)";
}

function WindArrow({ deg, color }: { deg: number; color: string }) {
  const rotation = (deg + 180) % 360;
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: `rotate(${rotation}deg)` }}>
      <polygon points="7,1 9.5,11 7,9 4.5,11" fill={color} />
    </svg>
  );
}

const LEGEND = [
  { label: "0–5", color: "#4ade80" },
  { label: "6–10", color: "#86efac" },
  { label: "11–15", color: "#fde68a" },
  { label: "16–20", color: "#fbbf24" },
  { label: "21–25", color: "#fb923c" },
  { label: "26–30", color: "#ef4444" },
  { label: "31–40", color: "#dc2626" },
  { label: ">40", color: "#991b1b" },
];

export default function WindgramChart({ windgram, siteAlt }: Props) {
  const rowsReversed = [...windgram].reverse();
  const hours = windgram[0]?.hours ?? [];

  return (
    <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">📊</span>
        <div>
          <div className="font-bold text-white text-sm">Windgram — Vento per Quota</div>
          <div className="text-xs text-[hsl(215_14%_50%)]">Intensità e direzione · km/h · tocca per dettaglio</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[hsl(220_16%_18%)]">
              <th className="text-left px-2 py-2 text-[hsl(215_14%_50%)] font-medium">Quota (m)</th>
              {hours.map((h) => (
                <th key={h.hour} className="px-2 py-2 text-[hsl(215_14%_50%)] font-medium text-center">
                  {h.hour.toString().padStart(2, "0")}h
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsReversed.map((row) => (
              <tr key={row.altitudeM} className="border-b border-[hsl(220_16%_15%/0.5)]">
                <td className="px-2 py-2 font-mono text-[hsl(215_14%_60%)] whitespace-nowrap">
                  <span className="font-bold">{row.altitudeM.toLocaleString()}</span>
                  {row.altitudeM === siteAlt && <span className="ml-1">⛰️</span>}
                </td>
                {row.hours.map((h, ci) => (
                  <td key={ci} className="px-1 py-1 text-center">
                    <div className="rounded-lg px-2 py-1.5 flex flex-col items-center gap-0.5 min-w-[44px]"
                      style={{ background: windBg(h.speedKmh) }}>
                      <span className="font-black font-mono" style={{ color: windColor(h.speedKmh) }}>{h.speedKmh}</span>
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
      <div className="flex flex-wrap items-center gap-2 mt-4 text-[10px] text-[hsl(215_14%_50%)]">
        <span>km/h:</span>
        {LEGEND.map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ background: l.color }} />
            <span>{l.label}</span>
          </div>
        ))}
        <span>▲ dir.</span>
      </div>
    </div>
  );
}
