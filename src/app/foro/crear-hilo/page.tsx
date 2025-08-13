import { getForoCategorias } from '@/lib/foro/queries';
import { CrearHiloForm } from '@/components/foro/CrearHiloForm';

export default async function CrearHiloPage() {
  const categorias = await getForoCategorias();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Iniciar un Nuevo Hilo</h1>
      <CrearHiloForm categorias={categorias} />
    </div>
  );
}
