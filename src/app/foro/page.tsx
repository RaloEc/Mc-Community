import ForoCliente from "@/components/foro/ForoCliente";
import ForoSidebar from "@/components/foro/ForoSidebar";

async function getCategorias() {
  try {
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/api/foro/categorias`,
      { next: { revalidate: 0 } }
    );
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function ForoPage() {
  const categorias = await getCategorias();

  // Depuración: Mostrar las categorías recibidas
  console.log("Categorías recibidas en la página del foro:", categorias);

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
