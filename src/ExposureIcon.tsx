// components/ui/ExposureIcon.tsx
import { cn } from "@/lib/utils";

interface ExposureIconProps {
  orientation: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ExposureIcon({ orientation, size = "md", showLabel = true }: ExposureIconProps) {
  const isNorth = orientation.includes("N");
  const isSouth = orientation.includes("S");
  const isEast = orientation.includes("E");
  const isWest = orientation.includes("W");
  
  let direction = "";
  let arrow = "";
  let color = "";
  
  if (isSouth) {
    direction = "SUD";
    arrow = "⬇️";
    color = "text-orange-400";
  } else if (isNorth) {
    direction = "NORD";
    arrow = "⬆️";
    color = "text-blue-400";
  } else if (isEast) {
    direction = "EST";
    arrow = "➡️";
    color = "text-yellow-400";
  } else if (isWest) {
    direction = "OVEST";
    arrow = "⬅️";
    color = "text-purple-400";
  } else {
    direction = orientation;
    arrow = "🧭";
    color = "text-gray-400";
  }
  
  const sizeClasses = {
    sm: "text-xs gap-0.5",
    md: "text-sm gap-1",
    lg: "text-base gap-1.5"
  };
  
  const iconSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl"
  };
  
  return (
    <div className={cn("flex items-center font-bold", sizeClasses[size], color)}>
      <span className={iconSizes[size]}>{arrow}</span>
      {showLabel && <span>{direction}</span>}
    </div>
  );
}
