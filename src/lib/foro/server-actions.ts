import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type {
  ForoHiloCompleto,
  ForoCategoria,
  ForoHiloRelacionado,
  ForoEtiqueta,
  ForoHiloEtiqueta,
} from "@/types/foro";

/**
 * Obtiene un hilo del foro por slug o ID
 * Ejecutado en el servidor para SSR
 */
export async function getHiloPorSlugOId(
  slugOrId: string
): Promise<ForoHiloCompleto> {
  const supabase = createClient();

  // Primero intentar por slug
  let { data: hilo, error } = await supabase
    .from("foro_hilos")
    .select(
      `
      *,
      autor:perfiles!foro_hilos_autor_id_fkey ( id, username, avatar_url ),
      categoria:foro_categorias!foro_hilos_categoria_id_fkey ( id, nombre, color, slug, parent_id )
    `
    )
    .eq("slug", slugOrId)
    .single();

  // Fallback por ID si no se encontró por slug
  if (!hilo) {
    const byId = await supabase
      .from("foro_hilos")
      .select(
        `
        *,
        autor:perfiles!foro_hilos_autor_id_fkey ( id, username, avatar_url ),
        categoria:foro_categorias!foro_hilos_categoria_id_fkey ( id, nombre, color, slug, parent_id )
      `
      )
      .eq("id", slugOrId)
      .single();
    hilo = byId.data;
    error = byId.error;
  }

  if (error || !hilo) {
    console.error("Error al buscar el hilo por slug/id:", error?.message);
    notFound();
  }

  return hilo as ForoHiloCompleto;
}

/**
 * Obtiene las etiquetas de un hilo
 */
export async function getEtiquetasHilo(
  hiloId: string
): Promise<ForoEtiqueta[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("foro_hilos_etiquetas")
    .select("etiqueta:foro_etiquetas ( id, nombre, color )")
    .eq("hilo_id", hiloId);

  if (error) {
    console.error("Error al obtener etiquetas:", error.message);
    return [];
  }

  if (!data) return [];

  return data
    .map((item: any) => item.etiqueta)
    .filter(Boolean) as ForoEtiqueta[];
}

/**
 * Obtiene la categoría padre de una categoría
 */
export async function getCategoriaParent(
  parentId: string
): Promise<ForoCategoria | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("foro_categorias")
    .select("id, nombre, slug, color, parent_id")
    .eq("id", parentId)
    .single();

  if (error) {
    console.error("Error al obtener categoría padre:", error.message);
    return null;
  }

  return data as ForoCategoria;
}

/**
 * Obtiene hilos relacionados de la misma categoría
 */
export async function getHilosRelacionados(
  categoriaId: string,
  hiloActualId: string,
  limit: number = 5
): Promise<ForoHiloRelacionado[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("foro_hilos")
    .select("id, slug, titulo")
    .eq("categoria_id", categoriaId)
    .neq("id", hiloActualId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error al obtener hilos relacionados:", error.message);
    return [];
  }

  return (data as ForoHiloRelacionado[]) || [];
}

/**
 * Obtiene todas las categorías para el sidebar
 */
export async function getCategoriasForo(): Promise<ForoCategoria[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("foro_categorias")
    .select("*")
    .order("orden", { ascending: true });

  if (error) {
    console.error("Error al obtener categorías:", error.message);
    return [];
  }

  return (data as ForoCategoria[]) || [];
}

/**
 * Incrementa el contador de vistas de un hilo
 * Se ejecuta de forma asíncrona sin bloquear
 */
export async function incrementarVistasHilo(hiloId: string): Promise<void> {
  const supabase = createClient();

  await supabase.rpc("incrementar_vistas_hilo", {
    hilo_id: hiloId,
  });
}
