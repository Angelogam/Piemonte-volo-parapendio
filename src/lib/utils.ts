import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function windDirLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export function windDirArrow(deg: number): string {
  const arrows = ["↓", "↙", "←", "↖", "↑", "↗", "→", "↘"];
  return arrows[Math.round(deg / 45) % 8];
}

export function weatherIcon(code: number, hour?: number): string {
  const isNight = hour !== undefined && (hour < 6 || hour >= 21);
  if (code === 0) return isNight ? "🌙" : "☀️";
  if (code === 1) return isNight ? "🌙" : "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "🌥️";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌦️";
  if (code <= 84) return "🌧️";
  if (code <= 94) return "🌨️";
  return "⛈️";
}

export function formatHour(isoString: string): string {
  const d = new Date(isoString);
  return d.getHours().toString().padStart(2, "0") + ":00";
}

export function formatDay(isoString: string, short = false): string {
  const d = new Date(isoString);
  const days = short
    ? ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"]
    : ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  return days[d.getDay()];
}

export function isToday(isoString: string): boolean {
  const d = new Date(isoString);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}
