import ForoCliente from '@/components/foro/ForoCliente';
import ForoSidebar from '@/components/foro/ForoSidebar';

async function getCategorias() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/foro/categorias`, { next: { revalidate: 0 } })
    const json = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

export default async function ForoPage() {
  const categorias = await getCategorias();
  
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <ForoSidebar categorias={categorias} />
      <main className="w-full lg:flex-1 min-w-0">
        <ForoCliente />
      </main>
    </div>
  );
}
