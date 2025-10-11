"use client";

import { memo, useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  Clock,
} from "lucide-react";
import type { ForoPostConAutor } from "@/types/foro";
import HiloContenido from "../HiloContenido";
import BotonReportar from "../BotonReportar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: ForoPostConAutor;
  esAutorHilo?: boolean;
  puedeEditar?: boolean;
  puedeEliminar?: boolean;
  puedeMarcarSolucion?: boolean;
  onResponder?: (postId: string) => void;
  onEditar?: (postId: string) => void;
  onEliminar?: (postId: string) => void;
  onMarcarSolucion?: (postId: string) => void;
  nivel?: number;
}

function PostCard({
  post,
  esAutorHilo = false,
  puedeEditar = false,
  puedeEliminar = false,
  puedeMarcarSolucion = false,
  onResponder,
  onEditar,
  onEliminar,
  onMarcarSolucion,
  nivel = 0,
}: PostCardProps) {
  const [mostrarRespuestas, setMostrarRespuestas] = useState(true);
  const [debeResaltar, setDebeResaltar] = useState(false);
  const postRef = useRef<HTMLDivElement>(null);

  const tieneRespuestas = post.respuestas && post.respuestas.length > 0;
  const maxNivel = 3; // Máximo nivel de anidación

  // Detectar si este post debe ser resaltado
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const highlightId = params.get("highlight");

    if (highlightId === post.id) {
      setDebeResaltar(true);

      // Hacer scroll al elemento
      setTimeout(() => {
        postRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);

      // Remover el resaltado después de 3 segundos
      const timer = setTimeout(() => {
        setDebeResaltar(false);
        
        // Limpiar la URL sin recargar la página
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, "", newUrl);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [post.id]);

  return (
    <div
      id={`post-${post.id}`}
      ref={postRef}
      className={`${
        nivel > 0 ? "ml-8 mt-4" : ""
      } border-l-2 ${
        post.es_solucion
          ? "border-gray-600 dark:border-gray-500 bg-gray-50/50 dark:bg-gray-900/20"
          : "border-gray-200 dark:border-gray-700"
      } pl-4 transition-all duration-300 ${
        debeResaltar ? "animate-highlight" : ""
      }`}
    >
      <article className={`bg-white dark:bg-black amoled:bg-black rounded-lg border border-gray-200 dark:border-gray-700 amoled:border-gray-800 p-4 ${
        debeResaltar ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}>
        {/* Header del post */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={post.autor?.avatar_url ?? undefined}
                alt={post.autor?.username ?? "Usuario"}
              />
              <AvatarFallback>
                {post.autor?.username?.substring(0, 2).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                {post.autor?.username ?? "Usuario desconocido"}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <time>
                  {format(new Date(post.created_at), "d MMM yyyy, HH:mm", {
                    locale: es,
                  })}
                </time>
                {post.editado && post.editado_en && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Editado{" "}
                      {format(new Date(post.editado_en), "d MMM, HH:mm", {
                        locale: es,
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {post.es_solucion && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-600 dark:bg-gray-500 text-white">
                <CheckCircle2 size={14} />
                Solución
              </span>
            )}

            {(puedeEditar || puedeEliminar || puedeMarcarSolucion) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {puedeEditar && (
                    <DropdownMenuItem onClick={() => onEditar?.(post.id)}>
                      <Pencil size={14} className="mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {puedeMarcarSolucion && !post.es_solucion && (
                    <DropdownMenuItem
                      onClick={() => onMarcarSolucion?.(post.id)}
                    >
                      <CheckCircle2 size={14} className="mr-2" />
                      Marcar como solución
                    </DropdownMenuItem>
                  )}
                  {puedeEliminar && (
                    <DropdownMenuItem
                      onClick={() => onEliminar?.(post.id)}
                      className="text-red-600"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Contenido del post */}
        <HiloContenido html={post.contenido} className="mb-3" />

        {/* Acciones del post */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          {nivel < maxNivel && onResponder && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResponder(post.id)}
              className="text-xs"
            >
              <MessageSquare size={14} className="mr-1" />
              Responder
            </Button>
          )}

          <div className="ml-auto">
            <BotonReportar
              tipo_contenido="post"
              contenido_id={post.id}
              variant="ghost"
              size="sm"
            />
          </div>
        </div>
      </article>

      {/* Respuestas anidadas */}
      {tieneRespuestas && nivel < maxNivel && (
        <div className="mt-2">
          <button
            onClick={() => setMostrarRespuestas(!mostrarRespuestas)}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
          >
            {mostrarRespuestas ? "Ocultar" : "Mostrar"} {post.respuestas!.length}{" "}
            {post.respuestas!.length === 1 ? "respuesta" : "respuestas"}
          </button>

          {mostrarRespuestas && (
            <div className="space-y-2">
              {post.respuestas!.map((respuesta) => (
                <PostCard
                  key={respuesta.id}
                  post={respuesta as ForoPostConAutor}
                  esAutorHilo={esAutorHilo}
                  puedeEditar={puedeEditar}
                  puedeEliminar={puedeEliminar}
                  puedeMarcarSolucion={puedeMarcarSolucion}
                  onResponder={onResponder}
                  onEditar={onEditar}
                  onEliminar={onEliminar}
                  onMarcarSolucion={onMarcarSolucion}
                  nivel={nivel + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(PostCard);
