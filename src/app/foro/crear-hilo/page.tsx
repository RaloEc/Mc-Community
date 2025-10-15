import { getForoCategorias } from '@/lib/foro/queries';
import { CrearHiloForm } from '@/components/foro/CrearHiloForm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function CrearHiloPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Debes iniciar sesión para crear un hilo.');
  }

  const categorias = await getForoCategorias();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Iniciar un Nuevo Hilo</h1>
      <CrearHiloForm categorias={categorias as any[]} userId={user.id} />
    </div>
  );
}
