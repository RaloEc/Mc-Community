"use client";

import { useState } from "react";
import { useUserTheme } from "@/hooks/useUserTheme";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare,
  Star,
  Lock,
  Eye,
  Clock,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import BotonReportar from "@/components/foro/BotonReportar";
import { Votacion } from "@/components/ui/Votacion";
import ContadorRespuestasRealtime from "@/components/foro/ContadorRespuestasRealtime";
import HiloContenido from "@/components/foro/HiloContenido";
import { useAuth } from "@/context/AuthContext";
import type { ForoHiloCompleto } from "@/types/foro";
import dynamic from "next/dynamic";
import { ShareButton } from "@/components/shared/ShareButton";

// Importar dinámicamente el editor para evitar problemas de SSR
const TiptapEditor = dynamic(() => import("@/components/tiptap-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  ),
});

interface HiloHeaderProps {
  hilo: ForoHiloCompleto;
  etiquetas: Array<{ id: string; nombre: string; color: string | null }>;
}

export default function HiloHeader({ hilo, etiquetas }: HiloHeaderProps) {
  const { user } = useAuth();
  const { userColor, getHoverTextColor, hexToRgba, getColorWithOpacity } = useUserTheme();
  const [modoEdicion, setModoEdicion] = useState(false);
  const [contenidoEditado, setContenidoEditado] = useState(hilo.contenido);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const esAutor = user?.id === hilo.autor_id;

  const handleEliminar = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar este hilo? Esta acción no se puede deshacer.")) {
      return;
    }

    setEliminando(true);
    try {
      const response = await fetch(`/api/foro/hilos/${hilo.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el hilo");
      }

      // Redirigir al foro después de eliminar
      window.location.href = "/foro";
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar el hilo. Por favor, intenta de nuevo.");
    } finally {
      setEliminando(false);
    }
  };

  const handleGuardarEdicion = async () => {
    if (!contenidoEditado.trim()) {
      return;
    }

    setGuardando(true);

    try {
      const response = await fetch(`/api/foro/hilos/${hilo.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contenido: contenidoEditado,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el hilo");
      }

      setModoEdicion(false);
      // Recargar la página para mostrar el contenido actualizado
      window.location.reload();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar los cambios. Por favor, intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelarEdicion = () => {
    setContenidoEditado(hilo.contenido);
    setModoEdicion(false);
  };

  return (
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
                style={{
                  borderColor: tag.color || "#64748b",
                  color: tag.color || "#64748b",
                }}
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
                  {format(
                    new Date(hilo.created_at),
                    "d 'de' MMMM 'de' yyyy, HH:mm",
                    {
                      locale: es,
                    }
                  )}
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
            <ContadorRespuestasRealtime
              hiloId={hilo.id}
              respuestasIniciales={hilo.respuestas ?? 0}
            />
            {hilo.updated_at && hilo.updated_at !== hilo.created_at && (
              <>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                <div className="flex items-center gap-1.5" title="Última edición">
                  <Clock className="h-4 w-4" />
                  <time className="text-xs">
                    {format(new Date(hilo.updated_at), "d MMM, HH:mm", {
                      locale: es,
                    })}
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
          {!modoEdicion && (
            <>
              <Link
                href="#responder"
                className="inline-flex items-center gap-2 text-sm font-medium text-white px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                style={{
                  backgroundColor: getColorWithOpacity(0.5),
                  ...getHoverTextColor(),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = userColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = getColorWithOpacity(0.5);
                }}
                title="Responder"
              >
                <MessageSquare size={16} />
                <span className="hidden sm:inline">Responder</span>
              </Link>
              <button
                className="inline-flex items-center gap-2 text-sm font-medium px-3 sm:px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  borderColor: getColorWithOpacity(0.3),
                  color: getColorWithOpacity(0.6),
                  borderWidth: '1px',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = userColor;
                  e.currentTarget.style.color = userColor;
                  e.currentTarget.style.backgroundColor = getColorWithOpacity(0.1);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = getColorWithOpacity(0.3);
                  e.currentTarget.style.color = getColorWithOpacity(0.6);
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Seguir hilo"
                type="button"
              >
                <Star size={16} />
                <span className="hidden sm:inline">Seguir</span>
              </button>
              <ShareButton
                url={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/foro/hilos/${hilo.slug}`}
                title={hilo.titulo}
                description={hilo.contenido.substring(0, 160).replace(/<[^>]*>/g, '')}
                shareText="Compartir"
                variant="outline"
                size="sm"
                className="text-sm font-medium px-3 sm:px-4 py-2"
              />

              {/* Botones de editar y eliminar (solo para el autor) */}
              {esAutor && (
                <>
                  <button
                    onClick={() => setModoEdicion(true)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-white px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    style={{
                      backgroundColor: getColorWithOpacity(0.5),
                      ...getHoverTextColor(),
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = userColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = getColorWithOpacity(0.5);
                    }}
                    title="Editar hilo"
                    type="button"
                  >
                    <Pencil size={16} />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button
                    onClick={handleEliminar}
                    disabled={eliminando}
                    className="inline-flex items-center gap-2 text-sm font-medium text-white px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                    style={{
                      backgroundColor: eliminando ? "#9ca3af" : "#ef4444",
                    }}
                    onMouseEnter={(e) => {
                      if (!eliminando) {
                        e.currentTarget.style.backgroundColor = "#dc2626";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!eliminando) {
                        e.currentTarget.style.backgroundColor = "#ef4444";
                      }
                    }}
                    title="Eliminar hilo"
                    type="button"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">{eliminando ? "Eliminando..." : "Eliminar"}</span>
                  </button>
                </>
              )}

              <div className="ml-auto">
                <BotonReportar
                  tipo_contenido="hilo"
                  contenido_id={hilo.id}
                  variant="outline"
                  size="sm"
                />
              </div>
            </>
          )}

          {/* Botones de guardar/cancelar en modo edición */}
          {modoEdicion && (
            <>
              <button
                onClick={handleGuardarEdicion}
                disabled={guardando}
                className="inline-flex items-center gap-2 text-sm font-medium bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md"
                type="button"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={handleCancelarEdicion}
                disabled={guardando}
                className="inline-flex items-center gap-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 px-3 sm:px-4 py-2 rounded-lg transition-colors"
                type="button"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </header>

      {/* Contenido del post inicial */}
      <div className="pt-4">
        {!modoEdicion ? (
          <HiloContenido
            html={hilo.contenido ?? ""}
            className="prose max-w-none prose-headings:my-4 prose-p:my-3 prose-strong:text-gray-900 dark:prose-invert dark:prose-strong:text-white amoled:prose-invert amoled:prose-strong:text-white"
            weaponStatsRecord={hilo.weapon_stats_record ?? undefined}
          />
        ) : (
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
            <TiptapEditor
              value={contenidoEditado}
              onChange={setContenidoEditado}
              placeholder="Edita el contenido de tu hilo..."
            />
          </div>
        )}
      </div>
    </article>
  );
}
