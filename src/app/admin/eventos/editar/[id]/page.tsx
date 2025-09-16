'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Clock, Upload, Link, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Esquema de validación
const eventoSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(100, 'El título no puede exceder los 100 caracteres'),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  fecha: z.date({
    required_error: 'La fecha es obligatoria',
  }),
  tipo: z.enum(['actualizacion', 'parche', 'evento', 'torneo'], {
    required_error: 'Debes seleccionar un tipo de evento',
  }),
  juego_nombre: z.string().optional(),
  imagen_url: z.string().optional(),
  icono_url: z.string().optional(),
  url: z.string().url('La URL debe ser válida').optional().or(z.literal('')),
  estado: z.enum(['borrador', 'publicado', 'cancelado'], {
    required_error: 'Debes seleccionar un estado',
  }),
});

type EventoFormValues = z.infer<typeof eventoSchema>;

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

// Datos de ejemplo
const eventosDemo: Record<string, Evento> = {
  '1': {
    id: '1',
    titulo: 'Actualización DeltaForce 2.5',
    descripcion: 'Nueva actualización con mapas y armas',
    fecha: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tipo: 'actualizacion',
    juego_nombre: 'DeltaForce',
    imagen_url: 'https://via.placeholder.com/150',
    icono_url: 'https://via.placeholder.com/50',
    estado: 'borrador',
    creado_en: new Date().toISOString()
  },
  '2': {
    id: '2',
    titulo: 'Parche de seguridad Minecraft',
    descripcion: 'Corrección de vulnerabilidades críticas',
    fecha: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    tipo: 'parche',
    juego_nombre: 'Minecraft',
    imagen_url: 'https://via.placeholder.com/150',
    icono_url: 'https://via.placeholder.com/50',
    estado: 'publicado',
    creado_en: new Date().toISOString(),
    publicado_en: new Date().toISOString()
  },
  '3': {
    id: '3',
    titulo: 'Torneo semanal de PvP',
    descripcion: 'Competencia con premios para los ganadores',
    fecha: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    tipo: 'torneo',
    juego_nombre: 'Minecraft',
    imagen_url: 'https://via.placeholder.com/150',
    icono_url: 'https://via.placeholder.com/50',
    estado: 'publicado',
    creado_en: new Date().toISOString(),
    publicado_en: new Date().toISOString()
  }
};

