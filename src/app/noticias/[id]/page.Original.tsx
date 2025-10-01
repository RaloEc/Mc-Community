"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Función para procesar el contenido HTML y corregir URLs de imágenes
function procesarContenido(contenido: string): string {
  if (!contenido) return "";

  // Reemplazar URLs de blob o data por URLs de Supabase
  let contenidoProcesado = contenido;

  // Reemplazar atributos src que contengan blob: o data:
  contenidoProcesado = contenidoProcesado.replace(
    /(<img[^>]*src=["'])(?:blob:|data:)[^"']+(["'][^>]*>)/gi,
    (match, prefix, suffix) => {
      // Reemplazar con una imagen de fallback
      return `${prefix}https://placehold.co/600x400/333333/FFFFFF?text=Imagen+no+disponible${suffix}`;
    }
  );

  // Añadir atributo loading="lazy" a todas las imágenes para mejorar rendimiento
  contenidoProcesado = contenidoProcesado.replace(
    /(<img[^>]*)>/gi,
    (match, prefix) => {
      if (match.includes("loading=")) {
        return match; // Ya tiene atributo loading
      }
      return `${prefix} loading="lazy">`;
    }
  );

  // Eliminar atributos crossOrigin incorrectos
  contenidoProcesado = contenidoProcesado.replace(
    /(<img[^>]*)crossOrigin=["'][^"']*["']([^>]*>)/gi,
    (match, prefix, suffix) => {
      return `${prefix}${suffix}`;
    }
  );

  return contenidoProcesado;
}
import {
  CalendarIcon,
  ArrowLeftIcon,
  MessageSquareIcon,
  ThumbsUpIcon,
  Pencil,
  Trash,
  ExternalLink,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CommentSystem } from "@/components/comentarios/CommentSystem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Noticia } from "@/types";
import { createClient } from "@/lib/supabase/client";

// Estilos para el scrollbar
const scrollbarStyles = `
  .comentarios-container::-webkit-scrollbar {
    width: 8px;
  }
  
  .comentarios-container::-webkit-scrollbar-track {
    background: hsl(var(--muted));
    border-radius: 4px;
  }
  
  .comentarios-container::-webkit-scrollbar-thumb {
    background-color: hsl(var(--primary) / 0.3);
    border-radius: 4px;
  }
  
  .comentarios-container::-webkit-scrollbar-thumb:hover {
    background-color: hsl(var(--primary) / 0.5);
  }
`;

type LocalNoticia = Noticia & { vistas?: number };

