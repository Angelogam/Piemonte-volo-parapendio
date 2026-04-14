import { SunTimes } from "@/types/weather";

interface Props {
  sun: SunTimes;
  siteName: string;
}

export default function SunBar({ sun, siteName }: Props) {
  const progress = sun.progressPercent;
  const isDay = progress > 0 && progress < 100;
  const isDusk = progress >= 85;
  const isDawn = progress <= 15 && progress > 0;

  return (
    <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl px-4 py-3.5">
      <div className="flex items-center gap-3 mb-2.5">
        {/* Alba */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[hsl(43_100%_52%/0.1)] border border-[hsl(43_100%_52%/0.25)] flex items-center justify-center text-base">
            🌅
          </div>
          <div>
            <div className="text-[10px] text-[hsl(215_14%_50%)]">Alba</div>
            <div className="text-sm font-black text-[hsl(43_100%_68%)]">{sun.sunrise}</div>
          </div>
        </div>

        {/* Center info */}
        <div className="flex-1 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2">
            {isDay ? (
              <span className="text-base anim-sun">☀️</span>
            ) : (
              <span className="text-base anim-cloud">🌙</span>
            )}
            <span className="text-xs font-bold text-white">
              {isDay ? "Diurno" : "Notturno"}
            </span>
            <span className="text-xs text-[hsl(215_14%_50%)]">·</span>
            <span className="text-xs text-[hsl(215_20%_70%)]">{sun.daylightHours}h luce</span>
          </div>
          <div className="text-[10px] text-[hsl(215_14%_45%)]">📍 {siteName}</div>
        </div>

        {/* Tramonto */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-[hsl(215_14%_50%)]">Tramonto</div>
            <div className="text-sm font-black text-[hsl(25_90%_62%)]">{sun.sunset}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[hsl(25_90%_55%/0.1)] border border-[hsl(25_90%_55%/0.25)] flex items-center justify-center text-base">
            🌇
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-[hsl(220_16%_16%)] rounded-full overflow-hidden">
        {/* Time zones */}
        <div className="absolute inset-0 flex">
          <div className="w-[20%]" style={{ background: "linear-gradient(to right, hsl(220 40% 12%), hsl(43 100% 52% / 0.15))" }} />
          <div className="flex-1" style={{ background: "hsl(43 100% 52% / 0.08)" }} />
          <div className="w-[20%]" style={{ background: "linear-gradient(to left, hsl(220 40% 12%), hsl(25 90% 55% / 0.15))" }} />
        </div>
        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
          style={{
            width: `${Math.max(2, progress)}%`,
            background: isDusk
              ? "linear-gradient(to right, hsl(43 100% 52%), hsl(25 90% 55%), hsl(0 70% 45%))"
              : isDawn
              ? "linear-gradient(to right, hsl(220 60% 35%), hsl(43 100% 52%))"
              : "linear-gradient(to right, hsl(43 100% 52%), hsl(30 95% 55%))"
          }}
        />
        {/* Sun indicator */}
        {isDay && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/40 -translate-x-1/2 transition-all duration-1000"
            style={{
              left: `${Math.max(2, Math.min(98, progress))}%`,
              background: "radial-gradient(circle, #fde68a, #f59e0b)",
              boxShadow: "0 0 6px #f59e0b80"
            }}
          />
        )}
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-[9px] text-[hsl(215_14%_40%)] mt-1">
        <span>{sun.sunrise}</span>
        <span>{progress}% giornata trascorsa</span>
        <span>{sun.sunset}</span>
      </div>
    </div>
  );
}
