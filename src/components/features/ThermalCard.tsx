import { WeatherData } from "@/types/weather";
import { cn } from "@/lib/utils";

interface Props {
  data: WeatherData;
}

const turbStyle = {
  LOW: { ring: "border-[hsl(142_76%_45%/0.4)] bg-[hsl(142_76%_45%/0.06)]", text: "text-[hsl(142_76%_65%)]", bar: "hsl(142 76% 45%)", label: "Bassa", desc: "Aria regolare — nessuna turbolenza significativa", emoji: "😊" },
  MOD: { ring: "border-[hsl(43_100%_52%/0.4)] bg-[hsl(43_100%_52%/0.06)]", text: "text-[hsl(43_100%_65%)]", bar: "hsl(43 100% 52%)", label: "Moderata", desc: "Possibili scossoni in termica — attenzione", emoji: "😐" },
  SEV: { ring: "border-[hsl(0_90%_55%/0.4)] bg-[hsl(0_90%_55%/0.06)]", text: "text-[hsl(0_90%_65%)]", bar: "hsl(0 90% 55%)", label: "Severa", desc: "Turbolenza pericolosa — valutare il decollo", emoji: "😱" },
};

function InfoPill({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[hsl(220_20%_9%)] border border-[hsl(220_16%_18%)] rounded-xl text-sm">
      <span className="text-base">{icon}</span>
      <div>
        <div className="text-xs text-[hsl(215_14%_50%)]">{label}</div>
        <div className="font-bold text-sm" style={{ color }}>{value}</div>
        <div className="text-xs text-[hsl(215_14%_45%)]">{sub}</div>
      </div>
    </div>
  );
}

