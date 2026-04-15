import { useState, useMemo } from "react";
import { SITES } from "@/constants/sites";
import { useWeather, useAllSiteRankings } from "@/hooks/useWeather";
import { SiteRanking, LaunchSite } from "@/types/weather";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/Header";
import VolabilityHero from "@/components/features/VolabilityHero";
import AlertsPanel from "@/components/features/AlertsPanel";
import DailyForecast from "@/components/features/DailyForecast";
import ThermalCard from "@/components/features/ThermalCard";
import WindgramChart from "@/components/features/WindgramChart";
import SoaringChart from "@/components/features/SoaringChart";
import ExternalLinks from "@/components/features/ExternalLinks";
import SunBar from "@/components/features/SunBar";
import LoadingOverlay from "@/components/features/LoadingOverlay";
import InteractiveHourlyTable from "@/components/features/InteractiveHourlyTable";
import BriefingCard from "@/components/features/BriefingCard";

type Tab = "orario" | "windgram" | "termiche" | "settimanale" | "soaring";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "settimanale", label: "7 Giorni", icon: "📅" },
  { id: "orario", label: "Orario 09-19h", icon: "⏱️" },
  { id: "soaring", label: "Grafici", icon: "📈" },
  { id: "termiche", label: "Termiche", icon: "🌀" },
  { id: "windgram", label: "Windgram", icon: "📊" },
];

const vc = (v: number) => v >= 7 ? "#16a34a" : v >= 4 ? "#d97706" : "#dc2626";
const volBg = (l: string) => l === "GO" ? "#f0fdf4" : l === "CAUTION" ? "#fffbeb" : "#fef2f2";
const volBorder = (l: string) => l === "GO" ? "#bbf7d0" : l === "CAUTION" ? "#fde68a" : "#fecaca";
const volText = (l: string) => l === "GO" ? "#16a34a" : l === "CAUTION" ? "#d97706" : "#dc2626";
const volBadge = (l: string) => l === "GO" ? "bg-emerald-100 text-emerald-700" : l === "CAUTION" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

