import CrearHiloForm from '@/components/foro/CrearHiloForm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function CrearHiloPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Debes iniciar sesión para crear un hilo.');
  }

  const { data: categorias, error } = await supabase
    .from('foro_categorias')
    .select('id, nombre')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    // Puedes decidir mostrar un mensaje de error aquí
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-4">Crear Nuevo Hilo</h1>
        <CrearHiloForm categorias={categorias || []} userId={user.id} />
      </div>
    </div>
  );
}
