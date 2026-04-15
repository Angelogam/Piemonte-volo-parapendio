// hooks/useWeather.ts
import { useEffect, useState } from "react";
import { LaunchSite, SITES } from "@/constants/sites";

// Tipo per il ranking dei siti
export interface SiteRanking {
  site: LaunchSite;
  volability: number;
  label: "GO" | "CAUTION" | "STOP";
  wind: number;
  loading: boolean;
  error?: boolean;
}

// Funzione per fetch meteo da Open-Meteo (GRATUITA, nessuna API key necessaria)
async function fetchWeatherData(lat: number, lng: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,windspeed_10m,winddirection_10m,relativehumidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=Europe/Rome&windspeed_unit=kmh`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Meteo API error: ${response.status}`);
  }
  return response.json();
}

// Calcola volabilità in base a vento e condizioni
function calculateVolability(windSpeed: number, weatherCode: number): { volability: number; label: "GO" | "CAUTION" | "STOP" } {
  // Se pioggia/nebbia/temporale (weather code >= 45)
  if (weatherCode >= 45 && weatherCode < 80) {
    return { volability: 0, label: "STOP" };
  }
  if (weatherCode >= 80) {
    return { volability: 0, label: "STOP" };
  }
  
  // Calcola in base al vento
  if (windSpeed > 35) {
    return { volability: 0, label: "STOP" };
  }
  if (windSpeed > 28) {
    return { volability: 2, label: "STOP" };
  }
  if (windSpeed > 22) {
    return { volability: 4, label: "CAUTION" };
  }
  if (windSpeed > 15) {
    return { volability: 6, label: "CAUTION" };
  }
  if (windSpeed < 5) {
    return { volability: 5, label: "CAUTION" };
  }
  // Condizioni perfette: vento tra 5 e 15 km/h
  const volability = 7 + Math.floor((15 - windSpeed) / 2);
  return { volability: Math.min(volability, 10), label: "GO" };
}

// Hook per il meteo di un singolo sito
export function useWeather(site: LaunchSite) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!site) return;
    
    setIsLoading(true);
    setIsError(false);
    
    fetchWeatherData(site.coordinates.lat, site.coordinates.lng)
      .then(apiData => {
        const currentWind = apiData.current_weather?.windspeed || 0;
        const weatherCode = apiData.current_weather?.weathercode || 0;
        const { volability, label } = calculateVolability(currentWind, weatherCode);
        
        // Costruisci i dati formattati per i componenti
        const formattedData = {
          site,
          volability,
          label,
          wind: currentWind,
          windDirection: apiData.current_weather?.winddirection || 0,
          temperature: apiData.current_weather?.temperature || 0,
          hourly: apiData.hourly || {},
          daily: apiData.daily || {},
          alerts: volability < 4 ? ["⚠️ Vento forte o condizioni avverse"] : [],
          sun: {
            sunrise: "07:30",
            sunset: "19:30"
          },
          windgram: generateMockWindgram(site.altitude)
        };
        
        setData(formattedData);
      })
      .catch(err => {
        console.error("Errore meteo per", site.name, err);
        setIsError(true);
        // Dati di fallback per non mostrare schermata vuota
        setData({
          site,
          volability: 0,
          label: "STOP",
          wind: 0,
          temperature: 0,
          alerts: ["🔌 Dati meteo temporaneamente non disponibili"],
          hourly: {},
          daily: {},
          sun: { sunrise: "--:--", sunset: "--:--" },
          windgram: []
        });
      })
      .finally(() => setIsLoading(false));
  }, [site]);

  return { data, isLoading, isError };
}

// Hook per la classifica di tutti i siti
export function useAllSiteRankings(): SiteRanking[] {
  const [rankings, setRankings] = useState<SiteRanking[]>([]);

  useEffect(() => {
    const fetchAllRankings = async () => {
      // Mostra tutti i siti in loading all'inizio
      setRankings(SITES.map(site => ({
        site,
        volability: 0,
        label: "STOP",
        wind: 0,
        loading: true
      })));
      
      // Fetch per tutti i siti
      const results = await Promise.allSettled(
        SITES.map(async (site) => {
          try {
            const data = await fetchWeatherData(site.coordinates.lat, site.coordinates.lng);
            const currentWind = data.current_weather?.windspeed || 0;
            const weatherCode = data.current_weather?.weathercode || 0;
            const { volability, label } = calculateVolability(currentWind, weatherCode);
            
            return {
              site,
              volability,
              label,
              wind: currentWind,
              loading: false
            };
          } catch (error) {
            console.error(`Errore per ${site.name}:`, error);
            return {
              site,
              volability: 0,
              label: "STOP" as const,
              wind: 0,
              loading: false,
              error: true
            };
          }
        })
      );
      
      const finalRankings = results.map(result => 
        result.status === "fulfilled" ? result.value : result.reason
      );
      setRankings(finalRankings);
    };
    
    fetchAllRankings();
  }, []);

  return rankings;
}

// Helper per generare dati windgram mock (in attesa di API reali)
function generateMockWindgram(altitude: number) {
  return [
    { hour: 9, windSpeed: 8, windDir: 160, altitude: altitude + 500 },
    { hour: 10, windSpeed: 10, windDir: 165, altitude: altitude + 600 },
    { hour: 11, windSpeed: 12, windDir: 170, altitude: altitude + 700 },
    { hour: 12, windSpeed: 14, windDir: 175, altitude: altitude + 800 },
    { hour: 13, windSpeed: 15, windDir: 180, altitude: altitude + 900 },
    { hour: 14, windSpeed: 16, windDir: 185, altitude: altitude + 1000 },
    { hour: 15, windSpeed: 17, windDir: 190, altitude: altitude + 1100 },
    { hour: 16, windSpeed: 16, windDir: 185, altitude: altitude + 1000 },
    { hour: 17, windSpeed: 14, windDir: 180, altitude: altitude + 900 },
    { hour: 18, windSpeed: 11, windDir: 175, altitude: altitude + 800 },
  ];
}