export default function ThermalCard({ data }: Props) {
  const turb = turbStyle[data.turbulence];
  const capeBarColor = data.currentCape > 700 ? "hsl(0 90% 55%)" : data.currentCape > 300 ? "hsl(25 90% 55%)" : "hsl(142 76% 45%)";
  const liColor = data.currentLiftedIndex < -3 ? "hsl(0 90% 65%)" : data.currentLiftedIndex < -1 ? "hsl(43 100% 65%)" : data.currentLiftedIndex < 1 ? "hsl(142 76% 65%)" : "hsl(215 14% 65%)";
  const liDesc = data.currentLiftedIndex < -3 ? "Molto instabile ⚠️" : data.currentLiftedIndex < -1 ? "Instabile — buone termiche" : data.currentLiftedIndex < 1 ? "Leggermente instabile" : data.currentLiftedIndex < 3 ? "Stabile" : "Molto stabile";
  const ceilingAboveSite = data.currentCeiling - data.site.altitude;

  return (
    <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
      {/* Top info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <InfoPill icon="🚀" label="Soffitto Termico" value={`${data.currentCeiling.toLocaleString()}m`}
          sub={`+${ceilingAboveSite.toLocaleString()}m sopra`}
          color={ceilingAboveSite > 1200 ? "hsl(142 76% 65%)" : ceilingAboveSite > 700 ? "hsl(43 100% 65%)" : "hsl(0 90% 65%)"} />
        <InfoPill icon="☁️" label="Base Nuvole" value={`${data.currentCloudbaseM.toLocaleString()}m`}
          sub={`+${(data.currentCloudbaseM - data.site.altitude).toLocaleString()}m`}
          color={(data.currentCloudbaseM - data.site.altitude) > 800 ? "hsl(142 76% 65%)" : "hsl(43 100% 65%)"} />
        <InfoPill icon="🌀" label="Vel. Termiche" value={`${data.currentThermalMs.toFixed(1)} m/s`}
          sub={data.currentThermalMs > 2 ? "Buone per XC" : data.currentThermalMs > 1 ? "Moderate" : "Deboli"}
          color={data.currentThermalMs > 2 ? "hsl(142 76% 65%)" : "hsl(43 100% 65%)"} />
        <InfoPill icon="🌪️" label="Wind Shear" value={`${data.currentWindShear} km/h`}
          sub={data.currentWindShear > 20 ? "Forte" : "Regolare"}
          color={data.currentWindShear > 20 ? "hsl(43 100% 65%)" : "hsl(142 76% 65%)"} />
      </div>

      {/* Thermal column */}
      <div className="bg-[hsl(220_20%_9%)] border border-[hsl(220_16%_18%)] rounded-xl p-4">
        <div className="font-bold text-white text-sm mb-1">🌡️ Colonna Termica</div>
        <div className="text-xs text-[hsl(215_14%_55%)] mb-3">BLH e base nuvole</div>
        <div className="relative h-40 flex">
          <div className="flex flex-col justify-between text-xs text-[hsl(215_14%_45%)] font-mono pr-2 py-1">
            {[4000, 3000, 2000, 1000, 0].map((alt) => <div key={alt}>{alt > 0 ? `${alt}m` : "↓"}</div>)}
          </div>
          <div className="flex-1 relative rounded-lg overflow-hidden border border-[hsl(220_16%_16%)]">
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, hsl(220 60% 18%), hsl(220 40% 11%), hsl(220 25% 8%))" }} />
            <div className="absolute left-0 right-0 bg-[hsl(142_76%_45%/0.1)] border-t border-dashed border-[hsl(142_76%_45%/0.4)]"
              style={{ top: `${Math.max(5, 100 - (data.currentCeiling / 4000) * 100)}%`, bottom: `${(data.site.altitude / 4000) * 100}%` }}>
              <div className="absolute -top-4 left-1 text-xs text-[hsl(142_76%_60%)]">☁️ {data.currentCeiling.toLocaleString()}m</div>
            </div>
            <div className="absolute left-0 right-0 border-t border-dashed border-[hsl(205_90%_55%/0.5)]"
              style={{ top: `${Math.max(5, 100 - (data.currentCloudbaseM / 4000) * 100)}%` }}>
              <div className="absolute -top-4 left-1 text-xs text-[hsl(205_90%_65%)]">🌫️ {data.currentCloudbaseM.toLocaleString()}m</div>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 flex gap-1.5"
              style={{ bottom: `${(data.site.altitude / 4000) * 100 + 5}%` }}>
              {[...Array(Math.min(data.thermalStrength + 1, 4))].map((_, i) => (
                <span key={i} className="text-[hsl(142_76%_55%)] font-bold text-sm">↑</span>
              ))}
            </div>
            <div className="absolute left-0 right-0 border-t-2 border-[hsl(215_14%_40%)]"
              style={{ bottom: 0, height: `${(data.site.altitude / 4000) * 100}%` }}>
              <div className="text-xs text-[hsl(215_14%_55%)] px-1 pt-1">⛰️ {data.site.altitude}m</div>
            </div>
          </div>
        </div>
      </div>

      {/* CAPE */}
      <div className="bg-[hsl(220_20%_9%)] border border-[hsl(220_16%_18%)] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs font-bold text-[hsl(215_14%_50%)]">⚡ CAPE</div>
            <div className="text-xs text-[hsl(215_14%_45%)]">Energia potenziale convettiva</div>
          </div>
          <div className="text-2xl font-black" style={{ color: capeBarColor }}>{data.currentCape}</div>
        </div>
        <div className="h-2 bg-[hsl(220_16%_18%)] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (data.currentCape / 1000) * 100)}%`, background: capeBarColor }} />
        </div>
        <div className="text-xs text-[hsl(215_14%_45%)] mt-1">
          {data.currentCape > 800 ? "⚠️ Pericoloso — rischio Cu-Nimbus" : data.currentCape > 500 ? "Forte — sviluppi possibili" : data.currentCape > 200 ? "Buono per XC" : "Stabile"}
        </div>
      </div>

      {/* Turbulence */}
      <div className={cn("rounded-xl border p-3", turb.ring)}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs font-bold text-[hsl(215_14%_50%)]">💥 Turbolenza</div>
            <div className={cn("font-bold", turb.text)}>{turb.emoji} {turb.label}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[hsl(215_14%_50%)]">Indice</div>
            <div className="text-xl font-black" style={{ color: turb.bar }}>{data.turbulenceScore}/10</div>
          </div>
        </div>
        <div className="flex gap-0.5 mb-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-sm"
              style={{ background: i < data.turbulenceScore ? turb.bar : "hsl(220 16% 18%)" }} />
          ))}
        </div>
        <div className="text-xs text-[hsl(215_14%_55%)]">{turb.desc}</div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: "☁️", label: "Cloudbase", value: `${data.currentCloudbaseM.toLocaleString()} m`, sub: `+${(data.currentCloudbaseM - data.site.altitude).toLocaleString()} m sopra decollo`, good: data.currentCloudbaseM > data.site.altitude + 800 },
          { icon: "🌡️", label: "Temp + Rugiada", value: `${data.currentTemp}°C`, sub: `TP: ${data.currentDewpoint}°C · spread ${(data.currentTemp - data.currentDewpoint).toFixed(1)}°C`, good: true },
          { icon: "👁️", label: "Visibilità", value: `${data.currentVisibility} km`, sub: data.currentVisibility > 10 ? "Eccellente" : data.currentVisibility > 5 ? "Buona" : "Ridotta ⚠️", good: data.currentVisibility > 5 },
          { icon: "💧", label: "Nuvole", value: `${data.currentCloudCover}%`, sub: data.currentCloudCover > 70 ? "Molto nuvoloso" : data.currentCloudCover > 40 ? "Parzialmente" : "Poco nuvoloso", good: data.currentCloudCover < 70 },
        ].map((item) => (
          <div key={item.label} className={cn("rounded-xl border p-3",
            item.good ? "bg-[hsl(220_20%_9%)] border-[hsl(220_16%_18%)]" : "bg-[hsl(43_100%_52%/0.06)] border-[hsl(43_100%_52%/0.25)]"
          )}>
            <div className="text-base">{item.icon}</div>
            <div className="text-xs text-[hsl(215_14%_50%)] mt-1">{item.label}</div>
            <div className="font-bold text-sm text-white mt-0.5">{item.value}</div>
            <div className="text-xs text-[hsl(215_14%_45%)]">{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
