'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import ForoSidebar from '@/components/foro/ForoSidebar';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ComentariosNuevo from '../../../../components/ComentariosNuevo';
import { MessageSquare, Share2, Star, Lock, CheckCircle2, Plus, Calendar, Clock, Eye, MessageCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Cargar dinámicamente el componente YoutubePlayer para evitar problemas de hidratación
const YoutubePlayer = dynamic<{ 
  videoId: string; 
  title?: string;
  className?: string;
}>(
  () => import('@/components/ui/YoutubePlayer').then(mod => mod.YoutubePlayer),
  { 
    ssr: false,
    loading: () => (
      <div 
        className="youtube-placeholder w-full bg-gray-100 dark:bg-gray-800 rounded-lg" 
        style={{
          aspectRatio: '16/9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="animate-pulse text-gray-400">Cargando video...</div>
      </div>
    )
  }
);

async function getHiloPorSlugOId(slugOrId: string) {
  const supabase = createClient();
  // Primero por slug
  let { data: hilo, error } = await supabase
    .from('foro_hilos')
    .select(`
      *,
      autor:perfiles ( username, avatar_url ),
      categoria:foro_categorias ( nombre, color )
    `)
    .eq('slug', slugOrId)
    .single();

  // Fallback por id si no se encontró por slug
  if (!hilo) {
    const byId = await supabase
      .from('foro_hilos')
      .select(`
        *,
        autor:perfiles ( username, avatar_url ),
        categoria:foro_categorias ( nombre, color )
      `)
      .eq('id', slugOrId)
      .single();
    hilo = byId.data as any;
    error = byId.error as any;
  }

  if (error || !hilo) {
    console.error('Error al buscar el hilo por slug/id:', error?.message);
    notFound();
  }

  return hilo;
}

// Componente para renderizar contenido HTML con soporte para videos de YouTube
const HtmlContentWithYoutube = ({ html, className = '' }: { html: string; className?: string }) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // No renderizar nada en el servidor
  if (!isClient) {
    return (
      <div className={className}>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          Cargando contenido...
        </div>
      </div>
    );
  }

  // Extraer el iframe de YouTube del HTML
  const extractYoutubeIframe = (content: string) => {
    if (!content) return null;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const iframe = tempDiv.querySelector('iframe');
    if (!iframe) return null;
    
    const src = iframe.getAttribute('src') || '';
    const videoId = getYoutubeVideoId(src);
    
    if (!videoId) return null;
    
    // Usar el componente YoutubePlayer importado dinámicamente
    return <YoutubePlayer videoId={videoId} title="Video de YouTube" className="mb-4" />;
  };
  
  // Extraer el contenido sin el iframe de YouTube
  const getContentWithoutYoutube = (content: string) => {
    if (!content) return '';
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Eliminar el iframe de YouTube si existe
    const iframe = tempDiv.querySelector('iframe');
    if (iframe) {
      iframe.remove();
    }
    
    return tempDiv.innerHTML;
  };
  
  const youtubeEmbed = extractYoutubeIframe(html);
  const contentWithoutYoutube = getContentWithoutYoutube(html);
  
  return (
    <div className={className}>
      {youtubeEmbed && (
        <div className="mb-4">
          {youtubeEmbed}
        </div>
      )}
      {contentWithoutYoutube && (
        <div 
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: contentWithoutYoutube }}
        />
      )}
    </div>
  );
};

