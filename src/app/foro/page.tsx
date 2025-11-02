import ForoCliente from "@/components/foro/ForoCliente";
import ForoSidebar from "@/components/foro/ForoSidebar";
import { getCategoriasJerarquicas } from "@/lib/foro/server-actions";

export default async function ForoPage() {
  const categorias = await getCategoriasJerarquicas();

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
        <ForoCliente initialCategorias={categorias} />
      </main>
    </div>
  );
}
