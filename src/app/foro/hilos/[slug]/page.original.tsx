import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import ForoSidebar from "@/components/foro/ForoSidebar";
import HiloContenido from "@/components/foro/HiloContenido";
import HiloSidebar from "@/components/foro/HiloSidebar";
import ForoPosts from "@/components/foro/posts/ForoPosts";
import BotonReportar from "@/components/foro/BotonReportar";
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
    <div className="container mx-auto ">
      <div className="flex flex-col lg:flex-row gap-8">
        <ForoSidebar categorias={categorias} />

        <main className="w-full lg:flex-1 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0  ">
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
              <article className="bg-white dark:bg-black amoled:bg-black rounded-lg border-b border-gray-200 dark:border-gray-700 amoled:border-gray-800 shadow-sm">
                <header className="p-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {hilo.categoria && (
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full text-white"
                        style={{
                          backgroundColor: hilo.categoria.color || "#6c757d",
                        }}
                      >
                        {hilo.categoria.nombre}
                      </span>
                    )}
                    {etiquetas.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs font-semibold px-2 py-1 rounded-full border"
                        style={{ borderColor: tag.color || "#64748b" }}
                      >
                        {tag.nombre}
                      </span>
                    ))}
                    {hilo.es_fijado && (
                      <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full border border-yellow-600 text-yellow-600">
                        <Star size={14} /> Fijado
                      </span>
                    )}
                    {hilo.es_cerrado && (
                      <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full border border-red-600 text-red-600">
                        <Lock size={14} /> Cerrado
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-gray-900 dark:text-gray-100 amoled:text-white break-words">
                    {hilo.titulo}
                  </h1>

                  {/* Controles rápidos */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href="#responder"
                      className="inline-flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md"
                    >
                      <MessageSquare size={16} /> Responder
                    </Link>
                    <button
                      className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 amoled:bg-gray-900 amoled:hover:bg-gray-800 amoled:text-white px-3 py-2 rounded-md"
                      title="Seguir hilo"
                      type="button"
                    >
                      <Star size={16} /> Seguir
                    </button>
                    <button
                      className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 amoled:bg-gray-900 amoled:hover:bg-gray-800 amoled:text-white px-3 py-2 rounded-md"
                      title="Compartir"
                      type="button"
                    >
                      <Share2 size={16} /> Compartir
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

                  {/* Metadatos autor */}
                  <div className="mt-4 flex gap-3 text-sm text-gray-600 dark:text-gray-300 amoled:text-gray-200">
                    <Avatar className="h-14 w-14">
                      <AvatarImage
                        src={hilo.autor?.avatar_url ?? undefined}
                        alt={hilo.autor?.username ?? "Autor"}
                      />
                      <AvatarFallback>
                        {hilo.autor?.username?.substring(0, 2).toUpperCase() ??
                          "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {hilo.autor?.username ?? "Autor desconocido"}
                      </span>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-xs">
                        {/* Fecha de creación */}
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="flex-shrink-0" />
                          <time className="truncate">
                            {format(new Date(hilo.created_at), "d MMM yyyy", {
                              locale: es,
                            })}
                          </time>
                        </div>

                        {/* Última edición */}
                        {hilo.updated_at && (
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="flex-shrink-0" />
                            <time className="truncate">
                              {format(
                                new Date(hilo.updated_at),
                                "d MMM, HH:mm",
                                { locale: es }
                              )}
                            </time>
                          </div>
                        )}

                        {/* Vistas */}
                        <div className="flex items-center gap-1">
                          <Eye size={14} className="flex-shrink-0" />
                          <span className="truncate">
                            {hilo.vistas ?? 0} vistas
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Contenido del post inicial */}
                <div className="p-5">
                  <HiloContenido
                    html={hilo.contenido ?? ""}
                    className="prose max-w-none prose-headings:my-4 prose-p:my-3 prose-strong:text-gray-900 dark:prose-invert dark:prose-strong:text-white amoled:prose-invert amoled:prose-strong:text-white"
                  />
                </div>
              </article>

              {/* Sistema de Posts/Respuestas */}
              <section className="mt-6" id="responder">
                <ForoPosts
                  hiloId={hilo.id}
                  autorHiloId={hilo.autor_id}
                  hiloCerrado={hilo.es_cerrado}
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
