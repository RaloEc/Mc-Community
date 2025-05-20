'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Search, AlertCircle, Filter, ArrowUpDown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminRecursosModsPage() {
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  
  const [mods, setMods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modToDelete, setModToDelete] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<string>('fecha_creacion');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Verificar si el usuario es administrador
  useEffect(() => {
    if (authLoading) return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('perfiles')
          .select('role')
          .eq('id', user?.id)
          .single();

        if (error) throw error;
        
        if (data?.role !== 'admin') {
          router.push('/');
          return;
        }
        
        setIsAdmin(true);
      } catch (err) {
        console.error('Error al verificar el rol de administrador:', err);
        router.push('/');
      }
    };

    checkAdminStatus();
  }, [session, user, authLoading, router]);

  // Cargar los mods
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchMods = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Usar Supabase directamente
        const supabase = createClient();
        
        // Obtener los mods
        const { data: modsData, error: modsError } = await supabase
          .from('mods')
          .select('*')
          .order('fecha_creacion', { ascending: false });

        if (modsError) throw modsError;
        
        // Para cada mod, obtener sus categorías y datos de autor
        const modsWithDetails = await Promise.all(
          (modsData || []).map(async (mod) => {
            // Obtener categorías
            const { data: categoriasData, error: categoriasError } = await supabase
              .from('mods_categorias')
              .select(`
                categoria_id,
                categorias:categorias_mod(id, nombre)
              `)
              .eq('mod_id', mod.id);

            if (categoriasError) console.error('Error al cargar categorías:', categoriasError);
            
            // Obtener datos del autor
            const { data: autorData, error: autorError } = await supabase
              .from('perfiles')
              .select('username, avatar_url')
              .eq('id', mod.user_id)
              .single();

            if (autorError) console.error('Error al cargar datos del autor:', autorError);
            
            // Transformar los datos para mantener la estructura esperada
            const categorias = categoriasData?.map(item => item.categorias) || [];
            
            return {
              ...mod,
              categorias,
              autor_username: autorData?.username || 'Desconocido',
              autor_avatar: autorData?.avatar_url
            };
          })
        );
        
        setMods(modsWithDetails);
      } catch (err) {
        console.error('Error al cargar mods:', err);
        setError('Error al cargar los mods. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMods();
  }, [isAdmin]);

  // Filtrar mods según el término de búsqueda
  const filteredMods = mods.filter(mod => 
    mod.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mod.autor_username && mod.autor_username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (mod.categorias && mod.categorias.some((cat: any) => 
      cat?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  // Eliminar un mod
  const handleDeleteMod = async () => {
    if (!modToDelete) return;
    
    try {
      setDeleteLoading(true);
      
      const supabase = createClient();
      
      // Primero eliminar las relaciones en mods_categorias
      const { error: categoriasError } = await supabase
        .from('mods_categorias')
        .delete()
        .eq('mod_id', modToDelete.id);
        
      if (categoriasError) {
        console.error('Error al eliminar categorías:', categoriasError);
        // Continuamos aunque haya error en las categorías
      }
      
      // Luego eliminar el mod
      const { error: modError } = await supabase
        .from('mods')
        .delete()
        .eq('id', modToDelete.id);
        
      if (modError) throw modError;
      
      // Actualizar la lista de mods
      setMods(mods.filter(mod => mod.id !== modToDelete.id));
      setModToDelete(null);
    } catch (err) {
      console.error('Error al eliminar mod:', err);
      setError('Error al eliminar el mod. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // Ordenar mods
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Si ya estamos ordenando por este campo, cambiar la dirección
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Si es un nuevo campo, establecerlo y ordenar descendentemente por defecto
      setSortField(field);
      setSortOrder('desc');
    }
  };
  
  // Aplicar ordenamiento a los mods
  const sortedMods = [...mods].sort((a, b) => {
    if (sortField === 'fecha_creacion') {
      const dateA = new Date(a.fecha_creacion || 0).getTime();
      const dateB = new Date(b.fecha_creacion || 0).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'nombre') {
      return sortOrder === 'asc' 
        ? a.nombre.localeCompare(b.nombre) 
        : b.nombre.localeCompare(a.nombre);
    } else if (sortField === 'descargas') {
      const downloadsA = a.descargas || 0;
      const downloadsB = b.descargas || 0;
      return sortOrder === 'asc' ? downloadsA - downloadsB : downloadsB - downloadsA;
    }
    return 0;
  });

  if (authLoading || (!isAdmin && !error)) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Administrar Mods</h1>
        <Button asChild>
          <Link href="/admin/recursos/mods/crear">
            <Plus className="mr-2 h-4 w-4" /> Crear Mod
          </Link>
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, autor o categoría..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando mods...</p>
          </div>
        </div>
      ) : filteredMods.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:text-primary"
                  onClick={() => handleSort('nombre')}
                >
                  <div className="flex items-center">
                    Nombre
                    {sortField === 'nombre' && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Categorías</TableHead>
                <TableHead>Versión</TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-primary"
                  onClick={() => handleSort('fecha_creacion')}
                >
                  <div className="flex items-center">
                    Fecha
                    {sortField === 'fecha_creacion' && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-primary"
                  onClick={() => handleSort('descargas')}
                >
                  <div className="flex items-center">
                    Descargas
                    {sortField === 'descargas' && (
                      <ArrowUpDown className={`ml-1 h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMods.map((mod) => (
                <TableRow key={mod.id}>
                  <TableCell className="font-medium">{mod.nombre}</TableCell>
                  <TableCell>{mod.autor_username || mod.autor_nombre || 'Desconocido'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {mod.categorias && mod.categorias.length > 0 ? (
                        mod.categorias.map((cat: any, index: number) => (
                          <Badge key={index} variant="outline">
                            {cat?.nombre || 'Sin nombre'}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin categorías</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{mod.version_minecraft || 'N/A'}</TableCell>
                  <TableCell>
                    {mod.fecha_creacion 
                      ? format(new Date(mod.fecha_creacion), 'dd MMM yyyy', { locale: es })
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>{mod.descargas?.toLocaleString() || '0'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/recursos/mods/editar/${mod.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => setModToDelete(mod)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md bg-muted/10">
          <p className="text-muted-foreground">
            No se encontraron mods{searchTerm ? ' que coincidan con tu búsqueda' : ''}.
          </p>
        </div>
      )}
      
      {/* Diálogo de confirmación para eliminar mod */}
      <AlertDialog open={!!modToDelete} onOpenChange={(open) => !open && setModToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el mod "{modToDelete?.nombre}" y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMod} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