/* ── Mobile Site Picker ─────────────────────────────────────────── */
function MobileSitePicker({ rankings, selectedId, onSelect }: {
  rankings: SiteRanking[];
  selectedId: string;
  onSelect: (s: LaunchSite) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = rankings.find((r) => r.site.id === selectedId);

  const filtered = useMemo(() =>
    search.trim()
      ? rankings.filter((r) => r.site.name.toLowerCase().includes(search.toLowerCase()))
      : rankings,
    [rankings, search]
  );

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-white rounded-2xl border-2 card-shadow transition-all"
        style={selected ? { borderColor: volBorder(selected.label), background: volBg(selected.label) } : { borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selected?.site.icon ?? "🏔️"}</span>
          <div className="text-left">
            <div className="font-bold text-gray-900 text-sm">{selected?.site.name ?? "Seleziona decollo"}</div>
            <div className="text-xs text-gray-500">⛰️ {selected?.site.altitude}m · {selected?.site.zone}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selected && !selected.loading && (
            <div className="text-right">
              <div className="text-xl font-black" style={{ color: volText(selected.label) }}>{selected.volability.toFixed(1)}</div>
              <div className="text-[9px] text-gray-400">/10</div>
            </div>
          )}
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-sm">▼</div>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <h3 className="font-black text-gray-900">🪂 Scegli Decollo</h3>
            <button onClick={() => setOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-lg">✕</button>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <input
              placeholder="🔍 Cerca sito..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400"
            />
          </div>
          <div className="overflow-y-auto flex-1 px-3 py-3 flex flex-col gap-2">
            {filtered.map((r) => {
              const isSel = r.site.id === selectedId;
              return (
                <button key={r.site.id}
                  onClick={() => { onSelect(r.site); setOpen(false); setSearch(""); }}
                  className="w-full text-left rounded-2xl border-2 px-4 py-3 transition-all min-h-[64px]"
                  style={isSel ? { borderColor: volBorder(r.label), background: volBg(r.label) } : { borderColor: "#e5e7eb", background: "white" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{r.site.icon}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 text-sm truncate">{r.site.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{r.site.altitude}m · {r.site.zone}</div>
                        <div className="text-[10px] text-gray-400">🧭 {r.site.orientation} · max {r.site.maxWindKmh} km/h</div>
                      </div>
                    </div>
                    {r.loading ? (
                      <div className="w-6 h-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-black" style={{ color: volText(r.label) }}>{r.volability.toFixed(1)}</div>
                        <div className="text-[10px] text-gray-400">💨 {r.wind} km/h</div>
                      </div>
                    )}
                  </div>
                  {!r.loading && (
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(r.volability / 10) * 100}%`, background: volText(r.label) }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Desktop Site List ───────────────────────────────────────────── */
function SiteList({ rankings, selectedId, onSelect }: {
  rankings: SiteRanking[];
  selectedId: string;
  onSelect: (s: LaunchSite) => void;
}) {
  const [filter, setFilter] = useState<"ALL" | "CN" | "TO">("ALL");
  const [sortBy, setSortBy] = useState<"vol" | "name" | "alt">("vol");
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => {
    let list = [...rankings];
    if (filter !== "ALL") list = list.filter((r) => r.site.region === filter);
    if (search.trim()) list = list.filter((r) => r.site.name.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "vol") list.sort((a, b) => b.volability - a.volability);
    else if (sortBy === "name") list.sort((a, b) => a.site.name.localeCompare(b.site.name));
    else list.sort((a, b) => b.site.altitude - a.site.altitude);
    return list;
  }, [rankings, filter, sortBy, search]);

  const goCount = rankings.filter((r) => r.label === "GO").length;
  const cautionCount = rankings.filter((r) => r.label === "CAUTION").length;
  const stopCount = rankings.filter((r) => r.label === "STOP").length;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 card-shadow">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-black text-gray-900 text-base">🪂 Decolli Piemonte</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{SITES.length} siti · Open-Meteo Live</div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
            <span className="text-[10px] font-bold text-emerald-600">LIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { l: "🪂 VOLA", n: goCount, bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a" },
            { l: "⚠️ VALUTA", n: cautionCount, bg: "#fffbeb", border: "#fde68a", text: "#d97706" },
            { l: "🚫 STOP", n: stopCount, bg: "#fef2f2", border: "#fecaca", text: "#dc2626" },
          ].map((s) => (
            <div key={s.l} className="text-center rounded-xl border py-2"
              style={{ color: s.text, background: s.bg, borderColor: s.border }}>
              <div className="text-2xl font-black leading-none">{s.n}</div>
              <div className="text-[9px] font-bold mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 card-shadow flex flex-col gap-2">
        <input
          placeholder="🔍 Cerca decollo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 min-h-[36px]"
        />
        <div className="flex gap-1">
          {(["ALL", "CN", "TO"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all border",
                filter === f ? "bg-gray-900 text-white border-gray-900" : "text-gray-500 border-gray-200 hover:border-gray-300"
              )}>
              {f === "ALL" ? "Tutti" : f === "CN" ? "Cuneo" : "Torino"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[{ k: "vol", l: "Volabilità" }, { k: "alt", l: "Quota" }, { k: "name", l: "Nome" }].map((s) => (
            <button key={s.k} onClick={() => setSortBy(s.k as typeof sortBy)}
              className={cn("flex-1 py-1 rounded text-[10px] font-bold transition-all border",
                sortBy === s.k ? "bg-gray-100 text-gray-900 border-gray-300" : "text-gray-400 border-gray-100 hover:text-gray-600"
              )}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {/* Best site */}
      {(() => {
        const best = [...rankings].filter(r => !r.loading).sort((a, b) => b.volability - a.volability)[0];
        if (!best) return null;
        return (
          <button onClick={() => onSelect(best.site)}
            className="w-full text-left rounded-2xl border-2 px-3 py-2.5 transition-all hover:shadow-md"
            style={{ borderColor: volBorder(best.label), background: volBg(best.label) }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-amber-600">🏆 Miglior decollo oggi</div>
                <div className="font-black text-gray-900 text-sm mt-0.5">{best.site.name}</div>
                <div className="text-[10px] text-gray-500">{best.site.altitude}m · {best.site.zone}</div>
              </div>
              <div className="text-2xl font-black" style={{ color: volText(best.label) }}>{best.volability.toFixed(1)}</div>
            </div>
          </button>
        );
      })()}

      {/* Site list */}
      <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0">
        {sorted.map((r, idx) => {
          const isSelected = r.site.id === selectedId;
          return (
            <button key={r.site.id} onClick={() => onSelect(r.site)}
              className={cn("w-full text-left rounded-xl border px-3 py-2.5 transition-all cursor-pointer rank-in",
                isSelected
                  ? "border-2 shadow-sm"
                  : "border bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200"
              )}
              style={isSelected ? { borderColor: volBorder(r.label), background: volBg(r.label) } : {}}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-4 shrink-0 font-mono">{idx + 1}</span>
                <span className="text-lg shrink-0">{r.site.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-xs truncate">{r.site.name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {r.site.region} · {r.site.altitude}m {!r.loading && `· 💨${r.wind}`}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {r.loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <div className="text-sm font-black" style={{ color: volText(r.label) }}>{r.volability.toFixed(1)}</div>
                      <div className={cn("text-[9px] font-bold px-1 rounded-full", volBadge(r.label))}>{r.label}</div>
                    </>
                  )}
                </div>
              </div>
              {!r.loading && (
                <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(r.volability / 10) * 100}%`, background: volText(r.label) }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Tab Bar ─────────────────────────────────────────────────────── */
function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-1.5 flex gap-1 overflow-x-auto card-shadow">
      {TABS.map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={cn(
            "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px]",
            active === tab.id
              ? "bg-gray-900 text-white"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          )}>
          <span className="text-sm">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
export default function Index() {
  const rankings = useAllSiteRankings();
  const [selectedSite, setSelectedSite] = useState<LaunchSite>(SITES[0]);
  const [activeTab, setActiveTab] = useState<Tab>("settimanale");

  const { data, isLoading, isError } = useWeather(selectedSite);

  function handleSiteSelect(site: LaunchSite) {
    setSelectedSite(site);
    // Reset to first tab on site change for UX clarity
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header />

      <div className="max-w-[1680px] mx-auto px-3 sm:px-4 lg:px-5 py-4 flex flex-col lg:flex-row gap-4">

        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 max-h-[calc(100vh-72px)] sticky top-[72px]">
          <SiteList rankings={rankings} selectedId={selectedSite.id} onSelect={handleSiteSelect} />
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Mobile picker */}
          <MobileSitePicker rankings={rankings} selectedId={selectedSite.id} onSelect={handleSiteSelect} />

          {isLoading && <LoadingOverlay />}

          {isError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <div className="font-bold text-red-700 text-lg">Errore caricamento dati</div>
              <div className="text-sm text-red-500 mt-2">Impossibile raggiungere Open-Meteo API. Verifica la connessione.</div>
              <button onClick={() => window.location.reload()}
                className="mt-4 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                Riprova
              </button>
            </div>
          )}

          {data && (
            <>
              {/* Hero */}
              <VolabilityHero data={data} />

              {/* Sun + alerts */}
              <SunBar sun={data.sun} siteName={data.site.name} />
              <AlertsPanel alerts={data.alerts} />

              {/* Tabs */}
              <TabBar active={activeTab} onChange={setActiveTab} />

              {/* Tab content */}
              <div className="fade-up">
                {activeTab === "settimanale" && (
                  <DailyForecast daily={data.daily} hourly={data.hourly} />
                )}
                {activeTab === "orario" && (
                  <InteractiveHourlyTable hourly={data.hourly} siteAlt={data.site.altitude} />
                )}
                {activeTab === "soaring" && (
                  <SoaringChart data={data} />
                )}
                {activeTab === "termiche" && (
                  <div className="flex flex-col gap-4">
                    <BriefingCard data={data} />
                    <ThermalCard data={data} />
                  </div>
                )}
                {activeTab === "windgram" && (
                  <WindgramChart windgram={data.windgram} siteAlt={data.site.altitude} />
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-4 py-4 border-t border-gray-200 text-center text-xs text-gray-400">
            <div className="font-bold text-gray-600 mb-1">MeteoVolo Piemonte — Dati reali Open-Meteo API</div>
            <div>Fonte: <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">open-meteo.com</a> · Aggiornamento ogni 30 minuti</div>
            <div className="mt-1 text-gray-300">
              Tutti i dati meteo provengono dall'API Open-Meteo (ECMWF, ICON, GFS).
              Nessun dato inventato. CAPE, vento, precipitazioni: dati reali.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
