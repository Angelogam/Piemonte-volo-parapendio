import { SunTimes } from "@/types/weather";

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function calcSunTimes(lat: number, lon: number, date: Date): SunTimes {
  const J2000 = 2451545.0;
  const jd =
    367 * date.getFullYear() -
    Math.floor((7 * (date.getFullYear() + Math.floor((date.getMonth() + 10) / 12))) / 4) +
    Math.floor((275 * (date.getMonth() + 1)) / 9) +
    date.getDate() +
    1721013.5 +
    0.5;

  const n = jd - J2000;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = toRad((357.528 + 0.9856003 * n) % 360);
  const lambda = toRad(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  const epsilon = toRad(23.439 - 0.0000004 * n);
  const sinDec = Math.sin(epsilon) * Math.sin(lambda);
  const dec = Math.asin(sinDec);

  const cosH = (Math.sin(toRad(-0.833)) - Math.sin(toRad(lat)) * sinDec) /
    (Math.cos(toRad(lat)) * Math.cos(dec));

  if (cosH > 1 || cosH < -1) {
    return { sunrise: "--:--", sunset: "--:--", daylightHours: 0, progressPercent: 0 };
  }

  const H = Math.acos(cosH) * (180 / Math.PI);
  const EqT = (L - (Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)) * 180 / Math.PI)) / 15;
  const noon = 12 - EqT - lon / 15;

  const riseH = noon - H / 15;
  const setH = noon + H / 15;

  const fmt = (h: number) => {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
  };

  const nowH = date.getHours() + date.getMinutes() / 60;
  const daylight = setH - riseH;
  const progress = Math.max(0, Math.min(100, ((nowH - riseH) / daylight) * 100));

  return {
    sunrise: fmt(riseH),
    sunset: fmt(setH),
    daylightHours: Math.round(daylight * 10) / 10,
    progressPercent: Math.round(progress),
  };
}
