import { WeatherAlert } from "@/types/weather";
import { cn } from "@/lib/utils";

interface Props {
  alerts: WeatherAlert[];
}

const alertCfg = {
  danger: "bg-red-50 border-red-200 border-l-4 border-l-red-500 text-red-700",
  warning: "bg-amber-50 border-amber-200 border-l-4 border-l-amber-500 text-amber-700",
  ok: "bg-emerald-50 border-emerald-200 border-l-4 border-l-emerald-500 text-emerald-700",
  info: "bg-blue-50 border-blue-200 border-l-4 border-l-blue-400 text-blue-700",
};

export default function AlertsPanel({ alerts }: Props) {
  if (!alerts.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a, i) => (
        <div key={i} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium", alertCfg[a.type])}>
          <span className="text-base shrink-0">{a.icon}</span>
          <span>{a.message}</span>
        </div>
      ))}
    </div>
  );
}
