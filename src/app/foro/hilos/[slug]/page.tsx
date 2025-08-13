import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Comentarios from '@/components/ComentariosNuevo';
import { MessageSquare, Share2, Star, Lock, CheckCircle2, Plus } from 'lucide-react';

async function getHiloPorSlugOId(slugOrId: string) {
  const supabase = createServerComponentClient({ cookies });
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

export default async function HiloPage({ params }: { params: { slug: string } }) {
  const supabase = createServerComponentClient({ cookies });
  const hilo = await getHiloPorSlugOId(params.slug);

  // Datos auxiliares: categoría padre, etiquetas, respuestas, relacionados
  const [{ data: catFull }, { data: etiquetasRel }, { data: posts } , { data: relacionados }] = await Promise.all([
    supabase
      .from('foro_categorias')
      .select('id, nombre, color, slug, parent_id')
      .eq('id', hilo.categoria_id)
      .single(),
    supabase
      .from('foro_hilos_etiquetas')
      .select('etiqueta:foro_etiquetas ( id, nombre, color )')
      .eq('hilo_id', hilo.id),
    supabase
      .from('foro_posts')
      .select('id, contenido, autor:perfiles(username, avatar_url), created_at')
      .eq('hilo_id', hilo.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('foro_hilos')
      .select('id, slug, titulo')
      .eq('categoria_id', hilo.categoria_id)
      .neq('id', hilo.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const parentCat = catFull?.parent_id
    ? (await supabase.from('foro_categorias').select('id, nombre, slug').eq('id', catFull.parent_id).single()).data
    : null;

  const etiquetas = (etiquetasRel || []).map((r: any) => r.etiqueta).filter(Boolean) as { id: string; nombre: string; color?: string | null }[];
  const respuestas = posts || [];
  const esResuelto = false; // pendiente: calcular cuando exista soporte de "mejor respuesta"

  return (
    <div className="container mx-auto py-6 px-3 lg:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Contenido principal */}
        <div className="lg:col-span-8">
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
          <article className="bg-white dark:bg-gray-900 amoled:bg-black rounded-lg border border-gray-200 dark:border-gray-700 amoled:border-gray-800 shadow-sm">
            <header className="p-5 border-b border-gray-200 dark:border-gray-700 amoled:border-gray-800">
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
              <div className="mt-4 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 amoled:text-gray-200">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={hilo.autor?.avatar_url ?? undefined} alt={hilo.autor?.username ?? 'Autor'} />
                  <AvatarFallback>{hilo.autor?.username?.substring(0, 2).toUpperCase() ?? 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold">{hilo.autor?.username ?? 'Autor desconocido'}</span>
                  <span>•</span>
                  <time>Creado el {format(new Date(hilo.created_at), "d 'de' MMM yyyy, HH:mm", { locale: es })}</time>
                  {hilo.updated_at && (
                    <>
                      <span>•</span>
                      <time>Última edición {format(new Date(hilo.updated_at), "d MMM, HH:mm", { locale: es })}</time>
                    </>
                  )}
                  <span>•</span>
                  <span>{(hilo.vistas ?? 0)} vistas</span>
                  <span>•</span>
                  <span>{respuestas.length} respuestas</span>
                </div>
              </div>
            </header>

              {/* Contenido del post inicial */}
              <div className="p-5">
              <div className="prose max-w-none prose-headings:my-4 prose-p:my-3 prose-strong:text-gray-900 dark:prose-invert amoled:prose-invert amoled:[--tw-prose-body:theme(colors.white)] amoled:[--tw-prose-headings:theme(colors.white)] amoled:[--tw-prose-quotes:theme(colors.white)] amoled:[--tw-prose-bullets:theme(colors.slate.300)] amoled:[--tw-prose-links:theme(colors.sky.400)]">
                <div dangerouslySetInnerHTML={{ __html: hilo.contenido ?? '' }} />
              </div>
              </div>
          </article>

          {/* Comentarios (idéntico a noticias) */}
          <section className="mt-6">
            <Comentarios tipoEntidad="hilo" entidadId={hilo.id} limite={10} />
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Módulo: Relacionados */}
          <div className="bg-white dark:bg-gray-900 amoled:bg-black rounded-lg border border-gray-200 dark:border-gray-700 amoled:border-gray-800 p-4">
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
          <div className="bg-white dark:bg-gray-900 amoled:bg-black rounded-lg border border-gray-200 dark:border-gray-700 amoled:border-gray-800 p-4">
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
    </div>
  );
}
