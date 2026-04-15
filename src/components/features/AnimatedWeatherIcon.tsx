// AnimatedWeatherIcon - light theme compatible
interface Props {
  code: number;
  hour?: number;
  size?: "sm" | "md" | "lg" | "xl";
}

function getWeatherClass(code: number, hour?: number): { emoji: string; animClass: string } {
  const isNight = hour !== undefined && (hour < 6 || hour >= 21);
  if (code === 0) return { emoji: isNight ? "🌙" : "☀️", animClass: isNight ? "anim-cloud" : "anim-sun" };
  if (code <= 2) return { emoji: "🌤️", animClass: "anim-cloud" };
  if (code === 3) return { emoji: "☁️", animClass: "anim-cloud" };
  if (code <= 48) return { emoji: "🌫️", animClass: "anim-cloud" };
  if (code <= 57) return { emoji: "🌦️", animClass: "anim-rain" };
  if (code <= 67) return { emoji: "🌧️", animClass: "anim-rain" };
  if (code <= 77) return { emoji: "❄️", animClass: "anim-snow" };
  if (code <= 82) return { emoji: "🌦️", animClass: "anim-rain" };
  if (code <= 84) return { emoji: "🌨️", animClass: "anim-snow" };
  if (code <= 94) return { emoji: "❄️", animClass: "anim-snow" };
  if (code <= 99) return { emoji: "⛈️", animClass: "anim-lightning" };
  return { emoji: "🌩️", animClass: "anim-lightning" };
}

const sizeMap = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

export default function AnimatedWeatherIcon({ code, hour, size = "md" }: Props) {
  const { emoji, animClass } = getWeatherClass(code, hour);
  return (
    <span className={`${sizeMap[size]} ${animClass}`} role="img">
      {emoji}
    </span>
  );
}
