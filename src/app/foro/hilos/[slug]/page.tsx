import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare,
  Share2,
  Star,
  Lock,
  CheckCircle2,
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import ForoSidebar from "@/components/foro/ForoSidebar";
import HiloContenido from "@/components/foro/HiloContenido";
import HiloSidebar from "@/components/foro/HiloSidebar";
import HilosRelacionadosInline from "@/components/foro/HilosRelacionadosInline";
import BotonReportar from "@/components/foro/BotonReportar";
import { Votacion } from "@/components/ui/Votacion";

// Importación dinámica del componente de comentarios para evitar problemas de SSR
const HiloComentariosOptimizado = dynamic(
  () => import("@/components/foro/HiloComentariosOptimizado"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }
);
import {
  getHiloPorSlugOId,
  getEtiquetasHilo,
  getCategoriaParent,
  getHilosRelacionados,
  getCategoriasJerarquicas,
  incrementarVistasHilo,
} from "@/lib/foro/server-actions";
import type { ForoHiloCompleto } from "@/types/foro";

interface PageProps {
  params: {
    slug: string;
  };
}

// Generar metadata dinámica para SEO
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const hilo = await getHiloPorSlugOId(params.slug);

    return {
      title: `${hilo.titulo} | Foro - Mc-Community`,
      description: hilo.contenido.substring(0, 160).replace(/<[^>]*>/g, ""),
      openGraph: {
        title: hilo.titulo,
        description: hilo.contenido.substring(0, 160).replace(/<[^>]*>/g, ""),
        type: "article",
        publishedTime: hilo.created_at,
        modifiedTime: hilo.updated_at || hilo.created_at,
        authors: [hilo.autor?.username || "Usuario"],
      },
    };
  } catch {
    return {
      title: "Hilo no encontrado | Foro - Mc-Community",
    };
  }
}

