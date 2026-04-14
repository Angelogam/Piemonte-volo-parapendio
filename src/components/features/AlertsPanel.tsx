import { WeatherAlert } from "@/types/weather";
import { cn } from "@/lib/utils";

interface Props {
  alerts: WeatherAlert[];
}

const alertCfg = {
  danger: "bg-[hsl(0_90%_55%/0.1)] border-[hsl(0_90%_55%/0.4)] text-[hsl(0_90%_70%)] border-l-4 border-l-[hsl(0_90%_55%)]",
  warning: "bg-[hsl(43_100%_52%/0.08)] border-[hsl(43_100%_52%/0.35)] text-[hsl(43_100%_65%)] border-l-4 border-l-[hsl(43_100%_52%)]",
  ok: "bg-[hsl(142_76%_45%/0.08)] border-[hsl(142_76%_45%/0.3)] text-[hsl(142_76%_60%)] border-l-4 border-l-[hsl(142_76%_45%)]",
  info: "bg-[hsl(205_90%_55%/0.07)] border-[hsl(205_90%_55%/0.25)] text-[hsl(205_90%_65%)] border-l-4 border-l-[hsl(205_90%_55%)]",
};

export default function AlertsPanel({ alerts }: Props) {
  if (!alerts.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a, i) => (
        <div key={i} className={cn("rounded-xl border px-4 py-2.5 text-sm flex items-start gap-2", alertCfg[a.type])}>
          <span>{a.icon}</span>
          <span>{a.message}</span>
        </div>
      ))}
    </div>
  );
}
