// hooks/useWeather.ts
import { useEffect, useState } from "react";
import { SITES } from "@/constants/sites";

export interface LaunchSite {
  id: string;
  name: string;
  region: "CN" | "TO";
  zone: string;
  altitude: number;
  orientation: string;
  maxWindKmh: number;
  coordinates: { lat: number; lng: number };
  icon: string;
  difficulty: "beginner" | "intermediate" | "expert";
}

export interface SiteRanking {
  site: LaunchSite;
  volability: number;
  label: "GO" | "CAUTION" | "STOP";
  wind: number;
  loading: boolean;
}

// DATI DI ESEMPIO - LA PAGINA FUNZIONA SUBITO
// Poi possiamo aggiungere l'API vera
const generateMockRankings = () => {
  return SITES.map((site, index) => {
    // Simula volabilità realistica
    let vol = 5 + (index % 5);
    let label: "GO" | "CAUTION" | "STOP" = "CAUTION";
    if (vol >= 7) label = "GO";
    if (vol <= 3) label = "STOP";
    
    return {
      site,
      volability: vol,
      label,
      wind: 8 + (index % 15),
      loading: false
    };
  });
};

export function useWeather(site: LaunchSite) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    
    // Simula caricamento dati
    setTimeout(() => {
      const mockData = {
        site,
        volability: 6.5,
        wind: 12,
        temperature: 20,
        alerts: [],
        sun: { sunrise: "07:30", sunset: "19:45" },
        hourly: {},
        daily: {},
        windgram: []
      };
      setData(mockData);
      setIsLoading(false);
    }, 500);
  }, [site]);

  return { data, isLoading, isError };
}

export function useAllSiteRankings(): SiteRanking[] {
  const [rankings, setRankings] = useState<SiteRanking[]>([]);

  useEffect(() => {
    setTimeout(() => {
      setRankings(generateMockRankings());
    }, 300);
  }, []);

  return rankings;
}
