"use client"

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserInitials } from '@/lib/utils/avatar-utils';
import type { Database } from '@/lib/database.types';
import ForoBtnFlotante from './ForoBtnFlotante';
import ForoFiltrosModal, { ForoFiltersState } from './ForoFiltrosModal';

// Tipos locales para el componente
type CategoriaDb = Database['public']['Tables']['foro_categorias']['Row'];
export type Categoria = CategoriaDb & {
  parent_id?: string | null;
  subcategorias?: Categoria[];
  hilos?: { count: number }[];
};

type HiloDb = Database['public']['Tables']['foro_hilos']['Row'];
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
};

const stripHtml = (html: string | null) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'hace un momento';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'fecha desconocida';
  }
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};

const InvitacionRegistro = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white dark:bg-black p-8 rounded-lg text-center my-8 border border-gray-200 dark:border-gray-800 shadow-lg"
  >
    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Únete a la Discusión</h2>
    <p className="text-gray-600 dark:text-gray-200 mb-6 max-w-2xl mx-auto">
      Regístrate para crear tus propios hilos, responder a otros, votar en las publicaciones y ser parte activa de nuestra creciente comunidad.
    </p>
    <div className="flex justify-center gap-4">
      <Link href="/foro/crear-hilo" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0">
        Crear Nuevo Hilo
      </Link>
      <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-black dark:border-gray-700 dark:text-white dark:hover:bg-black font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
        <Link href="/login">Iniciar Sesión</Link>
      </Button>
    </div>
  </motion.div>
);

type TabKey = 'recientes' | 'populares' | 'sin_respuesta' | 'siguiendo' | 'mios';
type TimeRange = '24h' | '7d';

