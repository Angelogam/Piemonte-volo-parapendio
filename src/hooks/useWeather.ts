import { useQuery, useQueries } from "@tanstack/react-query";
import { fetchWeather, fetchRanking } from "@/lib/weatherApi";
import { LaunchSite, SiteRanking } from "@/types/weather";
import { SITES } from "@/constants/sites";

export function useWeather(site: LaunchSite) {
  return useQuery({
    queryKey: ["weather", site.id],
    queryFn: () => fetchWeather(site),
    staleTime: 1000 * 60 * 30,
    retry: 2,
  });
}

export function useAllSiteRankings(): SiteRanking[] {
  const results = useQueries({
    queries: SITES.map((site) => ({
      queryKey: ["ranking", site.id],
      queryFn: () => fetchRanking(site),
      staleTime: 1000 * 60 * 20,
      retry: 1,
    })),
  });

  return SITES.map((site, i) => {
    const r = results[i];
    if (r.isLoading || !r.data) {
      return { site, volability: 0, label: "STOP" as const, wind: 0, gust: 0, thermalMs: 0, cloudbaseM: 0, loading: r.isLoading, error: r.isError };
    }
    return { site, ...r.data, loading: false, error: false };
  });
}
