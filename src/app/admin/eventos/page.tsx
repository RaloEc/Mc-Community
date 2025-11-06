'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  AlertCircle,
  Box as Cube
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Tipos
interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  tipo: 'actualizacion' | 'parche' | 'evento' | 'torneo';
  juego_nombre?: string;
  imagen_url?: string;
  icono_url?: string;
  url?: string;
  estado: 'borrador' | 'publicado' | 'cancelado';
  creado_en: string;
  publicado_en?: string;
}

// Colores para los tipos de eventos
const tipoEventoColor: Record<string, string> = {
  actualizacion: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  parche: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  evento: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  torneo: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
};

// Colores para los estados
const estadoEventoColor: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  publicado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
};

export default function EventosAdmin() {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const supabase = createClient();
  
  // Función para obtener la URL segura del icono
  const getSafeIconUrl = (url: string | undefined) => {
    if (!url) return null;
    
    // Si la URL ya es una URL completa
    if (url.startsWith('http')) {
      // Verificar si hay duplicación de carpeta en la URL
      if (url.includes('iconos-3d/iconos-3d/')) {
        // Corregir la URL duplicada
        const baseUrl = url.split('iconos-3d/iconos-3d/')[0] + 'iconos-3d/';
        const fileName = url.split('iconos-3d/iconos-3d/')[1];
        url = baseUrl + fileName;
        console.log('URL corregida:', url);
      }
      
      // Si ya tiene parámetros, agregar con &, si no, con ?
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${Date.now()}`;
    }
    
    // Determinar la ruta correcta para obtener el icono
    let iconPath = url;
    
    // Verificar si hay duplicación de carpeta en la ruta
    if (iconPath.includes('iconos-3d/iconos-3d/')) {
      iconPath = iconPath.replace('iconos-3d/iconos-3d/', 'iconos-3d/');
      console.log('Ruta corregida:', iconPath);
    } else if (!iconPath.includes('iconos-3d/')) {
      // Si la URL no incluye ya 'iconos-3d/', agregarla
      iconPath = `iconos-3d/${iconPath}`;
    }
    
    try {
      // Obtener la URL pública directamente usando el cliente de Supabase
      const { data } = supabase.storage
        .from('iconos')
        .getPublicUrl(iconPath);
      
      if (!data || !data.publicUrl) {
        console.error('URL pública no disponible para:', iconPath);
        return null;
      }
      
      // Agregar timestamp para evitar problemas de caché
      const publicUrl = data.publicUrl;
      console.log('URL del icono generada:', publicUrl);
      
      // Verificar que la URL sea válida
      if (!publicUrl.startsWith('http')) {
        console.error('URL generada no válida:', publicUrl);
        return null;
      }
      
      return `${publicUrl}?t=${Date.now()}`;
    } catch (error) {
      console.error('Error al obtener URL del icono:', error, 'Path:', iconPath);
      return null;
    }
  };
  const router = useRouter();
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');

  // Redireccionar si no es admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, authLoading, router]);

  // Cargar eventos
  useEffect(() => {
    const fetchEventos = async () => {
      if (!isAdmin) return;
      
      try {
        setIsLoading(true);
        
        // Obtener eventos de Supabase
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .order('fecha', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          // Procesar los eventos para asegurar que las URLs de los iconos sean correctas
          const eventosConURLsCorrectas = data.map(evento => {
            // Si el evento tiene un icono_url, asegurarse de que sea una URL completa
            if (evento.icono_url && !evento.icono_url.startsWith('http')) {
              // Obtener la URL pública del icono
              const { data: publicUrlData } = supabase.storage
                .from('iconos')
                .getPublicUrl(`iconos-3d/${evento.icono_url}`);
              
              return {
                ...evento,
                icono_url: publicUrlData.publicUrl
              };
            }
            return evento;
          });
          
          setEventos(eventosConURLsCorrectas);
          console.log('Eventos cargados:', eventosConURLsCorrectas);
        }
      } catch (error) {
        console.error('Error al cargar eventos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventos();
  }, [isAdmin, supabase]);

  // Filtrar eventos
  const eventosFiltrados = eventos.filter(evento => {
    const matchesSearch = 
      evento.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evento.juego_nombre && evento.juego_nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTipo = tipoFiltro === 'todos' || evento.tipo === tipoFiltro;
    const matchesEstado = estadoFiltro === 'todos' || evento.estado === estadoFiltro;
    
    return matchesSearch && matchesTipo && matchesEstado;
  });

  // Manejar creación de nuevo evento
  const handleCreateEvento = () => {
    router.push('/admin/eventos/crear');
  };

  // Manejar edición de evento
  const handleEditEvento = (id: string) => {
    router.push(`/admin/eventos/editar/${id}`);
  };

  // Manejar vista previa de evento
  const handlePreviewEvento = (id: string) => {
    router.push(`/admin/eventos/vista-previa/${id}`);
  };

  // Manejar eliminación de evento (borrado suave)
  const handleDeleteEvento = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      try {
        // Borrado suave: actualizar el campo 'eliminado' a true
        const { error } = await supabase
          .from('eventos')
          .update({ eliminado: true })
          .eq('id', id);
          
        if (error) throw error;
        
        // Actualizar la lista de eventos
        setEventos(eventos.filter(evento => evento.id !== id));
      } catch (error) {
        console.error('Error al eliminar evento:', error);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Cargando...</h1>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Redirigiendo...
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Eventos</h1>
        <Button onClick={handleCreateEvento} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Crear Evento
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar eventos..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="actualizacion">Actualizaciones</SelectItem>
              <SelectItem value="parche">Parches</SelectItem>
              <SelectItem value="evento">Eventos</SelectItem>
              <SelectItem value="torneo">Torneos</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="publicado">Publicado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla de eventos */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No se encontraron eventos</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || tipoFiltro !== 'todos' || estadoFiltro !== 'todos'
              ? 'No hay eventos que coincidan con los filtros aplicados.'
              : 'No hay eventos creados aún. Crea tu primer evento.'}
          </p>
          <Button onClick={handleCreateEvento} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Crear Evento
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventosFiltrados.map((evento) => (
                <TableRow key={evento.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden relative">
                        {evento.icono_url ? (
                          <>
                            <img 
                              src={getSafeIconUrl(evento.icono_url) || ''} 
                              alt={evento.juego_nombre || 'Icono'} 
                              className="h-10 w-10 object-contain"
                              onError={(e) => {
                                // Si la imagen falla, mostrar un icono de fallback
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                const fallback = img.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                                if (fallback) {
                                  fallback.style.display = 'flex';
                                }
                                console.log('Error al cargar imagen:', evento.icono_url);
                              }}
                              onLoad={(e) => {
                                // Si la imagen se carga correctamente, asegurarse de que esté visible
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'block';
                                console.log('Imagen cargada correctamente:', evento.icono_url);
                              }}
                            />
                            <div className="fallback-icon absolute inset-0 items-center justify-center" style={{display: 'none'}}>
                              <Cube className="h-6 w-6 text-gray-400" />
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <Cube className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{evento.titulo}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {evento.juego_nombre || 'Sin juego especificado'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={tipoEventoColor[evento.tipo]}>
                      {evento.tipo === 'actualizacion' ? 'Actualización' : 
                       evento.tipo === 'parche' ? 'Parche' : 
                       evento.tipo === 'evento' ? 'Evento' : 'Torneo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{format(new Date(evento.fecha), 'dd MMM yyyy', { locale: es })}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={estadoEventoColor[evento.estado]}>
                      {evento.estado === 'borrador' ? 'Borrador' : 
                       evento.estado === 'publicado' ? 'Publicado' : 'Cancelado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditEvento(evento.id)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteEvento(evento.id)}
                        title="Eliminar"
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
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
      )}
    </div>
  );
}
