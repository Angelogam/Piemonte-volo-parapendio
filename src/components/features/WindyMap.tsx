import { LaunchSite } from "@/types/weather";

interface Props {
  site: LaunchSite;
}

export default function WindyMap({ site }: Props) {
  const src = `https://embed.windy.com/embed2.html?lat=${site.windyLat}&lon=${site.windyLon}&detailLat=${site.windyLat}&detailLon=${site.windyLon}&width=650&height=450&zoom=${site.windyZoom}&level=surface&overlay=wind&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=true&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;
  return (
    <div className="bg-[hsl(220_20%_11%)] border border-[hsl(220_16%_20%)] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(220_16%_18%)]">
        <span className="text-xl">🗺️</span>
        <div>
          <div className="font-bold text-white text-sm">Mappa Vento — Windy ECMWF</div>
          <div className="text-xs text-[hsl(215_14%_50%)]">
            Mappa Windy per {site.name} · {site.windyLat.toFixed(3)}N {site.windyLon.toFixed(3)}E
          </div>
        </div>
      </div>
      <div className="relative" style={{ paddingBottom: "56.25%" }}>
        <iframe src={src} title="Windy Map" className="absolute inset-0 w-full h-full border-0" allowFullScreen />
      </div>
    </div>
  );
}
