import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function AdminModsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Verificar si el usuario está autenticado
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  // Verificar si el usuario es administrador
  const { data: userData } = await supabase
    .from('perfiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (userData?.role !== 'admin') {
    redirect('/');
  }

  // Obtener el término de búsqueda
  const searchTerm = searchParams.search ? String(searchParams.search) : '';

  // Obtener los mods con sus categorías
  let query = supabase
    .from('mods_con_autor')
    .select(`
      *,
      categorias:categorias_mod(*)
    `)
    .order('fecha_creacion', { ascending: false });

  // Aplicar filtro de búsqueda si existe
  if (searchTerm) {
    query = query.ilike('nombre', `%${searchTerm}%`);
  }

  const { data: mods, error } = await query;

  if (error) {
    console.error('Error al cargar los mods:', error);
    return (
      <div className="container py-8">
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
          <p>Error al cargar los mods. Por favor, inténtalo de nuevo más tarde.</p>
        </div>
      </div>
    );
  }

  // Función para confirmar la eliminación de un mod
  const confirmDelete = (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el mod "${nombre}"? Esta acción no se puede deshacer.`)) {
      // Implementar la lógica de eliminación aquí
      console.log('Eliminar mod con ID:', id);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Administrar Mods</h1>
          <p className="text-muted-foreground">Gestiona los mods de Minecraft en la plataforma</p>
        </div>
        <Button asChild>
          <Link href="/admin/mods/crear" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar Mod
          </Link>
        </Button>
      </div>

      <div className="bg-card rounded-lg border p-6 mb-6">
        <form className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="search"
              placeholder="Buscar mods por nombre..."
              className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={searchTerm}
            />
          </div>
          <Button type="submit" className="whitespace-nowrap">
            Buscar
          </Button>
          {searchTerm && (
            <Button
              variant="outline"
              asChild
              className="whitespace-nowrap"
            >
              <Link href="/admin/mods">Limpiar</Link>
            </Button>
          )}
        </form>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">Nombre</th>
                <th className="text-left py-3 px-4 font-medium">Versión</th>
                <th className="text-left py-3 px-4 font-medium">Versión MC</th>
                <th className="text-left py-3 px-4 font-medium">Categorías</th>
                <th className="text-left py-3 px-4 font-medium">Fecha de creación</th>
                <th className="text-right py-3 px-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mods && mods.length > 0 ? (
                mods.map((mod) => (
                  <tr key={mod.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{mod.nombre}</div>
                      <div className="text-sm text-muted-foreground">
                        por {mod.autor_username || mod.autor}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">v{mod.version}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{mod.version_minecraft}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {mod.categorias?.map((categoria: any) => (
                          <Badge key={categoria.id} variant="secondary" className="text-xs">
                            {categoria.nombre}
                          </Badge>
                        )) || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {format(new Date(mod.fecha_creacion), 'PPP', { locale: es })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8"
                        >
                          <Link href={`/admin/mods/editar/${mod.id}`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDelete(mod.id, mod.nombre)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    {searchTerm
                      ? 'No se encontraron mods que coincidan con tu búsqueda.'
                      : 'No hay mods registrados aún.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
