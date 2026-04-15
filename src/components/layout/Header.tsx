import { useEffect, useState } from "react";

export default function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = time.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = time.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="max-w-[1680px] mx-auto px-3 sm:px-4 lg:px-5 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg font-black shadow-sm">
            🪂
          </div>
          <div>
            <div className="font-black text-gray-900 text-base leading-tight">MeteoVolo Piemonte</div>
            <div className="text-[10px] text-gray-400 leading-tight">24 decolli · Dati reali Open-Meteo</div>
          </div>
        </div>

        {/* Center badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
          <span className="text-xs font-bold text-emerald-700">LIVE — Dati Open-Meteo API</span>
        </div>

        {/* Clock */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="font-black text-gray-900 text-sm font-mono">{timeStr}</div>
            <div className="text-[10px] text-gray-400">{dateStr}</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 live-dot sm:hidden" />
        </div>
      </div>
    </header>
  );
}
