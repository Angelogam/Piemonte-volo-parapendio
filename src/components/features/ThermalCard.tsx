import { WeatherData } from "@/types/weather";
import { cn } from "@/lib/utils";

interface Props {
  data: WeatherData;
}

const turbStyle = {
  LOW: { ring: "border-emerald-200 bg-emerald-50", text: "text-emerald-600", bar: "#16a34a", label: "Bassa", desc: "Aria regolare — nessuna turbolenza significativa", emoji: "😊" },
  MOD: { ring: "border-amber-200 bg-amber-50", text: "text-amber-600", bar: "#d97706", label: "Moderata", desc: "Possibili scossoni in termica — attenzione", emoji: "😐" },
  SEV: { ring: "border-red-200 bg-red-50", text: "text-red-600", bar: "#dc2626", label: "Severa", desc: "Turbolenza pericolosa — valutare il decollo", emoji: "😱" },
};

function InfoPill({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm">
      <span className="text-base shrink-0">{icon}</span>
      <div>
        <div className="text-[10px] text-gray-400 font-medium">{label}</div>
        <div className="font-bold" style={{ color }}>{value}</div>
        <div className="text-[10px] text-gray-400">{sub}</div>
      </div>
    </div>
  );
}

export default function ThermalCard({ data }: Props) {
  const turb = turbStyle[data.turbulence];
  const capeBarColor = data.currentCape > 700 ? "#dc2626" : data.currentCape > 300 ? "#ea580c" : "#16a34a";
  const liColor = data.currentLiftedIndex < -3 ? "#dc2626" : data.currentLiftedIndex < -1 ? "#d97706" : data.currentLiftedIndex < 1 ? "#16a34a" : "#9ca3af";
  const liDesc = data.currentLiftedIndex < -3 ? "Molto instabile ⚠️" : data.currentLiftedIndex < -1 ? "Instabile — buone termiche" : data.currentLiftedIndex < 1 ? "Leggermente instabile" : data.currentLiftedIndex < 3 ? "Stabile" : "Molto stabile";
  const ceilingAboveSite = data.currentCeiling - data.site.altitude;
  const tcol = (t: number) => t >= 3 ? "#ea580c" : t >= 2 ? "#d97706" : t >= 1 ? "#16a34a" : t >= 0.5 ? "#65a30d" : "#9ca3af";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 card-shadow-lg flex flex-col gap-4">
      <h3 className="font-black text-gray-900 text-base">🌀 Analisi Termica & Stabilità</h3>

      {/* Top info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <InfoPill icon="🚀" label="Soffitto Termico" value={`${data.currentCeiling.toLocaleString()}m`}
          sub={`+${ceilingAboveSite.toLocaleString()}m sopra`}
          color={ceilingAboveSite > 1200 ? "#16a34a" : ceilingAboveSite > 700 ? "#d97706" : "#dc2626"} />
        <InfoPill icon="☁️" label="Base Nuvole" value={`${data.currentCloudbaseM.toLocaleString()}m`}
          sub={`+${(data.currentCloudbaseM - data.site.altitude).toLocaleString()}m`}
          color={data.currentCloudbaseM - data.site.altitude > 800 ? "#16a34a" : "#d97706"} />
        <InfoPill icon="🌀" label="Vel. Termiche" value={`${data.currentThermalMs.toFixed(1)} m/s`}
          sub={data.currentThermalMs > 2 ? "Buone per XC" : data.currentThermalMs > 1 ? "Moderate" : "Deboli/Assenti"}
          color={tcol(data.currentThermalMs)} />
        <InfoPill icon="🌪️" label="Wind Shear" value={`${data.currentWindShear} km/h`}
          sub={data.currentWindShear > 20 ? "Forte ⚠️" : "Regolare"}
          color={data.currentWindShear > 20 ? "#d97706" : "#16a34a"} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Colonna termica visual */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="font-bold text-gray-800 text-sm mb-1">🌡️ Colonna Termica</div>
          <div className="text-xs text-gray-500 mb-3">BLH e base nuvole rispetto al sito</div>

          <div className="relative h-52 flex">
            <div className="flex flex-col justify-between text-[10px] text-gray-400 font-mono pr-2 py-1">
              {[4000, 3000, 2000, 1000, 0].map((alt) => <div key={alt}>{alt > 0 ? `${alt}m` : "↓"}</div>)}
            </div>
            <div className="flex-1 relative rounded-lg overflow-hidden border border-gray-200">
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #dbeafe 0%, #eff6ff 50%, #f0f9ff 100%)" }} />
              <div className="absolute left-0 right-0 bg-emerald-500/10 border-t border-dashed border-emerald-400"
                style={{ top: `${Math.max(5, 100 - (data.currentCeiling / 4000) * 100)}%`, bottom: `${(data.site.altitude / 4000) * 100}%` }}>
                <div className="absolute -top-4 left-1 text-[10px] text-emerald-600 font-bold">☁️ {data.currentCeiling.toLocaleString()}m</div>
              </div>
              <div className="absolute left-0 right-0 border-t border-dashed border-blue-400"
                style={{ top: `${Math.max(5, 100 - (data.currentCloudbaseM / 4000) * 100)}%` }}>
                <div className="absolute -top-4 left-1 text-[10px] text-blue-600 font-bold">🌫️ {data.currentCloudbaseM.toLocaleString()}m</div>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 flex gap-1"
                style={{ bottom: `${(data.site.altitude / 4000) * 100 + 5}%` }}>
                {[...Array(Math.min(data.thermalStrength + 1, 4))].map((_, i) => (
                  <span key={i} className="text-emerald-500 font-bold text-sm">↑</span>
                ))}
              </div>
              <div className="absolute left-0 right-0 border-t-2 border-gray-400 bg-gray-100"
                style={{ bottom: 0, height: `${(data.site.altitude / 4000) * 100}%` }}>
                <div className="text-[10px] text-gray-500 px-1 pt-0.5">⛰️ {data.site.altitude}m</div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-1">
            {[
              { icon: "🚀", label: "Soffitto", value: `${data.currentCeiling.toLocaleString()} m` },
              { icon: "☁️", label: "Base nuvole", value: `${data.currentCloudbaseM.toLocaleString()} m` },
              { icon: "📏", label: "Escursione volo", value: `${ceilingAboveSite.toLocaleString()} m sopra` },
              { icon: "🌡️", label: "BLH", value: `${data.currentBlh.toLocaleString()} m AGL` },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-gray-500"><span>{r.icon}</span><span>{r.label}</span></div>
                <span className="font-bold text-gray-800">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CAPE + LI */}
        <div className="flex flex-col gap-3">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-gray-800 text-sm">🌀 Ascendenze & Stabilità</div>
              <span className="text-[10px] text-gray-400">ECMWF</span>
            </div>

            <div className="text-center py-2">
              <div className="text-xs text-gray-400">Velocità ascendenza</div>
              <div className="text-4xl font-black leading-none mt-1" style={{ color: tcol(data.currentThermalMs) }}>
                {data.currentThermalMs.toFixed(1)}
              </div>
              <div className="text-sm text-gray-400">m/s</div>
              <div className="text-xs font-bold mt-1" style={{ color: tcol(data.currentThermalMs) }}>
                {data.currentThermalMs >= 3 ? "Forti — ottimo per XC" : data.currentThermalMs >= 2 ? "Buone" : data.currentThermalMs >= 1 ? "Moderate" : "Deboli/Assenti"}
              </div>
            </div>

            {/* CAPE */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">⚡ CAPE</span>
                <span className="text-xs font-black" style={{ color: capeBarColor }}>{data.currentCape} J/kg</span>
              </div>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (data.currentCape / 1000) * 100)}%`, background: capeBarColor }} />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                <span>0</span><span>300</span><span>700+ ⚠️</span>
              </div>
              <div className="text-xs font-bold mt-1" style={{ color: capeBarColor }}>
                {data.currentCape > 800 ? "⚠️ Pericoloso — rischio CuNb" : data.currentCape > 500 ? "Forte — sviluppi possibili" : data.currentCape > 200 ? "Buono per XC" : data.currentCape > 50 ? "Moderato" : "Stabile — termiche deboli"}
              </div>
            </div>

            {/* LI */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">📊 Lifted Index</span>
                <span className="text-xs font-black" style={{ color: liColor }}>{data.currentLiftedIndex}</span>
              </div>
              <div className="text-xs font-bold" style={{ color: liColor }}>{liDesc}</div>
            </div>
          </div>
        </div>

        {/* Turbulence */}
        <div className={cn("border rounded-xl p-4 flex flex-col gap-3", turb.ring)}>
          <div>
            <div className="font-bold text-gray-800 text-sm mb-1">💥 Turbolenza</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{turb.emoji}</span>
              <div>
                <div className={cn("font-black text-lg", turb.text)}>{turb.label}</div>
                <div className="text-xs text-gray-500">{turb.desc}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Indice turbolenza</span>
              <span className="font-black" style={{ color: turb.bar }}>{data.turbulenceScore}/10</span>
            </div>
            <div className="flex gap-0.5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex-1 h-2.5 rounded-sm"
                  style={{ background: i < data.turbulenceScore ? turb.bar : "#e5e7eb" }} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {[
              { label: "Vento sup.", value: data.currentWind, max: 60, danger: 30 },
              { label: "Raffiche", value: data.currentGust, max: 60, danger: 35 },
              { label: "Wind shear", value: data.currentWindShear, max: 50, danger: 25 },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-20 shrink-0">{b.label}</span>
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{ width: `${Math.min(100, (b.value / b.max) * 100)}%`, background: b.value >= b.danger ? "#dc2626" : turb.bar }} />
                </div>
                <span className="text-[10px] font-bold w-14 text-right"
                  style={{ color: b.value >= b.danger ? "#dc2626" : turb.bar }}>
                  {b.value} km/h
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: "☁️", label: "Cloudbase", value: `${data.currentCloudbaseM.toLocaleString()} m`, sub: `+${(data.currentCloudbaseM - data.site.altitude).toLocaleString()} m sopra decollo`, good: data.currentCloudbaseM > data.site.altitude + 800 },
          { icon: "🌡️", label: "Temp + Rugiada", value: `${data.currentTemp}°C`, sub: `DP: ${data.currentDewpoint.toFixed(0)}°C · spread ${(data.currentTemp - data.currentDewpoint).toFixed(1)}°C`, good: true },
          { icon: "👁️", label: "Visibilità", value: `${data.currentVisibility} km`, sub: data.currentVisibility > 10 ? "Eccellente" : data.currentVisibility > 5 ? "Buona" : "Ridotta ⚠️", good: data.currentVisibility > 5 },
          { icon: "💧", label: "Nuvole", value: `${data.currentCloudCover}%`, sub: data.currentCloudCover > 70 ? "Molto nuvoloso" : data.currentCloudCover > 40 ? "Parzialmente" : "Poco nuvoloso", good: data.currentCloudCover < 70 },
        ].map((item) => (
          <div key={item.label} className={cn("rounded-xl p-3 border",
            item.good ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
          )}>
            <div className="text-lg mb-0.5">{item.icon}</div>
            <div className="text-[10px] text-gray-500">{item.label}</div>
            <div className="font-bold text-gray-900 text-sm mt-0.5">{item.value}</div>
            <div className="text-[10px] text-gray-400">{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
