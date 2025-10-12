'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { useAuth } from "@/context/AuthContext";

// Tipos locales
type CategoriaDb = Database["public"]["Tables"]["foro_categorias"]["Row"];
export type Categoria = CategoriaDb & {
  parent_id?: string | null;
  subcategorias?: Categoria[];
  hilos?: { count: number }[];
};

type HiloDb = Database["public"]["Tables"]["foro_hilos"]["Row"];
export type Hilo = HiloDb & {
  slug?: string | null;
  perfiles: {
    username: string;
    rol: string;
    avatar_url: string | null;
  } | null;
  foro_categorias: {
    nombre: string;
    color?: string | null;
    parent_id?: string | null;
    nivel?: number | null;
  } | null;
  votos_conteo: number;
  respuestas_conteo: number;
  voto_usuario?: number | null; // Se añade dinámicamente
  // Aseguramos que las propiedades opcionales de HiloDb estén aquí si se usan
  contenido: string;
  created_at: string;
  updated_at: string;
  ultimo_post_at?: string | null;
};

export type TabKey = "recientes" | "populares" | "sin_respuesta" | "siguiendo" | "mios";
export type TimeRange = "24h" | "7d";

// Hook personalizado para gestionar los hilos del foro
export function useForoHilos(initialTab: TabKey = "recientes", initialTimeRange: TimeRange = "24h") {
  const { user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Función para obtener la fecha según el rango de tiempo
  const getDateFromRange = (range: TimeRange): string => {
    const now = new Date();
    const from = new Date(now);
    if (range === "24h") {
      from.setHours(now.getHours() - 24);
    } else {
      from.setDate(now.getDate() - 7);
    }
    return from.toISOString();
  };

  // Función para enriquecer hilos con votos del usuario
  const enrichWithUserVotes = async (items: Hilo[]): Promise<Hilo[]> => {
    if (!user || items.length === 0) return items;
    const hiloIds = items.map((h) => h.id);
    const { data: votosData } = await supabase
      .from("foro_votos_hilos")
      .select("hilo_id, valor_voto")
      .eq("usuario_id", user.id)
      .in("hilo_id", hiloIds);
    if (!votosData) return items;
    const votosMap = new Map<string, number>(
      votosData.map((v) => [v.hilo_id as string, v.valor_voto as number])
    );
    return items.map((h) => ({ ...h, voto_usuario: votosMap.get(h.id) || 0 }));
  };

  // Consulta de categorías
  const { data: categorias = [] } = useQuery({
    queryKey: ['foro', 'categorias'],
    queryFn: async () => {
      try {
        // Información básica del entorno (sin exponer secretos)
        const supabaseUrlSafe = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^(https?:\/\/)/, '')
        console.info('[useForoHilos] Iniciando carga de categorías', {
          supabaseUrl: supabaseUrlSafe,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          ts: new Date().toISOString()
        })

        // Probar una consulta mínima para validar conectividad (opcional)
        // Nota: mantenemos la consulta principal, esta preconsulta no es necesaria
      } catch (e) {
        console.warn('[useForoHilos] Aviso antes de query foro_categorias:', e)
      }

      const { data, error } = await supabase
        .from("foro_categorias")
        .select("*")
        .order("orden", { ascending: true })
        .order("nombre", { ascending: true });
      
      if (error) {
        // Log detallado para depurar en producción
        console.error('[useForoHilos] Error al cargar foro_categorias:', {
          message: (error as any)?.message,
          code: (error as any)?.code,
          details: (error as any)?.details,
          hint: (error as any)?.hint
        });
        throw new Error("Error al cargar categorías");
      }
      
      // Organizar categorías de forma jerárquica
      const categoriasPlanas = data || [];
      console.info('[useForoHilos] Categorías planas recibidas:', {
        count: categoriasPlanas.length,
        sample: categoriasPlanas.slice(0, Math.min(3, categoriasPlanas.length))
      })
      const categoriasPrincipales: Categoria[] = [];
      const categoriasMap = new Map<string, Categoria>();
      
      // Crear un mapa de todas las categorías
      categoriasPlanas.forEach(cat => {
        categoriasMap.set(cat.id, { ...cat, subcategorias: [] });
      });
      
      // Organizar la jerarquía
      categoriasPlanas.forEach(cat => {
        const categoria = categoriasMap.get(cat.id)!;
        
        if (!cat.parent_id) {
          // Es una categoría principal
          categoriasPrincipales.push(categoria);
        } else {
          // Es una subcategoría, agregarla a su padre
          const padre = categoriasMap.get(cat.parent_id);
          if (padre) {
            if (!padre.subcategorias) {
              padre.subcategorias = [];
            }
            padre.subcategorias.push(categoria);
          }
        }
      });
      
      console.info('[useForoHilos] Árbol de categorías construido:', {
        roots: categoriasPrincipales.length,
        rootsSample: categoriasPrincipales.slice(0, Math.min(3, categoriasPrincipales.length)).map(c => ({
          id: c.id,
          nombre: c.nombre,
          subCount: c.subcategorias?.length || 0
        }))
      })

      return categoriasPrincipales;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Función para obtener contadores de respuestas en una sola consulta
  const getResponseCountsForHilos = async (hiloIds: string[]): Promise<Record<string, number>> => {
    if (hiloIds.length === 0) return {};
    
    // Inicializar el mapa de contadores con 0 para todos los hilos
    const countsMap: Record<string, number> = {};
    hiloIds.forEach(id => {
      countsMap[id] = 0;
    });
    
    try {
      // Consultar todos los posts para los hilos especificados
      const { data, error } = await supabase
        .from("foro_posts")
        .select("hilo_id")
        .in("hilo_id", hiloIds);
      
      if (error) {
        throw error;
      }
      
      // Contar manualmente las respuestas para cada hilo
      if (data) {
        data.forEach((post: any) => {
          const hiloId = post.hilo_id;
          countsMap[hiloId] = (countsMap[hiloId] || 0) + 1;
        });
      }
      
      return countsMap;
    } catch (error) {
      console.error("Error al obtener contadores de respuestas:", error);
      
      // Plan B: hacer consultas individuales si la consulta principal falla
      for (const hiloId of hiloIds) {
        try {
          const { count } = await supabase
            .from("foro_posts")
            .select("*", { count: "exact", head: true })
            .eq("hilo_id", hiloId);
          
          countsMap[hiloId] = count || 0;
        } catch (err) {
          console.error(`Error al obtener conteo para hilo ${hiloId}:`, err);
          // El contador ya está inicializado en 0, no es necesario hacer nada más
        }
      }
      return countsMap;
    }
  };

  // Consulta principal de hilos
  const {
    data,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['foro', 'hilos', activeTab, timeRange, user?.id],
    queryFn: async ({ pageParam = 1 }) => {
      // Base select para hilos
      const baseSelect = `
        *,
        perfiles:autor_id(username, role, avatar_url),
        foro_categorias:categoria_id(nombre, color)
      `;

      // Calcular el rango para la paginación
      const from = (pageParam - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let items: Hilo[] = [];

      if (activeTab === "recientes") {
        const query = supabase
          .from("foro_hilos")
          .select(baseSelect, { count: 'exact' })
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .range(from, to);
          
        const { data, error: hErr, count } = await query;
        if (hErr) throw new Error("No se pudieron cargar los hilos.");
        
        items = data || [];
        items = items.map(item => ({
          ...item,
          votos_conteo: item.votos_conteo || 0,
          respuestas_conteo: 0
        }));
        
        // Cargar conteos de respuestas en una sola consulta
        if (items.length > 0) {
          const hiloIds = items.map(hilo => hilo.id);
          const respuestasCountMap = await getResponseCountsForHilos(hiloIds);
          
          // Asignar contadores a cada hilo
          items = items.map(hilo => ({
            ...hilo,
            respuestas_conteo: respuestasCountMap[hilo.id] || 0
          }));
        }
      } 
      else if (activeTab === "populares") {
        const fromIso = getDateFromRange(timeRange);
        const { data, error: hErr } = await supabase
          .from("foro_hilos")
          .select(baseSelect)
          .is('deleted_at', null)
          .gte("ultimo_post_at", fromIso)
          .order("updated_at", { ascending: false })
          .limit(50);
        if (hErr) throw new Error("No se pudieron cargar los hilos populares.");
        
        items = data || [];
        items = items.map(item => ({
          ...item,
          votos_conteo: item.votos_conteo || 0,
          respuestas_conteo: 0
        }));
        
        // Cargar conteos de respuestas en una sola consulta
        if (items.length > 0) {
          const hiloIds = items.map(hilo => hilo.id);
          const respuestasCountMap = await getResponseCountsForHilos(hiloIds);
          
          // Asignar contadores a cada hilo
          items = items.map(hilo => ({
            ...hilo,
            respuestas_conteo: respuestasCountMap[hilo.id] || 0
          }));
        }
        
        // Ordenar por "popularidad" local
        items = items
          .sort((a, b) => {
            const scoreA = (a.respuestas_conteo ?? 0) * 2 + (a.votos_conteo ?? 0);
            const scoreB = (b.respuestas_conteo ?? 0) * 2 + (b.votos_conteo ?? 0);
            if (scoreB !== scoreA) return scoreB - scoreA;
            return (
              new Date(b.updated_at || b.created_at).getTime() -
              new Date(a.updated_at || a.created_at).getTime()
            );
          })
          .slice(0, 20);
      } 
      else if (activeTab === "sin_respuesta") {
        const { data, error: hErr } = await supabase
          .from("foro_hilos")
          .select(baseSelect)
          .is('deleted_at', null)
          .order("created_at", { ascending: false })
          .limit(50);
        if (hErr) throw new Error("No se pudieron cargar los hilos.");
        
        items = data || [];
        items = items.map(item => ({
          ...item,
          votos_conteo: item.votos_conteo || 0,
          respuestas_conteo: 0
        }));
        
        // Cargar conteos de respuestas en una sola consulta
        if (items.length > 0) {
          const hiloIds = items.map(hilo => hilo.id);
          const respuestasCountMap = await getResponseCountsForHilos(hiloIds);
          
          // Asignar contadores a cada hilo
          items = items.map(hilo => ({
            ...hilo,
            respuestas_conteo: respuestasCountMap[hilo.id] || 0
          }));
        }
        
        // Filtrar solo los hilos sin respuestas
        items = items
          .filter((h) => (h.respuestas_conteo ?? 0) === 0)
          .slice(0, 20);
      } 
      else if (activeTab === "siguiendo") {
        if (!user) {
          return [];
        }
        
        const { data: seg, error: sErr } = await supabase
          .from("foro_seguimiento")
          .select("hilo_id")
          .eq("usuario_id", user.id);
        if (sErr) throw new Error("No se pudieron cargar tus hilos seguidos.");
        
        const ids = (seg || []).map((s) => s.hilo_id as string);
        if (ids.length === 0) {
          return [];
        }
        
        const { data, error: hErr } = await supabase
          .from("foro_hilos")
          .select(baseSelect)
          .in("id", ids)
          .is('deleted_at', null)
          .order("updated_at", { ascending: false })
          .limit(50);
        if (hErr) throw new Error("No se pudieron cargar los hilos seguidos.");
        
        items = data || [];
        items = items.map(item => ({
          ...item,
          votos_conteo: item.votos_conteo || 0,
          respuestas_conteo: 0
        }));
        
        // Cargar conteos de respuestas en una sola consulta
        if (items.length > 0) {
          const hiloIds = items.map(hilo => hilo.id);
          const respuestasCountMap = await getResponseCountsForHilos(hiloIds);
          
          // Asignar contadores a cada hilo
          items = items.map(hilo => ({
            ...hilo,
            respuestas_conteo: respuestasCountMap[hilo.id] || 0
          }));
        }
      } 
      else if (activeTab === "mios") {
        if (!user) {
          return [];
        }
        
        const { data, error: hErr } = await supabase
          .from("foro_hilos")
          .select(baseSelect)
          .eq("autor_id", user.id)
          .is('deleted_at', null)
          .order("updated_at", { ascending: false })
          .limit(50);
        if (hErr) throw new Error("No se pudieron cargar tus hilos.");
        
        items = data || [];
        items = items.map(item => ({
          ...item,
          votos_conteo: item.votos_conteo || 0,
          respuestas_conteo: 0
        }));
        
        // Cargar conteos de respuestas en una sola consulta
        if (items.length > 0) {
          const hiloIds = items.map(hilo => hilo.id);
          const respuestasCountMap = await getResponseCountsForHilos(hiloIds);
          
          // Asignar contadores a cada hilo
          items = items.map(hilo => ({
            ...hilo,
            respuestas_conteo: respuestasCountMap[hilo.id] || 0
          }));
        }
      }

      // Enriquecer con votos del usuario
      return await enrichWithUserVotes(items);
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false, // No recargar automáticamente al cambiar de pestaña
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Si la última página tiene menos elementos que el tamaño de página,
      // significa que no hay más páginas
      return lastPage.length < pageSize ? undefined : allPages.length + 1;
    },
  });
  
  // Extraer todos los hilos de las páginas
  const hilos = data?.pages.flat() || [];

  // Función para manejar votos
  const handleVote = async (hiloId: string, valorVoto: 1 | -1) => {
    if (!user) {
      alert("Debes iniciar sesión para votar.");
      return;
    }

    // Optimistic update
    queryClient.setQueryData(['foro', 'hilos', activeTab, timeRange, user?.id], (oldData: any) => {
      if (!oldData || !oldData.pages) return { pages: [], pageParams: [] };
      
      const newPages = oldData.pages.map(page => page.map(hilo => {
        if (hilo.id !== hiloId) return hilo;
        
        const votoPrevio = hilo.voto_usuario || 0;
        const nuevoVoto = votoPrevio === valorVoto ? 0 : valorVoto;
        const votosConteoPrevio = hilo.votos_conteo || 0;
        const nuevoConteo = votosConteoPrevio - votoPrevio + nuevoVoto;
        
        return {
          ...hilo,
          voto_usuario: nuevoVoto,
          votos_conteo: nuevoConteo
        };
      }));
      
      return {
        ...oldData,
        pages: newPages
      };
    });

    try {
      // Obtener el voto actual del usuario para este hilo
      const { data: votoActual } = await supabase
        .from("foro_votos_hilos")
        .select("valor_voto")
        .eq("hilo_id", hiloId)
        .eq("usuario_id", user.id)
        .single();
      
      // Determinar si debemos eliminar el voto (si el usuario ya votó con el mismo valor)
      const shouldDelete = votoActual?.valor_voto === valorVoto;
      
      if (shouldDelete) {
        await supabase
          .from("foro_votos_hilos")
          .delete()
          .match({ hilo_id: hiloId, usuario_id: user.id });
      } else {
        await supabase
          .from("foro_votos_hilos")
          .upsert(
            { 
              hilo_id: hiloId, 
              usuario_id: user.id, 
              valor_voto: valorVoto
            },
            { 
              onConflict: 'hilo_id,usuario_id'
            }
          );
      }
    } catch (error) {
      console.error('Error al procesar el voto:', error);
      // Revertir el cambio optimista en caso de error
      refetch();
    }
  };

  // Función para cargar más hilos
  const loadMoreHilos = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  // Efecto para manejar el cambio de pestaña o rango de tiempo
  useEffect(() => {
    // Reiniciar la consulta cuando cambia la pestaña o el rango de tiempo
    refetch();
  }, [activeTab, timeRange, refetch]);

  // Efecto para manejar la visibilidad de la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Opcional: refrescar datos solo si han pasado X minutos desde la última actualización
        const lastUpdate = queryClient.getQueryState(['foro', 'hilos', activeTab, timeRange, user?.id])?.dataUpdatedAt;
        const now = Date.now();
        
        if (lastUpdate && (now - lastUpdate > 5 * 60 * 1000)) { // 5 minutos
          refetch();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTab, timeRange, user?.id, page, queryClient, refetch]);

  return {
    hilos,
    categorias,
    isLoading,
    isRefetching,
    isError,
    error,
    activeTab,
    setActiveTab,
    timeRange,
    setTimeRange,
    handleVote,
    loadMoreHilos,
    hasNextPage,
    isFetchingNextPage
  };
}
