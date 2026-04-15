import { useState, useMemo } from "react";
import { SITES } from "@/constants/sites";
import { useWeather, useAllSiteRankings } from "@/hooks/useWeather";
import { SiteRanking, LaunchSite } from "@/types/weather";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/Header";
import VolabilityHero from "@/components/features/VolabilityHero";
import AlertsPanel from "@/components/features/AlertsPanel";
import DailyForecast from "@/components/features/DailyForecast";
import BriefingCard from "@/components/features/BriefingCard";
import ThermalCard from "@/components/features/ThermalCard";
import WindgramChart from "@/components/features/WindgramChart";
import SoaringChart from "@/components/features/SoaringChart";
import ExternalLinks from "@/components/features/ExternalLinks";
import SunBar from "@/components/features/SunBar";
import LoadingOverlay from "@/components/features/LoadingOverlay";
import InteractiveHourlyTable from "@/components/features/InteractiveHourlyTable";
import WindyMap from "@/components/features/WindyMap";

type Tab = "orario" | "windgram" | "termiche" | "settimanale" | "soaring" | "mappa" | "link";

const TABS: { id: Tab; label: string; icon: string; desc?: string }[] = [
  { id: "settimanale", label: "7 Giorni", icon: "📅", desc: "Previsioni settimana" },
  { id: "orario", label: "Orario", icon: "⏱️", desc: "09:00–19:00" },
  { id: "soaring", label: "Grafici", icon: "📈", desc: "Analisi avanzata" },
  { id: "termiche", label: "Termiche", icon: "🌀", desc: "Colonna termica" },
  { id: "windgram", label: "Windgram", icon: "📊", desc: "Vento in quota" },
  { id: "mappa", label: "Mappa", icon: "🗺️", desc: "Windy ECMWF" },
  { id: "link", label: "Risorse", icon: "🔗", desc: "Link utili" },
];

const LABEL_CFG = {
  GO: {
    text: "text-[hsl(142_76%_65%)]",
    bg: "bg-[hsl(142_76%_45%/0.12)]",
    border: "border-[hsl(142_76%_45%/0.4)]",
    dot: "bg-[hsl(142_76%_55%)]",
    bar: "hsl(142 76% 50%)",
    badge: "bg-[hsl(142_76%_45%)] text-black",
    glow: "shadow-[0_0_12px_hsl(142_76%_45%/0.3)]",
  },
  CAUTION: {
    text: "text-[hsl(43_100%_68%)]",
    bg: "bg-[hsl(43_100%_52%/0.10)]",
    border: "border-[hsl(43_100%_52%/0.4)]",
    dot: "bg-[hsl(43_100%_55%)]",
    bar: "hsl(43 100% 55%)",
    badge: "bg-[hsl(43_100%_52%)] text-black",
    glow: "shadow-[0_0_12px_hsl(43_100%_52%/0.3)]",
  },
  STOP: {
    text: "text-[hsl(0_90%_68%)]",
    bg: "bg-[hsl(0_90%_55%/0.08)]",
    border: "border-[hsl(0_90%_55%/0.35)]",
    dot: "bg-[hsl(0_90%_58%)]",
    bar: "hsl(0 90% 55%)",
    badge: "bg-[hsl(0_90%_55%)] text-white",
    glow: "shadow-[0_0_12px_hsl(0_90%_55%/0.3)]",
  },
};