export default function EditarEvento({ params }: { params: { id: string } }) {
  const { isAdmin, isLoading: authLoading, user: authUser } = useAdminAuth();
  const supabase = createClient();
  const router = useRouter();
  const { id } = params;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [iconoPreview, setIconoPreview] = useState<string | null>(null);

  // Inicializar formulario
  const form = useForm<EventoFormValues>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      fecha: new Date(),
      tipo: 'evento',
      juego_nombre: '',
      imagen_url: '',
      icono_url: '',
      url: '',
      estado: 'borrador',
    },
  });

  // Redireccionar si no es admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, authLoading, router]);

  // Cargar datos del evento
  useEffect(() => {
    const fetchEvento = async () => {
      if (!isAdmin) return;
      
      try {
        setIsLoading(true);
        
        // Obtener evento de Supabase
        const { data: eventoData, error } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (eventoData) {
          setEvento(eventoData);
          
          // Establecer valores en el formulario
          form.reset({
            titulo: eventoData.titulo,
            descripcion: eventoData.descripcion,
            fecha: new Date(eventoData.fecha),
            tipo: eventoData.tipo,
            juego_nombre: eventoData.juego_nombre || '',
            imagen_url: eventoData.imagen_url || '',
            icono_url: eventoData.icono_url || '',
            url: eventoData.url || '',
            estado: eventoData.estado,
          });
          
          // Establecer previsualizaciones
          if (eventoData.imagen_url) {
            setImagenPreview(eventoData.imagen_url);
          }
          
          if (eventoData.icono_url) {
            setIconoPreview(eventoData.icono_url);
          }
        } else {
          // Evento no encontrado
          router.push('/admin/eventos');
        }
      } catch (error) {
        console.error('Error al cargar evento:', error);
        router.push('/admin/eventos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvento();
  }, [id, isAdmin, router, form, supabase]);

  // Manejar envío del formulario
  const onSubmit = async (data: EventoFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Actualizar evento en Supabase
      const { data: eventoActualizado, error } = await supabase
        .from('eventos')
        .update({
          titulo: data.titulo,
          descripcion: data.descripcion,
          fecha: data.fecha.toISOString(),
          tipo: data.tipo,
          juego_nombre: data.juego_nombre || null,
          imagen_url: data.imagen_url || null,
          icono_url: data.icono_url || null,
          url: data.url || null,
          estado: data.estado,
          actualizado_en: new Date().toISOString(),
          // Si el estado cambia a publicado, actualizamos la fecha de publicación
          ...(data.estado === 'publicado' && evento?.estado !== 'publicado' ? { publicado_en: new Date().toISOString() } : {})
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      console.log('Evento actualizado:', eventoActualizado);
      
      // Redireccionar a la lista de eventos
      router.push('/admin/eventos');
    } catch (error) {
      console.error('Error al actualizar evento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar carga de imagen
  const handleImagenUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Crear URL local temporal para vista previa
        const previewUrl = URL.createObjectURL(file);
        setImagenPreview(previewUrl);
        
        // Subir imagen a Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `evento-imagen-${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('iconos')
          .upload(`eventos/${fileName}`, file);
          
        if (error) throw error;
        
        // Obtener URL pública
        const { data: publicUrlData } = supabase.storage
          .from('iconos')
          .getPublicUrl(`eventos/${fileName}`);
          
        form.setValue('imagen_url', publicUrlData.publicUrl);
      } catch (error) {
        console.error('Error al subir imagen:', error);
        // Mantener la URL local temporal en caso de error
      }
    }
  };

  // Manejar carga de icono 3D
  const handleIconoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Crear URL local temporal para vista previa
        const previewUrl = URL.createObjectURL(file);
        setIconoPreview(previewUrl);
        
        // Subir icono a Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `evento-icono-3d-${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('iconos')
          .upload(`iconos-3d/${fileName}`, file);
          
        if (error) throw error;
        
        // Guardar la ruta completa del archivo en el bucket
        form.setValue('icono_url', `iconos-3d/${fileName}`);
      } catch (error) {
        console.error('Error al subir icono 3D:', error);
        // Mantener la URL local temporal en caso de error
      }
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Cargando...</h1>
        </div>
        <div className="space-y-4">
          <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin || !evento) {
    return null; // Redirigiendo...
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Editar Evento</h1>
        <Button variant="outline" onClick={() => router.push('/admin/eventos')}>
          Volver a la lista
        </Button>
      </div>

      <Tabs defaultValue="detalles" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="detalles">Detalles del Evento</TabsTrigger>
          <TabsTrigger value="multimedia">Multimedia</TabsTrigger>
          <TabsTrigger value="vista-previa">Vista Previa</TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="detalles" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Edita los detalles principales del evento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Título del evento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe el evento" 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fecha"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha del evento</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: es })
                                  ) : (
                                    <span>Selecciona una fecha</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de evento</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="actualizacion">Actualización</SelectItem>
                              <SelectItem value="parche">Parche</SelectItem>
                              <SelectItem value="evento">Evento</SelectItem>
                              <SelectItem value="torneo">Torneo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="juego_nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Juego relacionado</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del juego (opcional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL (opcional)</FormLabel>
                        <FormControl>
                          <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                            <Link className="ml-3 h-4 w-4 text-gray-400" />
                            <Input 
                              placeholder="https://ejemplo.com/evento" 
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="borrador">Borrador</SelectItem>
                            <SelectItem value="publicado">Publicado</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="multimedia" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Imágenes</CardTitle>
                  <CardDescription>
                    Actualiza las imágenes del evento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <FormLabel>Imagen destacada</FormLabel>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center w-full h-40">
                          {imagenPreview ? (
                            <div className="relative w-full h-full">
                              <img 
                                src={imagenPreview} 
                                alt="Vista previa" 
                                className="w-full h-full object-cover rounded-md"
                              />
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => {
                                  setImagenPreview(null);
                                  form.setValue('imagen_url', '');
                                }}
                              >
                                <span className="sr-only">Eliminar</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 6L6 18M6 6l12 12"></path>
                                </svg>
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-10 w-10 text-gray-400 mb-2" />
                              <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                <label htmlFor="imagen-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80">
                                  <span>Subir imagen</span>
                                  <input 
                                    id="imagen-upload" 
                                    name="imagen-upload" 
                                    type="file" 
                                    className="sr-only" 
                                    accept="image/*"
                                    onChange={handleImagenUpload}
                                  />
                                </label>
                                <p>o arrastra y suelta</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF hasta 5MB</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <FormLabel>Icono 3D del juego</FormLabel>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center w-32 h-32">
                          {iconoPreview ? (
                            <div className="relative w-full h-full">
                              <img 
                                src={iconoPreview} 
                                alt="Vista previa del icono" 
                                className="w-full h-full object-cover rounded-md"
                              />
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => {
                                  setIconoPreview(null);
                                  form.setValue('icono_url', '');
                                }}
                              >
                                <span className="sr-only">Eliminar</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 6L6 18M6 6l12 12"></path>
                                </svg>
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-gray-400 mb-2" />
                              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                <label htmlFor="icono-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80">
                                  <span>Subir icono</span>
                                  <input 
                                    id="icono-upload" 
                                    name="icono-upload" 
                                    type="file" 
                                    className="sr-only" 
                                    accept="image/*"
                                    onChange={handleIconoUpload}
                                  />
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            El icono 3D se mostrará junto al nombre del evento. Idealmente debe ser un icono cuadrado con fondo transparente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="vista-previa" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vista Previa</CardTitle>
                  <CardDescription>
                    Así se verá el evento en la página principal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {form.getValues('titulo') ? (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        {(iconoPreview || form.getValues('icono_url')) && (
                          <img 
                            src={iconoPreview || form.getValues('icono_url')} 
                            alt="Icono del evento" 
                            className="w-12 h-12 rounded-md object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{form.getValues('titulo')}</h3>
                            <Badge className={
                              form.getValues('tipo') === 'actualizacion' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                              form.getValues('tipo') === 'parche' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              form.getValues('tipo') === 'evento' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                              'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            }>
                              {form.getValues('tipo') === 'actualizacion' ? 'Actualización' : 
                               form.getValues('tipo') === 'parche' ? 'Parche' : 
                               form.getValues('tipo') === 'evento' ? 'Evento' : 'Torneo'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {form.getValues('descripcion') || 'Sin descripción'}
                          </p>
                          
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>
                              {form.getValues('fecha') 
                                ? format(form.getValues('fecha'), 'dd MMM yyyy', { locale: es })
                                : 'Fecha no especificada'}
                            </span>
                            
                            {form.getValues('juego_nombre') && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{form.getValues('juego_nombre')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {(imagenPreview || form.getValues('imagen_url')) && (
                        <div className="mt-3">
                          <img 
                            src={imagenPreview || form.getValues('imagen_url')} 
                            alt="Imagen del evento" 
                            className="w-full h-40 object-cover rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay datos suficientes</h3>
                      <p className="text-gray-500">
                        Completa al menos el título y la descripción para ver una vista previa.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/admin/eventos')}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
}
