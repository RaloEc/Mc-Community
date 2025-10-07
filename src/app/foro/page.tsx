import ForoCliente from "@/components/foro/ForoCliente";
import ForoSidebar from "@/components/foro/ForoSidebar";
import { createClient } from "@/lib/supabase/server";

async function getCategorias() {
  try {
    console.log("[ForoPage] Cargando categorías directamente desde Supabase (server)");
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("foro_categorias")
      .select("*")
      .eq("es_activa", true)
      .order("orden", { ascending: true })
      .order("nombre", { ascending: true });
    
    if (error) {
      console.error("[ForoPage] Error al cargar foro_categorias:", {
        message: error.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint
      });
      return [];
    }
    
    const categoriasPlanas = data || [];
    console.log("[ForoPage] Categorías planas recibidas:", {
      count: categoriasPlanas.length,
      sample: categoriasPlanas.slice(0, Math.min(3, categoriasPlanas.length))
    });
    
    // Organizar en estructura jerárquica
    const categoriasPrincipales: any[] = [];
    const categoriasMap = new Map<string, any>();
    
    // Crear un mapa de todas las categorías
    categoriasPlanas.forEach(cat => {
      categoriasMap.set(cat.id, { ...cat, subcategorias: [] });
    });
    
    // Organizar la jerarquía
    categoriasPlanas.forEach(cat => {
      const categoria = categoriasMap.get(cat.id)!;
      
      if (!cat.parent_id) {
        // Es una categoría principal
        categoriasPrincipales.push(categoria);
      } else {
        // Es una subcategoría, agregarla a su padre
        const padre = categoriasMap.get(cat.parent_id);
        if (padre) {
          if (!padre.subcategorias) {
            padre.subcategorias = [];
          }
          padre.subcategorias.push(categoria);
        }
      }
    });
    
    console.log("[ForoPage] Árbol de categorías construido:", {
      roots: categoriasPrincipales.length,
      rootsSample: categoriasPrincipales.slice(0, Math.min(3, categoriasPrincipales.length)).map(c => ({
        id: c.id,
        nombre: c.nombre,
        subCount: c.subcategorias?.length || 0
      }))
    });
    
    return categoriasPrincipales;
  } catch (err) {
    console.error("[ForoPage] Error general al cargar categorías:", err);
    return [];
  }
}

export default async function ForoPage() {
  const categorias = await getCategorias();

  // Depuración: Mostrar las categorías recibidas
  console.log("[ForoPage] Categorías finales que se pasarán al Sidebar:", {
    count: Array.isArray(categorias) ? categorias.length : 0,
    sample: Array.isArray(categorias) ? categorias.slice(0, Math.min(3, categorias.length)) : []
  });

  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-screen">
      {/* Barra lateral fija */}
      <div className="lg:w-64 xl:w-72 shrink-0">
        <div className="lg:sticky lg:top-4">
          {categorias && categorias.length > 0 ? (
            <ForoSidebar categorias={categorias} />
          ) : (
            <div className="p-4 text-red-500">
              No se pudieron cargar las categorías
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal con scroll */}
      <main className="flex-1 min-w-0">
        <ForoCliente />
      </main>
    </div>
  );
}
