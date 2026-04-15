import { WeatherData } from "@/types/weather";

interface Props {
  data: WeatherData;
}

export default function BriefingCard({ data }: Props) {
  const vol = data.volability;
  const cloudbaseAbove = data.currentCloudbaseM - data.site.altitude;
  const ceilingAbove = data.currentCeiling - data.site.altitude;

  const windStatus = data.currentWind > 30
    ? { label: "Forte ⚠️", color: "#dc2626" }
    : data.currentWind > 18
    ? { label: "Moderato", color: "#d97706" }
    : { label: "Leggero ✓", color: "#16a34a" };

  const thermalStatus = data.currentThermalMs > 3.5
    ? { label: "Forti 🚀", color: "#ea580c" }
    : data.currentThermalMs > 2.0
    ? { label: "Ottime", color: "#d97706" }
    : data.currentThermalMs > 1.0
    ? { label: "Buone", color: "#16a34a" }
    : data.currentThermalMs > 0.5
    ? { label: "Deboli", color: "#3b82f6" }
    : { label: "Assenti", color: "#9ca3af" };

  const xcStatus = data.xcScore >= 7
    ? { label: "Eccellente", color: "#16a34a" }
    : data.xcScore >= 5
    ? { label: "Buono", color: "#d97706" }
    : data.xcScore >= 3
    ? { label: "Limitato", color: "#ea580c" }
    : { label: "Sconsigliato", color: "#dc2626" };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 card-shadow-lg flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xl shrink-0">🪂</div>
        <div>
          <h3 className="font-black text-gray-900 text-base">Briefing di Volo</h3>
          <div className="text-xs text-gray-500 mt-0.5">{data.site.name} · Dati ECMWF Open-Meteo</div>
        </div>
      </div>

      {/* Briefing text */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
        {data.briefingText}
      </div>

      {/* Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Pill icon="💨" label="Vento" value={windStatus.label} color={windStatus.color} />
        <Pill icon="🌀" label="Termiche" value={thermalStatus.label} color={thermalStatus.color} />
        <Pill icon="☁️" label="Base Nuvole" value={`${cloudbaseAbove.toLocaleString()}m AGL`}
          color={cloudbaseAbove > 1000 ? "#16a34a" : cloudbaseAbove > 500 ? "#d97706" : "#dc2626"} />
        <Pill icon="🚀" label="Soffitto" value={`${ceilingAbove.toLocaleString()}m AGL`}
          color={ceilingAbove > 800 ? "#16a34a" : "#d97706"} />
      </div>

      {/* XC route */}
      {data.xcRoute && data.xcScore >= 4 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🏆</span>
          <div className="flex-1">
            <div className="text-xs font-bold text-amber-700">XC Route Consigliata</div>
            <div className="font-bold text-sm text-amber-900 mt-0.5">{data.xcRoute}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">Distanza tipica: {data.site.xcKm} km · Finestra: 10:00–16:00</div>
          </div>
          <div className="shrink-0">
            <div className="text-[10px] text-gray-500">XC Score</div>
            <div className="font-black text-xl" style={{ color: xcStatus.color }}>{data.xcScore}/10</div>
            <div className="text-[10px] font-bold" style={{ color: xcStatus.color }}>{xcStatus.label}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
      <div className="text-base mb-1">{icon}</div>
      <div className="text-[10px] text-gray-500 font-medium">{label}</div>
      <div className="font-black text-sm" style={{ color }}>{value}</div>
    </div>
  );
}
