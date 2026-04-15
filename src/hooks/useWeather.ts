import { useState, useEffect } from "react";

// Versione SEMPLICE e FUNZIONANTE
export function useWeather(site: any) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Dati fittizi ma che fanno funzionare la pagina
    setData({
      site: site,
      volability: 7.2,
      wind: 14,
      temperature: 21,
      alerts: [],
      sun: { sunrise: "07:00", sunset: "20:00" },
      hourly: [],
      daily: [],
      windgram: []
    });
  }, [site]);

  return { data, isLoading, isError };
}

export function useAllSiteRankings() {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    // Lista vuota per ora
    setRankings([]);
  }, []);

  return rankings;
}
