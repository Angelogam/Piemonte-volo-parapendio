export default function ExternalLinks() {
  const links = [
    { icon: "🌐", name: "SoaringMeteo WRF", desc: "Windgram e CAPE professionale per le Alpi — modello WRF ad alta risoluzione", href: "https://soaringmeteo.org/soarWRF?lang=en", category: "Volo" },
    { icon: "🌡️", name: "Meteoblue Vela", desc: "Previsioni volo a vela con grafici vettoriali SkewT e adiabatica — Svizzera", href: "https://www.meteoblue.com/it/tempo/outdoor/parapendio/cuneo_italia_6543158", category: "Volo" },
    { icon: "🪂", name: "Meteo-Parapente", desc: "Previsioni specializzate parapendio — XCFly, AROME, BLH e base termiche", href: "https://meteo-parapente.com/#/", category: "Volo" },
    { icon: "🤖", name: "Paraglidable AI", desc: "Intelligenza artificiale per previsioni volo libero Piemonte", href: "https://paraglidable.com/?lat=44.473&lon=7.615&zoom=10", category: "Volo" },
    { icon: "💨", name: "Windy", desc: "Mappa vento interattiva con modelli ECMWF, GFS, ICON", href: "https://www.windy.com/?44.5,7.5,10", category: "Meteo" },
    { icon: "🌀", name: "Thermal kk7", desc: "Mappa termiche e trigger points — dati storici piloti", href: "https://thermal.kk7.ch/?lat=44.6&lng=7.5&zoom=10", category: "Volo" },
    { icon: "🏆", name: "XContest", desc: "Gare e tracce XC mondiali — leggi le rotte dei campioni", href: "https://www.xcontest.org/world/en/", category: "XC" },
    { icon: "🗺️", name: "Open AIP", desc: "Spazi aerei e NOTAM — obbligatorio per voli XC", href: "https://www.openaip.net/", category: "Sicurezza" },
    { icon: "📡", name: "ARPA Piemonte", desc: "Bollettino meteo ufficiale regione Piemonte", href: "https://www.arpa.piemonte.it/rischinaturali/tematismi/meteo.html", category: "Meteo" },
    { icon: "🌩️", name: "Lightningmaps", desc: "Mappa fulminazioni in tempo reale — essenziale per temporali", href: "https://www.lightningmaps.org/?lang=it", category: "Sicurezza" },
    { icon: "📊", name: "Velivole.fr", desc: "Radar termiche e BLH per le Alpi Occidentali", href: "https://www.velivole.fr/?center_lat=44.645&center_long=7&zoom=10", category: "Volo" },
    { icon: "🇨🇭", name: "Meteoblue SkewT", desc: "Grafici adiabatica secca/umida — modello svizzero volo a vela", href: "https://www.meteoblue.com/it/tempo/outdoor/volo-vela/cuneo_italia_6543158", category: "Volo" },
  ];

  const categories = ["Volo", "Meteo", "XC", "Sicurezza"];

  return (
    <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl p-4 sm:p-5 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="text-xl">🔗</span>
        <div>
          <div className="font-bold text-white">Risorse Esterne</div>
          <div className="text-xs text-[hsl(215_14%_50%)]">Tutti i link utili per piloti di parapendio in Piemonte</div>
        </div>
      </div>

      {categories.map((cat) => {
        const catLinks = links.filter((l) => l.category === cat);
        return (
          <div key={cat}>
            <div className="text-xs font-bold text-[hsl(215_14%_50%)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              {cat === "Volo" ? "🪂" : cat === "Meteo" ? "☁️" : cat === "XC" ? "🏆" : "⚠️"} {cat}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {catLinks.map((l) => (
                <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 px-3 py-2.5 bg-[hsl(220_20%_9%)] border border-[hsl(220_16%_18%)] rounded-xl hover:border-[hsl(220_16%_30%)] hover:bg-[hsl(220_18%_12%)] transition-all group min-h-[44px]">
                  <span className="text-lg shrink-0">{l.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm group-hover:text-[hsl(205_90%_70%)] transition-colors">{l.name}</div>
                    <div className="text-xs text-[hsl(215_14%_50%)] leading-snug mt-0.5">{l.desc}</div>
                  </div>
                  <span className="text-[hsl(215_14%_40%)] group-hover:text-[hsl(205_90%_65%)] transition-colors shrink-0">↗</span>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
