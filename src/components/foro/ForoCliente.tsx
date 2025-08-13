"use client"

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Database } from '@/lib/database.types';

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
    className="bg-white dark:bg-gradient-to-r dark:from-gray-900 dark:via-gray-800 dark:to-black amoled:bg-black p-8 rounded-lg text-center my-8 border border-gray-200 dark:border-gray-700 amoled:border-gray-800 shadow-lg"
  >
    <h2 className="text-3xl font-bold text-gray-900 dark:text-white amoled:text-white mb-4">Únete a la Discusión</h2>
    <p className="text-gray-600 dark:text-gray-300 amoled:text-gray-200 mb-6 max-w-2xl mx-auto">
      Regístrate para crear tus propios hilos, responder a otros, votar en las publicaciones y ser parte activa de nuestra creciente comunidad.
    </p>
    <div className="flex justify-center gap-4">
      <Link href="/foro/crear-hilo" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0">
        Crear Nuevo Hilo
      </Link>
      <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-700 amoled:border-gray-700 amoled:text-white amoled:hover:bg-gray-800 font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
        <Link href="/login">Iniciar Sesión</Link>
      </Button>
    </div>
  </motion.div>
);

type TabKey = 'recientes' | 'populares' | 'sin_respuesta' | 'siguiendo' | 'mios';
type TimeRange = '24h' | 'semana';

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
        perfiles:autor_id(username, rol:role, avatar_url),
        foro_categorias(nombre, color, parent_id, nivel)
      `;

      if (tab === 'recientes') {
        const { data, error: hErr } = await supabase
          .from('foro_hilos')
          .select(baseSelect)
          .order('ultimo_post_at', { ascending: false })
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
          .order('ultimo_post_at', { ascending: false })
          .limit(50);
        if (hErr) throw new Error('No se pudieron cargar los hilos populares.');
        let items = normalizeCounts(data || []);
        // Ordenar por "popularidad" local: respuestas desc, votos desc, último post reciente
        items = items
          .sort((a, b) => {
            const scoreA = (a.respuestas_conteo ?? 0) * 2 + (a.votos_conteo ?? 0);
            const scoreB = (b.respuestas_conteo ?? 0) * 2 + (b.votos_conteo ?? 0);
            if (scoreB !== scoreA) return scoreB - scoreA;
            return new Date(b.ultimo_post_at || b.created_at).getTime() - new Date(a.ultimo_post_at || a.created_at).getTime();
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
              .order('ultimo_post_at', { ascending: false })
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
            .order('ultimo_post_at', { ascending: false })
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

  useEffect(() => {
    loadHilos(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, timeRange]);

  if ((isLoading && !initialLoaded) || userLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-black">
        <Loader2 className="h-16 w-16 animate-spin text-gray-900 dark:text-white" />
        <p className="ml-4 text-gray-900 dark:text-white">Cargando el foro...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-10 bg-white dark:bg-black">{error}</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-950 amoled:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-300">
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
            className="mt-3 max-w-xl text-base text-gray-600 dark:text-gray-400 amoled:text-gray-300"
          >
            Un espacio para discutir, compartir y aprender con la comunidad.
          </motion.p>
        </header>

        {!user && <InvitacionRegistro />}

        <div className="flex flex-col lg:flex-row gap-8">
          <main className="w-full lg:flex-1">
            <div className="bg-white dark:bg-gray-900 amoled:bg-black p-6 rounded-lg shadow-none border-0 transition-colors duration-300 outline-none ring-0 focus:outline-none focus:ring-0">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className={`px-3 py-1.5 rounded-full text-sm border outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${activeTab === 'recientes' ? 'bg-sky-600 text-white border-sky-600' : 'bg-transparent text-gray-700 dark:text-gray-200 amoled:text-gray-300 border-gray-300 dark:border-gray-700'}`}
                      onClick={() => setActiveTab('recientes')}
                    >Recientes</button>
                    <button
                      className={`px-3 py-1.5 rounded-full text-sm border outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${activeTab === 'populares' ? 'bg-sky-600 text-white border-sky-600' : 'bg-transparent text-gray-700 dark:text-gray-200 amoled:text-gray-300 border-gray-300 dark:border-gray-700'}`}
                      onClick={() => setActiveTab('populares')}
                    >Populares</button>
                    <button
                      className={`px-3 py-1.5 rounded-full text-sm border outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${activeTab === 'sin_respuesta' ? 'bg-sky-600 text-white border-sky-600' : 'bg-transparent text-gray-700 dark:text-gray-200 amoled:text-gray-300 border-gray-300 dark:border-gray-700'}`}
                      onClick={() => setActiveTab('sin_respuesta')}
                    >Sin respuesta</button>
                    <button
                      className={`px-3 py-1.5 rounded-full text-sm border outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${activeTab === 'siguiendo' ? 'bg-sky-600 text-white border-sky-600' : 'bg-transparent text-gray-700 dark:text-gray-200 amoled:text-gray-300 border-gray-300 dark:border-gray-700'}`}
                      onClick={() => setActiveTab('siguiendo')}
                    >Siguiendo</button>
                    <button
                      className={`px-3 py-1.5 rounded-full text-sm border outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${activeTab === 'mios' ? 'bg-sky-600 text-white border-sky-600' : 'bg-transparent text-gray-700 dark:text-gray-200 amoled:text-gray-300 border-gray-300 dark:border-gray-700'}`}
                      onClick={() => setActiveTab('mios')}
                    >Mis hilos</button>
                  </div>
                  {activeTab === 'populares' && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Periodo:</span>
                      <button
                        className={`px-3 py-1 rounded border outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${timeRange === '24h' ? 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600' : 'border-gray-300 dark:border-gray-700'}`}
                        onClick={() => setTimeRange('24h')}
                      >24h</button>
                      <button
                        className={`px-3 py-1 rounded border outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${timeRange === 'semana' ? 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600' : 'border-gray-300 dark:border-gray-700'}`}
                        onClick={() => setTimeRange('semana')}
                      >Semana</button>
                    </div>
                  )}
                </div>
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
                      className="bg-gray-50 dark:bg-gray-800/60 amoled:bg-gray-900/70 rounded-lg flex border border-gray-200 dark:border-gray-700 amoled:border-gray-800 hover:border-sky-500/50 transition-all duration-300"
                    >
                      <div className="flex flex-col items-center p-2 bg-gray-100 dark:bg-gray-900/50 amoled:bg-black/50 rounded-l-lg transition-colors duration-300">
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
                            <span className="font-semibold text-gray-700 dark:text-gray-300 amoled:text-white">{hilo.perfiles?.username || 'Anónimo'}</span>
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
                        <div className="text-sm text-gray-600 dark:text-gray-400 amoled:text-gray-300 mt-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: stripHtml(hilo.contenido) || '' }} />
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
    </div>
  );
}