/* ── Mobile Site Picker ─────────────────────────────────────────────── */
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
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border transition-all",
          selected ? cn(LABEL_CFG[selected.label].bg, LABEL_CFG[selected.label].border) : "bg-[hsl(220_20%_11%)] border-[hsl(220_16%_20%)]"
        )}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selected?.site.icon ?? "🏔️"}</span>
          <div className="text-left">
            <div className="font-bold text-white text-sm">{selected?.site.name ?? "Seleziona decollo"}</div>
            <div className="text-xs text-[hsl(215_14%_50%)]">
              ⛰️ {selected?.site.altitude}m · {selected?.site.region} · {selected?.site.orientation}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selected && !selected.loading && (
            <div className="text-right">
              <div className={cn("text-lg font-black", LABEL_CFG[selected.label].text)}>{selected.volability.toFixed(1)}</div>
              <div className="text-[10px] text-[hsl(215_14%_50%)]">/ 10</div>
            </div>
          )}
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[hsl(220_16%_18%)] text-[hsl(215_14%_50%)]">▼</div>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[hsl(220_23%_6%/0.98)] backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(220_16%_18%)]">
            <div className="font-bold text-white text-base">🪂 Scegli Decollo</div>
            <button onClick={() => setOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-[hsl(220_16%_18%)] text-white text-lg">✕</button>
          </div>
          <div className="px-4 py-2">
            <input
              placeholder="Cerca sito…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[hsl(220_20%_9%)] border border-[hsl(220_16%_22%)] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[hsl(215_14%_40%)] focus:outline-none focus:border-[hsl(205_90%_55%/0.5)]"
            />
          </div>
          <div className="overflow-y-auto flex-1 px-3 pb-4 flex flex-col gap-2">
            {filtered.map((r) => {
              const cfg = LABEL_CFG[r.label];
              const isSel = r.site.id === selectedId;
              return (
                <button key={r.site.id} onClick={() => { onSelect(r.site); setOpen(false); setSearch(""); }}
                  className={cn("w-full text-left rounded-2xl border px-4 py-3 transition-all min-h-[68px]",
                    isSel ? cn(cfg.bg, cfg.border, cfg.glow) : "bg-[hsl(220_20%_9%)] border-[hsl(220_16%_18%)] active:bg-[hsl(220_18%_12%)]"
                  )}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{r.site.icon}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-sm truncate">{r.site.name}</div>
                        <div className="text-xs text-[hsl(215_14%_50%)] mt-0.5">{r.site.altitude}m · {r.site.zone}</div>
                        <div className="text-[10px] text-[hsl(215_14%_40%)]">🧭 {r.site.orientation} · max {r.site.maxWindKmh} km/h</div>
                      </div>
                    </div>
                    {r.loading ? (
                      <div className="w-7 h-7 rounded-full border-2 border-[hsl(142_76%_45%)] border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="text-right shrink-0">
                        <div className={cn("text-2xl font-black", cfg.text)}>{r.volability.toFixed(1)}</div>
                        <div className="text-[10px] text-[hsl(215_14%_50%)]">💨 {r.wind} km/h</div>
                      </div>
                    )}
                  </div>
                  {!r.loading && (
                    <div className="mt-2 h-1 bg-[hsl(220_16%_16%)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(r.volability / 10) * 100}%`, background: cfg.bar }} />
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

/* ── Desktop Site List ─────────────────────────────────────────────── */
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
      <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-black text-white text-base">🪂 Decolli Piemonte</div>
            <div className="text-[10px] text-[hsl(215_14%_50%)] mt-0.5">{SITES.length} siti · aggiornamento live</div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(142_76%_55%)] live-dot" />
            <span className="text-[10px] font-bold text-[hsl(142_76%_55%)]">LIVE</span>
          </div>
        </div>

        {/* Status counts */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { l: "🪂 VOLA", n: goCount, c: "hsl(142 76% 65%)", bg: "hsl(142 76% 45% / 0.1)", bd: "hsl(142 76% 45% / 0.35)" },
            { l: "⚠️ VALUTA", n: cautionCount, c: "hsl(43 100% 68%)", bg: "hsl(43 100% 52% / 0.1)", bd: "hsl(43 100% 52% / 0.35)" },
            { l: "🚫 STOP", n: stopCount, c: "hsl(0 90% 68%)", bg: "hsl(0 90% 55% / 0.08)", bd: "hsl(0 90% 55% / 0.35)" },
          ].map((s) => (
            <div key={s.l} className="text-center rounded-xl border py-2"
              style={{ color: s.c, background: s.bg, borderColor: s.bd }}>
              <div className="text-xl font-black leading-none">{s.n}</div>
              <div className="text-[9px] font-bold mt-0.5 leading-none">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & filters */}
      <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl p-3 flex flex-col gap-2">
        <input
          placeholder="🔍 Cerca decollo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[hsl(220_20%_9%)] border border-[hsl(220_16%_22%)] rounded-xl px-3 py-2 text-xs text-white placeholder:text-[hsl(215_14%_40%)] focus:outline-none focus:border-[hsl(205_90%_55%/0.5)] min-h-[36px]"
        />
        <div className="flex gap-1">
          {(["ALL", "CN", "TO"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all border",
                filter === f
                  ? "bg-[hsl(205_90%_45%/0.2)] text-[hsl(205_90%_70%)] border-[hsl(205_90%_55%/0.4)]"
                  : "text-[hsl(215_14%_55%)] border-[hsl(220_16%_20%)] hover:text-white"
              )}>
              {f === "ALL" ? "Tutti" : f === "CN" ? "Cuneo" : "Torino"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[{ k: "vol", l: "Volabilità" }, { k: "alt", l: "Quota" }, { k: "name", l: "Nome" }].map((s) => (
            <button key={s.k} onClick={() => setSortBy(s.k as typeof sortBy)}
              className={cn("flex-1 py-1 rounded text-[10px] font-bold transition-all border",
                sortBy === s.k
                  ? "bg-[hsl(220_20%_15%)] text-white border-[hsl(220_16%_30%)]"
                  : "text-[hsl(215_14%_50%)] border-[hsl(220_16%_18%)] hover:text-white"
              )}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {/* Best site banner */}
      {(() => {
        const best = [...rankings].filter(r => !r.loading).sort((a, b) => b.volability - a.volability)[0];
        if (!best) return null;
        const cfg = LABEL_CFG[best.label];
        return (
          <button onClick={() => onSelect(best.site)}
            className={cn("w-full text-left rounded-2xl border px-3 py-2.5 transition-all", cfg.bg, cfg.border, cfg.glow, "hover:brightness-110")}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[hsl(43_100%_65%)] font-bold">🏆 Miglior oggi</span>
              <span className="text-sm font-bold text-white truncate">{best.site.name}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-[hsl(215_14%_50%)]">{best.site.altitude}m · {best.site.zone}</span>
              <span className={cn("text-lg font-black", cfg.text)}>{best.volability.toFixed(1)}</span>
            </div>
          </button>
        );
      })()}

      {/* Site list */}
      <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-0.5 min-h-0">
        {sorted.map((r, idx) => {
          const cfg = LABEL_CFG[r.label];
          const isSelected = r.site.id === selectedId;
          return (
            <button key={r.site.id} onClick={() => onSelect(r.site)}
              className={cn(
                "w-full text-left rounded-xl border px-3 py-2.5 transition-all cursor-pointer rank-in group",
                isSelected
                  ? cn(cfg.bg, cfg.border, "ring-1 ring-[hsl(205_90%_55%/0.25)]", cfg.glow)
                  : "bg-[hsl(220_20%_9%)] border-[hsl(220_16%_18%)] hover:bg-[hsl(220_18%_12%)] hover:border-[hsl(220_16%_28%)]"
              )}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[hsl(215_14%_38%)] w-4 shrink-0 font-mono">{idx + 1}</span>
                <span className="text-lg shrink-0">{r.site.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-xs truncate">{r.site.name}</div>
                  <div className="text-[10px] text-[hsl(215_14%_45%)] flex items-center gap-1 mt-0.5">
                    <span>{r.site.region}</span>
                    <span>·</span>
                    <span>{r.site.altitude}m</span>
                    {!r.loading && <><span>·</span><span>💨{r.wind}</span></>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {r.loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-[hsl(142_76%_45%)] border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <div className={cn("text-sm font-black", cfg.text)}>{r.volability.toFixed(1)}</div>
                      <div className={cn("text-[9px] font-bold px-1 rounded-full", cfg.badge)}>{r.label}</div>
                    </>
                  )}
                </div>
              </div>
              {!r.loading && (
                <div className="mt-1.5 h-1 bg-[hsl(220_16%_15%)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(r.volability / 10) * 100}%`, background: cfg.bar }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Tab bar ─────────────────────────────────────────────────────────── */
function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl p-1.5 flex gap-1 overflow-x-auto">
      {TABS.map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={cn(
            "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px]",
            active === tab.id
              ? "bg-[hsl(205_90%_45%/0.2)] text-white border border-[hsl(205_90%_55%/0.3)]"
              : "text-[hsl(215_14%_55%)] hover:text-white hover:bg-[hsl(220_16%_15%)]"
          )}>
          <span className="text-base">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────── */
export default function Index() {
  const rankings = useAllSiteRankings();
  const [selectedSite, setSelectedSite] = useState<LaunchSite>(SITES[0]);
  const [activeTab, setActiveTab] = useState<Tab>("settimanale");

  const { data, isLoading, isError } = useWeather(selectedSite);

  return (
    <div className="min-h-screen bg-[hsl(220_23%_7%)]">
      <Header />

      <div className="max-w-[1680px] mx-auto px-3 sm:px-4 lg:px-5 py-4 flex flex-col lg:flex-row gap-4">

        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 max-h-[calc(100vh-80px)] sticky top-[76px]">
          <SiteList rankings={rankings} selectedId={selectedSite.id} onSelect={setSelectedSite} />
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Mobile picker */}
          <MobileSitePicker rankings={rankings} selectedId={selectedSite.id} onSelect={setSelectedSite} />

          {isLoading && <LoadingOverlay />}

          {isError && (
            <div className="bg-[hsl(0_90%_55%/0.08)] border border-[hsl(0_90%_55%/0.3)] rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <div className="font-bold text-[hsl(0_90%_65%)] text-lg">Errore caricamento dati</div>
              <div className="text-sm text-[hsl(215_14%_50%)] mt-2">Verifica la connessione internet e riprova</div>
              <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-[hsl(220_20%_15%)] border border-[hsl(220_16%_25%)] rounded-xl text-sm text-white hover:bg-[hsl(220_20%_18%)]">
                Ricarica
              </button>
            </div>
          )}

          {data && (
            <>
              {/* Hero volabilità */}
              <VolabilityHero data={data} />

              {/* Sun & alerts strip */}
              <div className="grid grid-cols-1 gap-3">
                <SunBar sun={data.sun} siteName={data.site.name} />
                <AlertsPanel alerts={data.alerts} />
              </div>

              {/* Tab bar */}
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

                {activeTab === "mappa" && (
                  <WindyMap site={data.site} />
                )}

                {activeTab === "link" && (
                  <ExternalLinks />
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