export default function ForoCliente() {
  const { user, loading: userLoading } = useAuth();
  const supabase = createClient();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [hilos, setHilos] = useState<Hilo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('recientes');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estado para los filtros
  const [filters, setFilters] = useState<ForoFiltersState>({
    tab: activeTab,
    timeRange: timeRange
  });

  const handleVote = async (hiloId: string, valorVoto: 1 | -1) => {
    if (!user) {
      alert('Debes iniciar sesión para votar.');
      return;
    }

    const hiloIndex = hilos.findIndex(h => h.id === hiloId);
    if (hiloIndex === -1) return;

    const hilo = hilos[hiloIndex];
    const votoPrevio = hilo.voto_usuario || 0;
    const nuevoVoto = votoPrevio === valorVoto ? 0 : valorVoto;

    const hilosActualizados = [...hilos];
    const votosConteoPrevio = hilo.votos_conteo || 0;
    let nuevoConteo = votosConteoPrevio - votoPrevio + nuevoVoto;

    hilosActualizados[hiloIndex] = { ...hilo, voto_usuario: nuevoVoto, votos_conteo: nuevoConteo };
    setHilos(hilosActualizados);

    if (nuevoVoto === 0) {
      await supabase.from('foro_votos_hilos').delete().match({ hilo_id: hiloId, usuario_id: user.id });
    } else {
      await supabase.from('foro_votos_hilos').upsert({ hilo_id: hiloId, usuario_id: user.id, valor_voto: nuevoVoto }, { onConflict: 'hilo_id,usuario_id' });
    }
  };

  // Utilidad para convertir selects con count a números
  type CountAgg = { count?: number } | { count?: number }[] | null;
  type RowWithAgg = Partial<Hilo> & { votos_conteo: CountAgg; respuestas_conteo: CountAgg };

  const normalizeCounts = (rows: RowWithAgg[]): Hilo[] => {
    const normalized = rows.map((hilo: RowWithAgg) => {
      const votos = hilo.votos_conteo as CountAgg;
      const respuestas = hilo.respuestas_conteo as CountAgg;
      const votosCount = Array.isArray(votos) ? (votos?.[0]?.count ?? 0) : (votos?.count ?? 0);
      const respuestasCount = Array.isArray(respuestas) ? (respuestas?.[0]?.count ?? 0) : (respuestas?.count ?? 0);
      return { ...(hilo as Hilo), votos_conteo: votosCount ?? 0, respuestas_conteo: respuestasCount ?? 0 } as Hilo;
    });
    return normalized as Hilo[];
  };

  const enrichWithUserVotes = async (items: Hilo[]): Promise<Hilo[]> => {
    if (!user || items.length === 0) return items;
    const hiloIds = items.map(h => h.id);
    const { data: votosData } = await supabase
      .from('foro_votos_hilos')
      .select('hilo_id, valor_voto')
      .eq('usuario_id', user.id)
      .in('hilo_id', hiloIds);
    if (!votosData) return items;
    const votosMap = new Map<string, number>(votosData.map(v => [v.hilo_id as string, v.valor_voto as number]));
    return items.map(h => ({ ...h, voto_usuario: votosMap.get(h.id) || 0 }));
  };

  const getDateFromRange = (range: TimeRange): string => {
    const now = new Date();
    const from = new Date(now);
    if (range === '24h') {
      from.setHours(now.getHours() - 24);
    } else {
      from.setDate(now.getDate() - 7);
    }
    return from.toISOString();
  };

  const loadHilos = async (tab: TabKey) => {
    // Solo mostrar loader global en la primera carga
    if (!initialLoaded) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      // Cargar categorías una vez (si aún no)
      if (categorias.length === 0) {
        const { data: categoriasData, error: catError } = await supabase
          .from('foro_categorias')
          .select('*, hilos:foro_hilos!categoria_id(count)')
          .order('nombre', { ascending: true });
        if (catError) throw new Error('Error al cargar categorías');
        setCategorias(categoriasData || []);
      }

      // Base select para hilos
      const baseSelect = `
        *,
        votos_conteo:foro_votos_hilos(count),
        respuestas_conteo:foro_posts(count),
        actualizado_en,
        perfiles:autor_id(username, rol:role, avatar_url),
        foro_categorias(nombre, color, parent_id, nivel)
      `;

      if (tab === 'recientes') {
        const { data, error: hErr } = await supabase
          .from('foro_hilos')
          .select(baseSelect)
          .order('actualizado_en', { ascending: false })
          .limit(20);
        if (hErr) throw new Error('No se pudieron cargar los hilos.');
        let items = normalizeCounts(data || []);
        items = await enrichWithUserVotes(items);
        setHilos(items);
      } else if (tab === 'populares') {
        const fromIso = getDateFromRange(timeRange);
        const { data, error: hErr } = await supabase
          .from('foro_hilos')
          .select(baseSelect)
          .gte('ultimo_post_at', fromIso)
          .order('actualizado_en', { ascending: false })
          .limit(50);
        if (hErr) throw new Error('No se pudieron cargar los hilos populares.');
        let items = normalizeCounts(data || []);
        // Ordenar por "popularidad" local: respuestas desc, votos desc, último post reciente
        items = items
          .sort((a, b) => {
            const scoreA = (a.respuestas_conteo ?? 0) * 2 + (a.votos_conteo ?? 0);
            const scoreB = (b.respuestas_conteo ?? 0) * 2 + (b.votos_conteo ?? 0);
            if (scoreB !== scoreA) return scoreB - scoreA;
            return new Date(b.actualizado_en || b.creado_en).getTime() - new Date(a.actualizado_en || a.creado_en).getTime();
          })
          .slice(0, 20);
        items = await enrichWithUserVotes(items);
        setHilos(items);
      } else if (tab === 'sin_respuesta') {
        const { data, error: hErr } = await supabase
          .from('foro_hilos')
          .select(baseSelect)
          .order('created_at', { ascending: false })
          .limit(50);
        if (hErr) throw new Error('No se pudieron cargar los hilos.');
        let items = normalizeCounts(data || []);
        items = items.filter(h => (h.respuestas_conteo ?? 0) === 0).slice(0, 20);
        items = await enrichWithUserVotes(items);
        setHilos(items);
      } else if (tab === 'siguiendo') {
        if (!user) {
          setHilos([]);
        } else {
          const { data: seg, error: sErr } = await supabase
            .from('foro_seguimiento')
            .select('hilo_id')
            .eq('usuario_id', user.id);
          if (sErr) throw new Error('No se pudieron cargar tus hilos seguidos.');
          const ids = (seg || []).map(s => s.hilo_id as string);
          if (ids.length === 0) {
            setHilos([]);
          } else {
            const { data, error: hErr } = await supabase
              .from('foro_hilos')
              .select(baseSelect)
              .in('id', ids)
              .order('actualizado_en', { ascending: false })
              .limit(50);
            if (hErr) throw new Error('No se pudieron cargar los hilos seguidos.');
            let items = normalizeCounts(data || []);
            items = await enrichWithUserVotes(items);
            setHilos(items);
          }
        }
      } else if (tab === 'mios') {
        if (!user) {
          setHilos([]);
        } else {
          const { data, error: hErr } = await supabase
            .from('foro_hilos')
            .select(baseSelect)
            .eq('autor_id', user.id)
            .order('actualizado_en', { ascending: false })
            .limit(50);
          if (hErr) throw new Error('No se pudieron cargar tus hilos.');
          let items = normalizeCounts(data || []);
          items = await enrichWithUserVotes(items);
          setHilos(items);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al cargar los hilos');
    } finally {
      if (!initialLoaded) {
        setIsLoading(false);
        setInitialLoaded(true);
      }
      setIsRefreshing(false);
    }
  };

  // Función para aplicar filtros
  const aplicarFiltros = () => {
    setActiveTab(filters.tab);
    setTimeRange(filters.timeRange);
  };

  // Efecto para sincronizar los filtros con el estado del componente
  useEffect(() => {
    setFilters({
      tab: activeTab,
      timeRange: timeRange
    });
  }, [activeTab, timeRange]);

  useEffect(() => {
    loadHilos(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, timeRange]);

  if ((isLoading && !initialLoaded) || userLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-black transition-colors duration-300">
        <div className="flex items-center justify-center p-6 rounded-lg bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 shadow-md">
          <Loader2 className="h-16 w-16 animate-spin text-sky-600 dark:text-sky-500" />
          <p className="ml-4 text-xl font-medium text-gray-800 dark:text-white">Cargando el foro...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-black transition-colors duration-300">
        <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-gray-50 dark:bg-black border border-red-200 dark:border-red-900 shadow-md max-w-md mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 dark:text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xl font-medium text-gray-800 dark:text-white mb-2">Error</p>
          <p className="text-red-600 dark:text-red-500 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="container mx-auto px-2 sm:px-3 lg:px-4 py-8">
        <header className="mb-8 text-left">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-sky-500 to-blue-600 dark:from-sky-400 dark:to-blue-500"
          >
            Foros
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }} 
            className="mt-3 max-w-xl text-base text-gray-600 dark:text-gray-300"
          >
            Un espacio para discutir, compartir y aprender con la comunidad.
          </motion.p>
        </header>

        {!user && <InvitacionRegistro />}

        <div className="flex flex-col lg:flex-row gap-8">
          <main className="w-full lg:flex-1">
            <div className="bg-white dark:bg-black p-6 rounded-lg shadow-none border-0 transition-colors duration-300 outline-none ring-0 focus:outline-none focus:ring-0">
              <div className="flex justify-end mb-6">
                {user && (
                  <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0">
                    <Link href="/foro/crear-hilo">Crear Nuevo Hilo</Link>
                  </Button>
                )}
              </div>

              <div className={`space-y-4 transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
                  {activeTab === 'siguiendo' && !user && (
                    <div className="text-center text-sm text-gray-600 dark:text-gray-300 py-6">Inicia sesión para ver los hilos que sigues.</div>
                  )}
                  {activeTab === 'mios' && !user && (
                    <div className="text-center text-sm text-gray-600 dark:text-gray-300 py-6">Inicia sesión para ver tus hilos.</div>
                  )}
                  <div className="space-y-4">
                  {hilos.map(hilo => (
                    <motion.div
                      key={hilo.id}
                      initial={initialLoaded ? false : { opacity: 0, y: 4 }}
                      animate={initialLoaded ? undefined : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="bg-gray-50 dark:bg-black rounded-lg flex border border-gray-200 dark:border-gray-800 hover:border-sky-500/50 transition-all duration-300"
                    >
                      <div className="flex flex-col items-center p-2 bg-gray-100 dark:bg-black rounded-l-lg transition-colors duration-300">
                        <button onClick={() => handleVote(hilo.id, 1)} className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 transition-colors">
                          <ArrowBigUp className={`h-5 w-5 ${hilo.voto_usuario === 1 ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'}`} />
                        </button>
                        <span className={`font-bold text-sm my-1 ${hilo.voto_usuario === 1 ? 'text-orange-500' : hilo.voto_usuario === -1 ? 'text-blue-500' : 'text-gray-800 dark:text-gray-200'}`}>
                          {hilo.votos_conteo || 0}
                        </span>
                        <button onClick={() => handleVote(hilo.id, -1)} className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 transition-colors">
                          <ArrowBigDown className={`h-5 w-5 ${hilo.voto_usuario === -1 ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`} />
                        </button>
                      </div>
                      <div className="p-3 flex-1">
                        <div className="flex justify-between items-center flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                          <div className="flex items-center gap-x-2">
                            <Avatar className="h-6 w-6 mr-1">
                              <AvatarImage 
                                src={hilo.perfiles?.avatar_url ?? undefined} 
                                alt={`Avatar de ${hilo.perfiles?.username || 'Anónimo'}`} 
                                crossOrigin="anonymous" 
                              />
                              <AvatarFallback>{getUserInitials(hilo.perfiles?.username, 1, 'A')}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-gray-700 dark:text-white">{hilo.perfiles?.username || 'Anónimo'}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{formatDate(hilo.created_at)}</span>
                          </div>
                          {hilo.foro_categorias && (
                            <span className="font-bold uppercase px-2 py-1 rounded-full text-white text-[10px]" 
                              style={{ backgroundColor: hilo.foro_categorias.color || '#7c3aed' }}>
                              {hilo.foro_categorias.nombre}
                            </span>
                          )}
                        </div>
                        <Link href={`/foro/hilos/${hilo.slug ?? hilo.id}`} className="text-lg font-semibold text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 transition-colors duration-200">
                          {hilo.titulo}
                        </Link>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: stripHtml(hilo.contenido) || '' }} />
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{hilo.respuestas_conteo || 0} comentarios</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* Botón flotante para móvil */}
      <ForoBtnFlotante 
        hayFiltrosActivos={activeTab !== 'recientes' || timeRange !== '24h'}
        onAbrirFiltros={() => {}}
        usuarioAutenticado={!!user}
        onCambiarFiltro={setActiveTab}
        filtroActivo={activeTab}
      />
      
    </div>
  );
}
