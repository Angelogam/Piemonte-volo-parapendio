import { WeatherData } from "@/types/weather";

interface Props {
  data: WeatherData;
}

function Pill({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[hsl(220_20%_9%)] border border-[hsl(220_16%_18%)] rounded-xl text-sm">
      <span>{icon}</span>
      <span className="text-xs text-[hsl(215_14%_50%)]">{label}:</span>
      <span className="font-bold text-sm" style={{ color }}>{value}</span>
    </div>
  );
}

export default function BriefingCard({ data }: Props) {
  const vol = data.volability;
  const cloudbaseAbove = data.currentCloudbaseM - data.site.altitude;
  const ceilingAbove = data.currentCeiling - data.site.altitude;

  const windStatus = data.currentWind > 30
    ? { label: "Forte ⚠️", color: "hsl(0 90% 65%)" }
    : data.currentWind > 18
    ? { label: "Moderato", color: "hsl(43 100% 65%)" }
    : { label: "Leggero ✓", color: "hsl(142 76% 65%)" };

  const thermalStatus = data.currentThermalMs > 3.5
    ? { label: "Forti 🚀", color: "hsl(25 90% 62%)" }
    : data.currentThermalMs > 2.0
    ? { label: "Ottime", color: "hsl(43 100% 65%)" }
    : data.currentThermalMs > 1.0
    ? { label: "Buone", color: "hsl(142 76% 65%)" }
    : data.currentThermalMs > 0.5
    ? { label: "Deboli", color: "hsl(205 80% 65%)" }
    : { label: "Assenti", color: "hsl(215 14% 65%)" };

  const xcStatus = data.xcScore >= 7
    ? { label: "Eccellente", color: "hsl(142 76% 65%)" }
    : data.xcScore >= 5
    ? { label: "Buono", color: "hsl(43 100% 65%)" }
    : data.xcScore >= 3
    ? { label: "Limitato", color: "hsl(25 90% 60%)" }
    : { label: "Sconsigliato", color: "hsl(0 90% 65%)" };

  return (
    <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[hsl(142_76%_45%/0.1)] border border-[hsl(142_76%_45%/0.3)] flex items-center justify-center text-xl">
          🪂
        </div>
        <div>
          <div className="font-bold text-white">Briefing di Volo</div>
          <div className="text-xs text-[hsl(215_14%_50%)]">{data.site.name} · Dati ICON-EU</div>
        </div>
      </div>

      {/* Briefing text */}
      <p className="text-sm text-[hsl(215_20%_75%)] leading-relaxed bg-[hsl(220_20%_9%)] rounded-xl p-3 border border-[hsl(220_16%_18%)]">
        {data.briefingText}
      </p>

      {/* Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Pill icon="💨" label="Vento" value={windStatus.label} color={windStatus.color} />
        <Pill icon="🌀" label="Termiche" value={thermalStatus.label} color={thermalStatus.color} />
        <Pill icon="🏆" label="XC" value={xcStatus.label} color={xcStatus.color} />
        <Pill icon="☁️" label="Base" value={`+${cloudbaseAbove > 0 ? cloudbaseAbove.toLocaleString() : "—"}m`}
          color={cloudbaseAbove > 800 ? "hsl(142 76% 65%)" : "hsl(43 100% 65%)"} />
        <Pill icon="🚀" label="Soffitto" value={`+${ceilingAbove > 0 ? ceilingAbove.toLocaleString() : "—"}m`}
          color={ceilingAbove > 1000 ? "hsl(142 76% 65%)" : "hsl(43 100% 65%)"} />
      </div>

      {/* XC route */}
      {data.xcRoute && data.xcScore >= 4 && (
        <div className="flex items-start gap-3 px-3 py-2.5 bg-[hsl(43_100%_52%/0.07)] border border-[hsl(43_100%_52%/0.25)] rounded-xl">
          <span className="text-lg">🏆</span>
          <div>
            <div className="text-xs font-bold text-[hsl(43_100%_65%)]">XC Route Consigliata</div>
            <div className="text-sm text-white font-medium">{data.xcRoute}</div>
            <div className="text-xs text-[hsl(215_14%_50%)] mt-0.5">
              Distanza tipica: {data.site.xcKm} km · Finestra: 11:00–16:00
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
