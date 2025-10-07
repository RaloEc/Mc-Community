import ForoCliente from "@/components/foro/ForoCliente";
import ForoSidebar from "@/components/foro/ForoSidebar";

async function getCategorias() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/foro/categorias`;
  try {
    console.log("[ForoPage] Solicitando categorías desde:", url);
    const res = await fetch(url, { next: { revalidate: 0 } });
    let json: any = null;
    try {
      json = await res.json();
    } catch (e) {
      console.error("[ForoPage] Error parseando JSON de categorías:", e);
      return [];
    }
    const items = json?.data || [];
    console.log("[ForoPage] Categorías recibidas (conteo):", Array.isArray(items) ? items.length : 0);
    if (!Array.isArray(items) || items.length === 0) {
      console.warn("[ForoPage] Respuesta de categorías vacía o inválida:", json);
    } else {
      console.log("[ForoPage] Ejemplo de categorías:", items.slice(0, Math.min(3, items.length)));
    }
    return items;
  } catch (err) {
    console.error("[ForoPage] Error al solicitar categorías:", err);
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
