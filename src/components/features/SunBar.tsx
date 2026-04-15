import { SunTimes } from "@/types/weather";

interface Props {
  sun: SunTimes;
  siteName: string;
}

export default function SunBar({ sun, siteName }: Props) {
  const progress = sun.progressPercent;
  const isDay = progress > 0 && progress < 100;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 card-shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-sm">🌅</div>
          <div>
            <div className="text-[10px] text-gray-400">Alba</div>
            <div className="text-sm font-black text-amber-600">{sun.sunrise}</div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <span>{isDay ? "☀️" : "🌙"}</span>
            <span>{sun.daylightHours}h di luce</span>
            <span className="text-gray-400">· 📍 {siteName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-gray-400">Tramonto</div>
            <div className="text-sm font-black text-orange-600">{sun.sunset}</div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center text-sm">🌇</div>
        </div>
      </div>

      <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, #fef3c7 0%, #fde68a 30%, #fbbf24 50%, #f59e0b 70%, #d97706 85%, #b45309 100%)" }}
        />
        <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 bg-gray-200/50"
          style={{ left: `${Math.max(2, Math.min(98, progress))}%`, width: "100%" }}
        />
        {isDay && (
          <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full -translate-x-1/2 transition-all duration-1000"
            style={{ left: `${Math.max(2, Math.min(98, progress))}%`, background: "#fbbf24", boxShadow: "0 0 8px #fbbf2480", border: "2px solid white" }}
          />
        )}
      </div>

      <div className="flex justify-between text-[9px] text-gray-400 mt-1">
        <span>{sun.sunrise}</span>
        <span>{progress}% giornata trascorsa</span>
        <span>{sun.sunset}</span>
      </div>
    </div>
  );
}