export default async function HiloPage({ params }: PageProps) {
  // Obtener datos del hilo en el servidor
  const hilo = await getHiloPorSlugOId(params.slug);

  // Incrementar vistas de forma asíncrona (no bloqueante)
  incrementarVistasHilo(hilo.id).catch(() => {
    // Silenciar errores de incremento de vistas
  });

  // Obtener datos relacionados en paralelo
  const [etiquetas, categorias, hilosRelacionados, categoriaParent] =
    await Promise.all([
      getEtiquetasHilo(hilo.id),
      getCategoriasJerarquicas(),
      getHilosRelacionados(hilo.categoria_id, hilo.id),
      hilo.categoria?.parent_id
        ? getCategoriaParent(hilo.categoria.parent_id)
        : Promise.resolve(null),
    ]);

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
                  <li>
                    <Link href="/" className="hover:underline">
                      Inicio
                    </Link>
                  </li>
                  <li>›</li>
                  <li>
                    <Link href="/foro" className="hover:underline">
                      Foro
                    </Link>
                  </li>
                  <li>›</li>
                  {categoriaParent && (
                    <>
                      <li>
                        <Link
                          href={`/foro/categoria/${categoriaParent.slug}`}
                          className="hover:underline"
                        >
                          {categoriaParent.nombre}
                        </Link>
                      </li>
                      <li>›</li>
                    </>
                  )}
                  {hilo.categoria && (
                    <>
                      <li>
                        <Link
                          href={`/foro/categoria/${hilo.categoria.slug}`}
                          className="hover:underline"
                        >
                          {hilo.categoria.nombre}
                        </Link>
                      </li>
                      <li>›</li>
                    </>
                  )}
                  <li className="text-gray-800 dark:text-gray-200 amoled:text-white truncate max-w-[60%]">
                    {hilo.titulo}
                  </li>
                </ol>
              </nav>

              {/* Encabezado del hilo */}
              <article className="bg-white dark:bg-black amoled:bg-black">
                <header className="pb-6">
                  {/* Título del hilo */}
                  <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-gray-900 dark:text-gray-100 amoled:text-white break-words mb-4">
                    {hilo.titulo}
                  </h1>

                  {/* Etiquetas y badges de estado */}
                  {(etiquetas.length > 0 || hilo.es_fijado || hilo.es_cerrado) && (
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                      {etiquetas.map((tag) => (
                        <span
                          key={tag.id}
                          className="text-xs font-medium px-3 py-1 rounded-full border bg-white dark:bg-gray-800 amoled:bg-black"
                          style={{ borderColor: tag.color || "#64748b", color: tag.color || "#64748b" }}
                        >
                          {tag.nombre}
                        </span>
                      ))}
                      {hilo.es_fijado && (
                        <span className="text-xs inline-flex items-center gap-1 px-3 py-1 rounded-full border border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                          <Star size={14} fill="currentColor" /> Fijado
                        </span>
                      )}
                      {hilo.es_cerrado && (
                        <span className="text-xs inline-flex items-center gap-1 px-3 py-1 rounded-full border border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                          <Lock size={14} /> Cerrado
                        </span>
                      )}
                    </div>
                  )}

                  {/* Información del autor y estadísticas */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    {/* Autor */}
                    <div className="flex items-center gap-3">
                      <Link 
                        href={`/perfil/${hilo.autor?.username}`}
                        className="group flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-indigo-500 transition-all">
                          <AvatarImage
                            src={hilo.autor?.avatar_url ?? undefined}
                            alt={hilo.autor?.username ?? "Autor"}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                            {hilo.autor?.username?.substring(0, 2).toUpperCase() ?? "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 amoled:text-white flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {hilo.autor?.username ?? "Autor desconocido"}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                          <time className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(hilo.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", {
                              locale: es,
                            })}
                          </time>
                        </div>
                      </Link>
                    </div>

                    {/* Estadísticas */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">{hilo.vistas ?? 0}</span>
                      </div>
                      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4" />
                        <span className="font-medium">{hilo.respuestas ?? 0}</span>
                      </div>
                      {hilo.updated_at && hilo.updated_at !== hilo.created_at && (
                        <>
                          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                          <div className="flex items-center gap-1.5" title="Última edición">
                            <Clock className="h-4 w-4" />
                            <time className="text-xs">
                              {format(new Date(hilo.updated_at), "d MMM, HH:mm", { locale: es })}
                            </time>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción y votación */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Votación */}
                    <div className="flex items-center">
                      <Votacion
                        id={hilo.id}
                        tipo="hilo"
                        votosIniciales={hilo.votos ?? 0}
                        vertical={false}
                        size="md"
                        className="h-10"
                      />
                    </div>

                    <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />

                    {/* Botones de acción */}
                    <Link
                      href="#responder"
                      className="inline-flex items-center gap-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md"
                      title="Responder"
                    >
                      <MessageSquare size={16} />
                      <span className="hidden sm:inline">Responder</span>
                    </Link>
                    <button
                      className="inline-flex items-center gap-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 amoled:bg-gray-900 amoled:hover:bg-gray-800 amoled:text-white px-3 sm:px-4 py-2 rounded-lg transition-colors"
                      title="Seguir hilo"
                      type="button"
                    >
                      <Star size={16} />
                      <span className="hidden sm:inline">Seguir</span>
                    </button>
                    <button
                      className="inline-flex items-center gap-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 amoled:bg-gray-900 amoled:hover:bg-gray-800 amoled:text-white px-3 sm:px-4 py-2 rounded-lg transition-colors"
                      title="Compartir"
                      type="button"
                    >
                      <Share2 size={16} />
                      <span className="hidden sm:inline">Compartir</span>
                    </button>
                    <div className="ml-auto">
                      <BotonReportar
                        tipo_contenido="hilo"
                        contenido_id={hilo.id}
                        variant="outline"
                        size="sm"
                      />
                    </div>
                  </div>
                </header>

                {/* Contenido del post inicial */}
                <div className="pt-4">
                  <HiloContenido
                    html={hilo.contenido ?? ""}
                    className="prose max-w-none prose-headings:my-4 prose-p:my-3 prose-strong:text-gray-900 dark:prose-invert dark:prose-strong:text-white amoled:prose-invert amoled:prose-strong:text-white"
                  />
                </div>
              </article>

              {/* Más en ... (relacionados) */}
              <HilosRelacionadosInline
                categoriaId={hilo.categoria_id}
                categoriaNombre={hilo.categoria?.nombre || "la categoría"}
                hiloActualId={hilo.id}
                hilosRelacionadosIniciales={hilosRelacionados}
              />

              {/* Sistema de Posts/Respuestas */}
              <section className="mt-6" id="responder">
                <HiloComentariosOptimizado
                  hiloId={hilo.id}
                  autorHiloId={hilo.autor_id}
                  hiloCerrado={hilo.es_cerrado}
                  pageSize={5}
                  order="desc"
                />
              </section>
            </div>

            {/* Sidebar */}
            <HiloSidebar
              categoriaId={hilo.categoria_id}
              categoriaNombre={hilo.categoria?.nombre || "la categoría"}
              hiloActualId={hilo.id}
              hilosRelacionadosIniciales={hilosRelacionados}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