export default function NoticiaDetalle({ params }: { params: { id: string } }) {
  const [noticia, setNoticia] = useState<LocalNoticia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    // Verificar si hay un usuario autenticado (una sola vez al cargar)
    const checkUsuario = async () => {
      try {
        setCargandoAuth(true);
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setUsuario(session.user);

          // Verificar si el usuario es administrador
          try {
            const { data: perfil } = await supabase
              .from("perfiles")
              .select("role")
              .eq("id", session.user.id)
              .single();

            if (perfil?.role === "admin") {
              setEsAdmin(true);
            }
          } catch (error) {
            console.error("Error al verificar usuario:", error);
          }
        }
      } catch (error) {
        console.error("Error al verificar usuario:", error);
      } finally {
        setCargandoAuth(false);
      }
    };

    checkUsuario();
  }, []);

  useEffect(() => {
    async function cargarNoticia() {
      try {
        console.log("=== INICIO CARGA DE NOTICIA INDIVIDUAL ===");
        console.log("Cargando noticia con ID:", params.id);
        setCargando(true);

        // Construir URL absoluta para evitar problemas con Next.js
        // Obtener la URL base de diferentes fuentes según el entorno
        let baseUrl;

        if (typeof window !== "undefined") {
          // En el navegador, usar la URL actual
          baseUrl = window.location.origin;
        } else {
          // En el servidor, usar variables de entorno o valores por defecto
          baseUrl =
            process.env.NEXT_PUBLIC_SITE_URL ||
            (process.env.NETLIFY_URL
              ? `https://${process.env.NETLIFY_URL}`
              : process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : "http://localhost:3000");
        }

        // Obtener la noticia desde nuestra API usando URL absoluta
        const response = await fetch(`${baseUrl}/api/noticias/${params.id}`, {
          cache: "no-store",
          next: { revalidate: 0 }, // No usar caché
        });

        console.log("Respuesta de API:", response.status, response.statusText);

        if (!response.ok) {
          console.error(`Error en la respuesta: ${response.status}`);
          throw new Error(`Error en la respuesta: ${response.status}`);
        }

        const resultado = await response.json();
        console.log("Datos recibidos de la API:", {
          success: resultado.success,
          error: resultado.error,
          tieneData: !!resultado.data,
        });

        if (!resultado.success) {
          console.error("Error en resultado:", resultado.error);
          setError(resultado.error || "Error al cargar la noticia");
          return;
        }

        console.log("Noticia cargada correctamente:", {
          id: resultado.data.id,
          titulo: resultado.data.titulo,
          fecha: resultado.data.fecha_publicacion,
          autor: resultado.data.autor_nombre,
          tiene_imagen_portada: !!resultado.data.imagen_portada,
          categorias: resultado.data.categorias?.length || 0,
          longitud_contenido: resultado.data.contenido?.length || 0,
        });

        // Analizar contenido para detectar imágenes
        if (resultado.data.contenido) {
          console.log("Analizando contenido para detectar imágenes...");
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = resultado.data.contenido;
          const images = tempDiv.querySelectorAll("img");
          console.log(
            `Se encontraron ${images.length} imágenes en el contenido`
          );

          // Mostrar las URLs de las imágenes encontradas
          images.forEach((img, index) => {
            const src = img.getAttribute("src");
            console.log(
              `Imagen ${index + 1}: ${src?.substring(0, 100)}${
                src && src.length > 100 ? "..." : ""
              }`
            );

            // Verificar si la imagen es una URL de Supabase
            if (src && src.includes("supabase")) {
              console.log(`Imagen ${index + 1} es una URL de Supabase`);
            } else if (src && src.startsWith("blob:")) {
              console.error(
                `Imagen ${
                  index + 1
                } es una URL de blob temporal que NO debería estar presente`
              );
            } else if (src && src.startsWith("data:")) {
              console.error(
                `Imagen ${
                  index + 1
                } es una URL de datos que NO debería estar presente`
              );
            }
          });
        }

        // Depurar información del autor
        console.log("Información del autor recibida:", {
          nombre: resultado.data.autor_nombre,
          color: resultado.data.autor_color,
          avatar: resultado.data.autor_avatar,
        });

        setNoticia(resultado.data);
      } catch (error) {
        console.error("Error al cargar la noticia:", error);
        setError(
          "Error al cargar la noticia. Por favor, inténtalo de nuevo más tarde."
        );
      } finally {
        setCargando(false);
      }
    }

    cargarNoticia();
  }, [params.id]);

  // El contador de vistas se actualiza al cargar la página
  // a través de la llamada a la API en el fetch inicial

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Cargando noticia...</p>
        </div>
      </div>
    );
  }

  if (error || !noticia) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-card border border-border rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-destructive">Error</h2>
          <p className="mb-6">{error || "No se pudo cargar la noticia"}</p>
          <Button asChild>
            <Link href="/noticias">Volver a noticias</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <style jsx global>
        {scrollbarStyles}
      </style>
      <main className="container py-4 px-1">
        {/* Botón de volver */}
        <div className="mb-8">
          <Button variant="outline" asChild>
            <Link href="/noticias">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Volver a noticias
            </Link>
          </Button>
        </div>

        {/* Cabecera de la noticia */}
        <div className="mb-8 bg-background dark:bg-background">
          {/* Título grande */}
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 line-clamp-3 md:line-clamp-none">
            {noticia.titulo}
          </h1>

          {/* Espacio entre título e información del autor */}
          <div className="mb-6"></div>

          {/* Información del autor y tiempo - versión móvil */}
          <div className="flex flex-col mb-4 border-b pb-6">
            {/* Autor con foto e info */}
            <div className="flex items-center gap-3 mb-4">
              {/* Enlace al perfil del autor */}
              <Link 
                href={`/perfil/${encodeURIComponent(noticia.autor_nombre || '')}`}
                className="flex items-center gap-3 group/author"
                title={`Ver perfil de ${noticia.autor_nombre || 'usuario'}`}
              >
                {/* Imagen de perfil del autor */}
                <div className="flex-shrink-0">
                  {noticia.autor_avatar ? (
                    <div className="size-16 overflow-hidden rounded-full group-hover/author:ring-2 group-hover/author:ring-primary transition-all duration-200">
                      <img
                        src={noticia.autor_avatar}
                        alt={`Foto de ${noticia.autor_nombre || "Anónimo"}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          console.log(
                            "Error al cargar imagen de perfil:",
                            noticia.autor_avatar
                          );
                          // Si hay error al cargar la imagen, mostrar fallback
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement.classList.add(
                            "bg-gray-700"
                          );
                          e.currentTarget.parentElement.innerHTML = `<div class="flex items-center justify-center h-full w-full text-white font-semibold text-lg">${
                            noticia.autor_nombre
                              ? noticia.autor_nombre.charAt(0).toUpperCase()
                              : "A"
                          }</div>`;
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className="size-16 flex items-center justify-center rounded-full text-white font-semibold text-lg group-hover/author:ring-2 group-hover/author:ring-primary transition-all duration-200"
                      style={{
                        backgroundColor: noticia.autor_color || "#4B5563",
                      }}
                    >
                      {noticia.autor_nombre
                        ? noticia.autor_nombre.charAt(0).toUpperCase()
                        : "A"}
                    </div>
                  )}
                </div>

                {/* Información del autor */}
                <div className="flex flex-col">
                  <div className="font-medium group-hover/author:text-primary transition-colors duration-200 flex items-center gap-1">
                    {noticia.autor_nombre || "Anónimo"}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover/author:opacity-100 transition-opacity duration-200" />
                  </div>
                  {noticia.autor_rol && (
                    <Badge 
                      variant="outline" 
                      className="w-fit mt-1 text-xs"
                      style={{
                        borderColor: noticia.autor_color || '#4B5563',
                        color: noticia.autor_color || '#4B5563'
                      }}
                    >
                      {noticia.autor_rol === 'admin' && 'Administrador'}
                      {noticia.autor_rol === 'moderator' && 'Moderador'}
                      {noticia.autor_rol === 'user' && 'Usuario'}
                    </Badge>
                  )}
                </div>
              </Link>

              {/* Botón de edición (solo visible para administradores) */}
              {esAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 ml-auto"
                  asChild
                >
                  <Link href={`/admin/noticias/editar/${params.id}`}>
                    <Pencil className="h-3 w-3" />
                    Editar
                  </Link>
                </Button>
              )}
            </div>

            {/* Fecha y vistas en vivo */}
            <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-center">
                {new Date(
                  noticia.fecha_publicacion || Date.now()
                ).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>
                  {typeof noticia.vistas === "number" ? noticia.vistas : 0}{" "}
                  vistas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Imagen de portada */}
        {(noticia.imagen_url || noticia.imagen_portada) && (
          <div className="relative w-full md:w-3/4 lg:w-2/3 aspect-video mb-8 rounded-lg overflow-hidden mx-auto">
            <Image
              src={noticia.imagen_url || noticia.imagen_portada || ""}
              alt={noticia.titulo}
              fill
              className="object-cover"
              onError={(e) => {
                console.error("Error al cargar la imagen de portada");
                // Ocultar el contenedor de imagen si hay error
                const container = e.currentTarget.parentElement;
                if (container) {
                  container.style.display = "none";
                }
              }}
            />
          </div>
        )}

        {/* Contenido de la noticia */}
        <div
          className="prose prose-lg dark:prose-invert max-w-4xl mx-auto [&_img]:w-full md:[&_img]:max-w-[85%] [&_img]:mx-auto mb-8 noticia-contenido [.amoled_&]:[&_*]:!text-white"
          dangerouslySetInnerHTML={{
            __html: procesarContenido(noticia.contenido),
          }}
        />

        {/* Divisor después del contenido */}
        <div className="max-w-4xl mx-auto mb-8">
          <Separator className="my-4" />
        </div>

        {/* Temas relacionados */}
        {noticia?.categoria && (
          <div className="max-w-4xl mx-auto mb-10">
            <h2 className="text-xl font-semibold mb-4">Temas relacionados</h2>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/noticias/categoria/${
                  noticia.categoria.slug || noticia.categoria.id
                }`}
                key={noticia.categoria.id}
                className="block bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ease-in-out"
              >
                {noticia.categoria.nombre}
              </Link>
            </div>
          </div>
        )}

        {/* Divisor antes de comentarios */}
        <div className="max-w-4xl mx-auto mb-8">
          <Separator className="my-4" />
        </div>

        {/* Sección de comentarios */}
        <div className="max-w-4xl mx-auto">
          <CommentSystem
            contentType="noticia"
            contentId={noticia.id.toString()}
          />
        </div>
      </main>
    </div>
  );
}
