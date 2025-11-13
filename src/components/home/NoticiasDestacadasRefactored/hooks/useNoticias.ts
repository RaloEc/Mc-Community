import { useQuery } from "@tanstack/react-query";
import { CACHE_TIME } from "../constants";
import { Noticia, TabType } from "../types";

export function useNoticias(activeTab: TabType) {
  // Función para obtener noticias
  const fetchNoticias = async (tipo: string): Promise<Noticia[]> => {
    const res = await fetch(
      `/api/noticias?limit=${tipo === "recientes" ? "4" : "5"}&tipo=${tipo}`
    );
    if (!res.ok) {
      throw new Error("Error al cargar las noticias");
    }
    const data = await res.json();
    return data.data || [];
  };

  // Usar React Query para manejar el caché de noticias
  const {
    data: noticias = [],
    isLoading: isLoadingNoticias,
    isError: isErrorNoticias,
  } = useQuery({
    queryKey: ["noticias", activeTab],
    queryFn: () => fetchNoticias(activeTab),
    staleTime: CACHE_TIME,
  });

  // Cargar noticias recientes en paralelo
  const { data: ultimasNoticias = [], isLoading: isLoadingUltimas } = useQuery({
    queryKey: ["noticias", "recientes"],
    queryFn: () => fetchNoticias("recientes"),
    staleTime: CACHE_TIME,
  });

  const loading = isLoadingNoticias || isLoadingUltimas;

  return {
    noticias,
    ultimasNoticias,
    loading,
    isLoadingNoticias,
    isLoadingUltimas,
    isErrorNoticias,
  };
}