// Extraer el ID de video de YouTube de una URL
const getYoutubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function HiloPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hilo, setHilo] = useState<any>(null);
  const [catFull, setCatFull] = useState<any>(null);
  const [etiquetasRel, setEtiquetasRel] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [relacionados, setRelacionados] = useState<any[]>([]);
  const [parentCat, setParentCat] = useState<any>(null);
  const [categorias, setCategorias] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener el hilo
        const hiloData = await getHiloPorSlugOId(slug);
        setHilo(hiloData);
        // Incrementar vistas del hilo de forma no bloqueante usando nuestra API por ID
        try {
          if (hiloData?.id) {
            // No necesitamos la respuesta; solo disparar el conteo
            fetch(`/api/foro/hilo/${hiloData.id}`, { cache: 'no-store' }).catch(() => {});
          }
        } catch (_) {
          // Silenciar cualquier error de red para no afectar la UI
        }
        
        // Crear cliente de Supabase (unificado)
        const supabase = createClient();
        
        // Obtener categorías para el sidebar
        const { data: categoriasData } = await supabase
          .from('foro_categorias')
          .select('*');
        setCategorias(categoriasData || []);
        
        // Obtener datos auxiliares
        const [catFullRes, etiquetasRelRes, postsRes, relacionadosRes] = await Promise.all([
          supabase
            .from('foro_categorias')
            .select('id, nombre, color, slug, parent_id')
            .eq('id', hiloData.categoria_id)
            .single(),
          supabase
            .from('foro_hilos_etiquetas')
            .select('etiqueta:foro_etiquetas ( id, nombre, color )')
            .eq('hilo_id', hiloData.id),
          supabase
            .from('foro_posts')
            .select('id, contenido, autor:perfiles(username, avatar_url), created_at')
            .eq('hilo_id', hiloData.id)
            .order('created_at', { ascending: true }),
          supabase
            .from('foro_hilos')
            .select('id, slug, titulo')
            .eq('categoria_id', hiloData.categoria_id)
            .neq('id', hiloData.id)
            .order('created_at', { ascending: false })
            .limit(5),
        ]);
        
        setCatFull(catFullRes.data);
        setEtiquetasRel(etiquetasRelRes.data || []);
        setPosts(postsRes.data || []);
        setRelacionados(relacionadosRes.data || []);
        
        // Obtener categoría padre si existe
        if (catFullRes.data?.parent_id) {
          const parentCatRes = await supabase
            .from('foro_categorias')
            .select('id, nombre, slug')
            .eq('id', catFullRes.data.parent_id)
            .single();
          setParentCat(parentCatRes.data);
        }
      } catch (err: any) {
        console.error('Error al cargar datos:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [slug]);

  // El contador de vistas se actualiza al cargar la página
  // a través de la llamada a la API en el fetch inicial

  // Manejar estados de carga y error
  if (loading) {
    return (
      <div className="container mx-auto py-6 px-3 lg:px-0 text-center">
        <p className="text-lg">Cargando hilo...</p>
      </div>
    );
  }

  if (error || !hilo) {
    return (
      <div className="container mx-auto py-6 px-3 lg:px-0 text-center">
        <p className="text-lg text-red-500">Error: {error || 'No se pudo cargar el hilo'}</p>
      </div>
    );
  }

  const etiquetas = (etiquetasRel || []).map((r: any) => r.etiqueta).filter(Boolean) as { id: string; nombre: string; color?: string | null }[];
  const respuestas = posts || [];
  const esResuelto = false; // pendiente: calcular cuando exista soporte de "mejor respuesta"

  // Añadir logs para depurar
  console.log('Renderizando hilo:', { 
    hiloId: hilo.id,
    hiloIdType: typeof hilo.id
  });

  return (
    <div className="container mx-auto py-6 px-0 lg:px-0">
      <div className="flex flex-col lg:flex-row gap-8">
        <ForoSidebar categorias={categorias} />
        <main className="w-full lg:flex-1 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Contenido principal */}
            <div className="lg:col-span-9">
          {/* Breadcrumbs */}
          <nav className="text-sm mb-3 text-gray-600 dark:text-gray-300 amoled:text-gray-200">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:underline">Inicio</Link></li>
              <li>›</li>
              {parentCat && (
                <>
                  <li><Link href={`/foro/categoria/${parentCat.slug}`} className="hover:underline">{parentCat.nombre}</Link></li>
                  <li>›</li>
                </>
              )}
              {catFull && (
                <>
                  <li><Link href={`/foro/categoria/${catFull.slug}`} className="hover:underline">{catFull.nombre}</Link></li>
                  <li>›</li>
                </>
              )}
              <li className="text-gray-800 dark:text-gray-200 amoled:text-white truncate max-w-[60%]">{hilo.titulo}</li>
            </ol>
          </nav>

          {/* Encabezado del hilo */}
          <article className="bg-white dark:bg-black amoled:bg-black rounded-lg border-b border-gray-200 dark:border-gray-700 amoled:border-gray-800 shadow-sm">
            <header className="p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {catFull?.nombre && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full text-white" style={{ backgroundColor: catFull.color || '#6c757d' }}>{catFull.nombre}</span>
                )}
                {etiquetas.map(tag => (
                  <span key={tag.id} className="text-xs font-semibold px-2 py-1 rounded-full border" style={{ borderColor: tag.color || '#64748b' }}>{tag.nombre}</span>
                ))}
                {hilo.es_fijado && <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full border border-yellow-600 text-yellow-600"><Star size={14}/> Fijado</span>}
                {hilo.es_cerrado && <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full border border-red-600 text-red-600"><Lock size={14}/> Cerrado</span>}
                {esResuelto && <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full border border-emerald-600 text-emerald-600"><CheckCircle2 size={14}/> Resuelto</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-gray-900 dark:text-gray-100 amoled:text-white break-words">{hilo.titulo}</h1>

              {/* Controles rápidos */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link href={`#responder`} className="inline-flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md"><MessageSquare size={16}/> Responder</Link>
                <button className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 amoled:bg-gray-900 amoled:hover:bg-gray-800 amoled:text-white px-3 py-2 rounded-md" title="Seguir hilo" type="button">
                  <Star size={16}/> Seguir
                </button>
                <button className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 amoled:bg-gray-900 amoled:hover:bg-gray-800 amoled:text-white px-3 py-2 rounded-md" title="Compartir" type="button">
                  <Share2 size={16}/> Compartir
                </button>
              </div>

              {/* Metadatos autor */}
              <div className="mt-4 flex gap-3 text-sm text-gray-600 dark:text-gray-300 amoled:text-gray-200">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={hilo.autor?.avatar_url ?? undefined} alt={hilo.autor?.username ?? 'Autor'} />
                  <AvatarFallback>{hilo.autor?.username?.substring(0, 2).toUpperCase() ?? 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold">{hilo.autor?.username ?? 'Autor desconocido'}</span>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-xs">
                    {/* Fecha de creación */}
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="flex-shrink-0" />
                      <time className="truncate">{format(new Date(hilo.created_at), "d MMM yyyy", { locale: es })}</time>
                    </div>
                    
                    {/* Última edición */}
                    {hilo.updated_at && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="flex-shrink-0" />
                        <time className="truncate">{format(new Date(hilo.updated_at), "d MMM, HH:mm", { locale: es })}</time>
                      </div>
                    )}
                    
                    {/* Vistas */}
                    <div className="flex items-center gap-1">
                      <Eye size={14} className="flex-shrink-0" />
                      <span className="truncate">{(hilo.vistas ?? 0)} vistas</span>
                    </div>
                    
                    {/* Respuestas */}
                    <div className="flex items-center gap-1">
                      <MessageCircle size={14} className="flex-shrink-0" />
                      <span className="truncate">{respuestas.length} respuestas</span>
                    </div>
                  </div>
                </div>
              </div>
            </header>

              {/* Contenido del post inicial */}
              <div className="p-5">
                <div className="prose max-w-none prose-headings:my-4 prose-p:my-3 prose-strong:text-gray-900 dark:prose-invert dark:prose-strong:text-white amoled:prose-invert amoled:prose-strong:text-white amoled:[--tw-prose-body:theme(colors.white)] amoled:[--tw-prose-headings:theme(colors.white)] amoled:[--tw-prose-quotes:theme(colors.white)] amoled:[--tw-prose-bullets:theme(colors.slate.300)] amoled:[--tw-prose-links:theme(colors.sky.400)]">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: (hilo.contenido ?? '').replace(
                        /<iframe[^>]*src=\"https?:\/\/(?:www\.)?(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]+)[^>]*>([^<]*)<\/iframe>/g, 
                        (match, videoId) => {
                          return `
                            <div className="aspect-video">
                              <iframe 
                                src="https://www.youtube.com/embed/${videoId}" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen>
                              </iframe>
                            </div>
                          `;
                        }
                      )
                    }} 
                  />
                </div>
              </div>
          </article>

          {/* Comentarios (idéntico a noticias) */}
          <section className="mt-6">
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Módulo: Relacionados */}
          <div className="bg-white dark:bg-black amoled:bg-black rounded-lg border border-gray-200 dark:border-gray-700 amoled:border-gray-800 p-4">
            <h3 className="font-semibold mb-3">Más en {catFull?.nombre || 'la categoría'}</h3>
            <ul className="space-y-2">
              {(relacionados || []).map((r: any) => (
                <li key={r.id}>
                  <Link className="text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300" href={`/foro/hilos/${r.slug ?? r.id}`}>{r.titulo}</Link>
                </li>
              ))}
              {(!relacionados || relacionados.length === 0) && (
                <li className="text-sm text-gray-600 dark:text-gray-300 amoled:text-gray-200">No hay hilos relacionados.</li>
              )}
            </ul>
          </div>

          {/* Módulo: Reglas rápidas */}
          <div className="bg-white dark:bg-black amoled:bg-black rounded-lg border border-gray-200 dark:border-gray-700 amoled:border-gray-800 p-4">
            <h3 className="font-semibold mb-2">Reglas de la categoría</h3>
            <ul className="text-sm list-disc pl-5 text-gray-700 dark:text-gray-300 amoled:text-gray-200 space-y-1">
              <li>Respeta a los demás usuarios.</li>
              <li>Evita spam y contenido fuera de tema.</li>
              <li>Usa etiquetas descriptivas.</li>
              <li>Reporta contenido inapropiado.</li>
            </ul>
          </div>
        </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
