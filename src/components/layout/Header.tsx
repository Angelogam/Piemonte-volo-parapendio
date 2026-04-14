import { useEffect, useState } from "react";

export default function Header() {
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = time.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = time.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });

  const links = [
    { label: "SoaringMeteo", href: "https://soaringmeteo.org/soarWRF?lang=en" },
    { label: "Meteo-Parapente", href: "https://meteo-parapente.com/#/" },
    { label: "Paraglidable", href: "https://paraglidable.com/?lat=44.473&lon=7.615&zoom=10" },
    { label: "Windy", href: "https://www.windy.com/?44.5,7.5,10" },
    { label: "Thermal kk7", href: "https://thermal.kk7.ch/?lat=44.6&lng=7.5&zoom=10" },
    { label: "XContest", href: "https://www.xcontest.org/world/en/" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[hsl(220_23%_7%/0.95)] backdrop-blur-md border-b border-[hsl(220_16%_15%)] px-4 py-2">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[hsl(142_76%_45%/0.15)] border border-[hsl(142_76%_45%/0.4)] flex items-center justify-center text-lg">
            🪂
          </div>
          <div className="hidden sm:block">
            <div className="font-black text-white text-sm leading-none">MeteoVoloPiemonte</div>
            <div className="text-[10px] text-[hsl(215_14%_50%)]">24 Siti · Open Source · No Profit</div>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden xl:flex items-center gap-1">
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
              className="text-xs text-[hsl(215_14%_60%)] hover:text-white px-3 py-1.5 rounded-lg hover:bg-[hsl(220_16%_16%)] transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right: clock + mobile menu btn */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(220_20%_12%)] border border-[hsl(220_16%_20%)] rounded-xl">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[hsl(142_76%_55%)] live-dot" />
              <span className="text-[10px] font-bold text-[hsl(142_76%_55%)]">LIVE</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-white">{timeStr}</div>
              <div className="text-[10px] text-[hsl(215_14%_50%)]">{dateStr}</div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="xl:hidden flex flex-col gap-1 p-2 rounded-lg bg-[hsl(220_20%_12%)] border border-[hsl(220_16%_20%)] min-w-[44px] min-h-[44px] items-center justify-center">
            <div className="w-4 h-0.5 bg-[hsl(215_14%_60%)] rounded" />
            <div className="w-4 h-0.5 bg-[hsl(215_14%_60%)] rounded" />
            <div className="w-4 h-0.5 bg-[hsl(215_14%_60%)] rounded" />
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="xl:hidden absolute top-full left-0 right-0 bg-[hsl(220_23%_8%/0.98)] border-b border-[hsl(220_16%_15%)] py-2 px-4 flex flex-col gap-1">
            {links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-[hsl(215_14%_70%)] hover:text-white px-3 py-2.5 rounded-lg hover:bg-[hsl(220_16%_16%)] transition-colors min-h-[44px] flex items-center">
                {l.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
