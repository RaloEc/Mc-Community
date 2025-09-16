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
  Calendar as CalendarIcon, 
  Clock, 
  Upload, 
  Link, 
  Calendar, 
  AlertCircle, 
  Gamepad2, 
  Info, 
  ImageIcon, 
  CheckCircle2, 
  XCircle,
  PlusCircle,
  Edit as EditIcon,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';

// Interfaces para los tipos de datos
interface Juego {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  imagen_portada_url?: string;
  icono_url?: string;
  fecha_lanzamiento?: string;
  desarrollador?: string;
  created_at?: string;
  updated_at?: string;
}

// Esquema de validación para juegos
const juegoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede exceder los 100 caracteres'),
  slug: z.string().min(2, 'El slug debe tener al menos 2 caracteres').max(100, 'El slug no puede exceder los 100 caracteres'),
  descripcion: z.string().optional(),
  desarrollador: z.string().optional(),
  fecha_lanzamiento: z.date().optional().nullable(),
  icono_url: z.string().optional(),
});

type JuegoFormValues = z.infer<typeof juegoSchema>;

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
  tipo_icono: z.enum(['juego_existente', 'personalizado'], {
    required_error: 'Debes seleccionar el tipo de icono',
  }),
  juego_id: z.string().optional(),
  juego_nombre: z.string().optional(),
  imagen_url: z.string().optional(),
  icono_url: z.string().optional(),
  url: z.string().url('La URL debe ser válida').optional().or(z.literal('')),
  estado: z.enum(['borrador', 'publicado', 'cancelado'], {
    required_error: 'Debes seleccionar un estado',
  }),
});

type EventoFormValues = z.infer<typeof eventoSchema>;

export default function CrearEvento() {
  const { isAdmin, isLoading: authLoading, user: authUser } = useAdminAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [iconoPreview, setIconoPreview] = useState<string | null>(null);
  const [juegos, setJuegos] = useState<Juego[]>([]);
  const [juegoSeleccionado, setJuegoSeleccionado] = useState<Juego | null>(null);
  const [isLoadingJuegos, setIsLoadingJuegos] = useState(true);
  const [isJuegoDialogOpen, setIsJuegoDialogOpen] = useState(false);
  const [juegoEditando, setJuegoEditando] = useState<Juego | null>(null);
  const [juegoIconoPreview, setJuegoIconoPreview] = useState<string | null>(null);
  const [isSubmittingJuego, setIsSubmittingJuego] = useState(false);

  // Inicializar formulario
  const form = useForm<EventoFormValues>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      fecha: new Date(),
      tipo: 'evento',
      tipo_icono: 'personalizado',
      juego_id: '',
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

  // Cargar juegos desde Supabase
  useEffect(() => {
    fetchJuegos();
  }, []);

  // Observar cambios en el tipo de icono
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'tipo_icono') {
        // Si cambia a personalizado, limpiar juego_id
        if (value.tipo_icono === 'personalizado') {
          form.setValue('juego_id', '');
          form.setValue('juego_nombre', '');
          setJuegoSeleccionado(null);
        }
      }
      
      if (name === 'juego_id' && value.juego_id) {
        // Buscar el juego seleccionado
        const juego = juegos.find(j => j.id === value.juego_id);
        if (juego) {
          setJuegoSeleccionado(juego);
          form.setValue('juego_nombre', juego.nombre);
          
          // Si el juego tiene icono, usarlo
          if (juego.icono_url) {
            // Obtener la URL pública del icono
            const { data } = supabase.storage
              .from('iconos')
              .getPublicUrl(juego.icono_url);
              
            if (data && data.publicUrl) {
              form.setValue('icono_url', juego.icono_url);
              setIconoPreview(data.publicUrl);
            }
          }
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, juegos, supabase]);

  // Manejar envío del formulario
  const onSubmit = async (data: EventoFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Crear el evento en la base de datos
      const { data: eventoCreado, error } = await supabase
        .from('eventos')
        .insert([
          {
            titulo: data.titulo,
            descripcion: data.descripcion,
            fecha: data.fecha.toISOString(),
            tipo: data.tipo,
            juego_nombre: data.juego_nombre || null,
            imagen_url: data.imagen_url || null,
            icono_url: data.icono_url || null,
            url: data.url || null,
            estado: data.estado,
            creador_id: authUser?.id
          }
        ])
        .select();
      
      if (error) throw error;
      
      console.log('Evento creado:', eventoCreado);
      
      // Redireccionar a la lista de eventos
      router.push('/admin/eventos');
    } catch (error) {
      console.error('Error al crear evento:', error);
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
        
        // Guardar la ruta relativa del archivo en el bucket
        form.setValue('icono_url', `iconos-3d/${fileName}`);
      } catch (error) {
        console.error('Error al subir icono 3D:', error);
        // Mantener la URL local temporal en caso de error
      }
    }
  };

  // Formulario para crear/editar juegos
  const juegoForm = useForm<JuegoFormValues>({
    resolver: zodResolver(juegoSchema),
    defaultValues: {
      nombre: '',
      slug: '',
      descripcion: '',
      desarrollador: '',
      fecha_lanzamiento: null,
    },
  });

  // Inicializar formulario de juego para edición
  const inicializarFormularioJuego = (juego: Juego | null) => {
    if (juego) {
      // Modo edición
      juegoForm.reset({
        id: juego.id,
        nombre: juego.nombre,
        descripcion: juego.descripcion || '',
        desarrollador: juego.desarrollador || '',
        fecha_lanzamiento: juego.fecha_lanzamiento ? new Date(juego.fecha_lanzamiento) : null,
        icono_url: juego.icono_url || '',
      });

      // Si el juego tiene icono, mostrar vista previa
      if (juego.icono_url) {
        const { data } = supabase.storage
          .from('iconos')
          .getPublicUrl(juego.icono_url);
        
        if (data && data.publicUrl) {
          setJuegoIconoPreview(data.publicUrl);
        }
      } else {
        setJuegoIconoPreview(null);
      }
    } else {
      // Modo creación
      juegoForm.reset({
        nombre: '',
        descripcion: '',
        desarrollador: '',
        fecha_lanzamiento: null,
        icono_url: '',
      });
      setJuegoIconoPreview(null);
    }
  };

  // Abrir diálogo para crear un nuevo juego
  const handleNuevoJuego = () => {
    setJuegoEditando(null);
    inicializarFormularioJuego(null);
    setIsJuegoDialogOpen(true);
  };

  // Abrir diálogo para editar un juego existente
  const handleEditarJuego = (juego: Juego) => {
    setJuegoEditando(juego);
    inicializarFormularioJuego(juego);
    setIsJuegoDialogOpen(true);
  };

  // Manejar carga de icono para juego
  const handleJuegoIconoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Crear URL local temporal para vista previa
        const previewUrl = URL.createObjectURL(file);
        setJuegoIconoPreview(previewUrl);
        
        // Subir icono a Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `juego-icono-${Date.now()}.${fileExt}`;
        const filePath = `iconos-3d/${fileName}`;
        
        // Si estamos editando un juego y ya tiene un icono, eliminarlo primero
        if (juegoEditando?.icono_url) {
          try {
            await supabase.storage
              .from('iconos')
              .remove([juegoEditando.icono_url]);
            console.log('Icono anterior eliminado:', juegoEditando.icono_url);
          } catch (removeError) {
            console.warn('No se pudo eliminar el icono anterior:', removeError);
            // Continuamos aunque falle la eliminación
          }
        }
        
        // Subir el nuevo icono
        const { data, error } = await supabase.storage
          .from('iconos')
          .upload(filePath, file, { upsert: true });
          
        if (error) throw error;
        
        // Guardar la ruta relativa del archivo en el bucket
        juegoForm.setValue('icono_url', filePath);
        console.log('Nuevo icono subido:', filePath);
      } catch (error) {
        console.error('Error al subir icono del juego:', error);
        toast({
          title: 'Error',
          description: 'No se pudo subir el icono del juego.',
          variant: 'destructive',
        });
      }
    }
  };

  // Ya no necesitamos generar slug automáticamente desde el nombre en tiempo real
  // porque lo generaremos al momento de guardar

  // Guardar juego (crear o actualizar)
  const onSubmitJuego = async (data: JuegoFormValues) => {
    try {
      setIsSubmittingJuego(true);
      
      // Generar slug a partir del nombre
      const generatedSlug = data.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const juegoData = {
        nombre: data.nombre,
        slug: generatedSlug,
        descripcion: data.descripcion || null,
        desarrollador: data.desarrollador || null,
        fecha_lanzamiento: data.fecha_lanzamiento ? data.fecha_lanzamiento.toISOString() : null,
        icono_url: data.icono_url || null,
      };
      
      console.log('Guardando juego con datos:', juegoData);
      
      let result;
      
      if (juegoEditando) {
        // Actualizar juego existente
        result = await supabase
          .from('juegos')
          .update(juegoData)
          .eq('id', juegoEditando.id)
          .select();
      } else {
        // Crear nuevo juego
        result = await supabase
          .from('juegos')
          .insert([juegoData])
          .select();
      }
      
      const { data: juegoGuardado, error } = result;
      
      if (error) throw error;
      
      // Actualizar lista de juegos
      await fetchJuegos();
      
      // Cerrar diálogo
      setIsJuegoDialogOpen(false);
      
      // Mostrar mensaje de éxito
      toast({
        title: juegoEditando ? 'Juego actualizado' : 'Juego creado',
        description: `El juego ${data.nombre} ha sido ${juegoEditando ? 'actualizado' : 'creado'} correctamente.`,
        variant: 'default',
      });
      
    } catch (error) {
      console.error('Error al guardar juego:', error);
      toast({
        title: 'Error',
        description: `Ocurrió un error al ${juegoEditando ? 'actualizar' : 'crear'} el juego.`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingJuego(false);
    }
  };
  
  // Función para cargar juegos
  const fetchJuegos = async () => {
    try {
      setIsLoadingJuegos(true);
      const { data, error } = await supabase
        .from('juegos')
        .select('id, nombre, slug, icono_url, descripcion, desarrollador, fecha_lanzamiento')
        .order('nombre');

      if (error) throw error;
      
      if (data) {
        setJuegos(data);
        console.log('Juegos cargados:', data);
      }
    } catch (error) {
      console.error('Error al cargar juegos:', error);
    } finally {
      setIsLoadingJuegos(false);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Crear Nuevo Evento</h1>
        <Button variant="outline" onClick={() => router.push('/admin/eventos')}>
          Volver a la lista
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Sección de Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Ingresa los detalles principales del evento
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
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
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

          {/* Sección de Juego e Icono */}
          <Card>
            <CardHeader>
              <CardTitle>Juego e Icono</CardTitle>
              <CardDescription>
                Selecciona un juego existente o sube un icono personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="tipo_icono"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de icono</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="juego_existente" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Seleccionar juego existente
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="personalizado" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Subir icono personalizado
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('tipo_icono') === 'juego_existente' && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="juego_id"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Seleccionar juego</FormLabel>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={handleNuevoJuego}
                            >
                              <PlusCircle className="h-4 w-4" />
                              <span>Nuevo</span>
                            </Button>
                            {field.value && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => {
                                  const juego = juegos.find(j => j.id === field.value);
                                  if (juego) handleEditarJuego(juego);
                                }}
                              >
                                <EditIcon className="h-4 w-4" />
                                <span>Editar</span>
                              </Button>
                            )}
                          </div>
                        </div>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un juego" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingJuegos ? (
                              <SelectItem value="cargando" disabled>Cargando juegos...</SelectItem>
                            ) : juegos.length > 0 ? (
                              juegos.map((juego) => (
                                <SelectItem key={juego.id} value={juego.id}>
                                  {juego.nombre}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-hay-juegos" disabled>No hay juegos disponibles</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {form.watch('tipo_icono') === 'personalizado' && (
                <div>
                  <FormLabel>Icono personalizado</FormLabel>
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
                            <XCircle className="h-4 w-4" />
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
                        El icono se mostrará junto al nombre del evento. Idealmente debe ser un icono cuadrado con fondo transparente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {juegoSeleccionado && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <p className="text-sm">
                      Juego seleccionado: <span className="font-medium">{juegoSeleccionado.nombre}</span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sección de Imagen Destacada */}
          <Card>
            <CardHeader>
              <CardTitle>Imagen Destacada</CardTitle>
              <CardDescription>
                Sube una imagen para el evento (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
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
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
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
            </CardContent>
          </Card>

          {/* Vista previa */}
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
                        src={iconoPreview} 
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
                        src={imagenPreview} 
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

          {/* Botones de acción */}
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
              {isSubmitting ? 'Guardando...' : 'Guardar Evento'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Diálogo para crear/editar juegos */}
      <Dialog open={isJuegoDialogOpen} onOpenChange={setIsJuegoDialogOpen}>
        <DialogContent className="w-[150vw] max-w-[2000px] h-[90vh] flex flex-col p-0">
          <DialogHeader className="pr-4">
            <DialogTitle>{juegoEditando ? 'Editar juego' : 'Crear nuevo juego'}</DialogTitle>
            <DialogDescription>
              {juegoEditando 
                ? 'Modifica los datos del juego seleccionado.' 
                : 'Completa los datos para crear un nuevo juego.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...juegoForm}>
            <form onSubmit={juegoForm.handleSubmit(onSubmitJuego)} className="flex flex-col h-[calc(90vh-150px)]">
              <ScrollArea className="flex-1 w-full pr-6 pl-6">
                <div className="space-y-6 pr-2">
                  {/* Nombre del juego */}
                  <FormField
                    control={juegoForm.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del juego</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del juego" {...field} />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500">El slug para URLs se generará automáticamente a partir del nombre.</p>
                      </FormItem>
                    )}
                  />

                  {/* Descripción */}
                  <FormField
                    control={juegoForm.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción (opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descripción del juego" 
                            className="min-h-[100px]" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Desarrollador */}
                  <FormField
                    control={juegoForm.control}
                    name="desarrollador"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desarrollador (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del desarrollador" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Fecha de lanzamiento */}
                  <FormField
                    control={juegoForm.control}
                    name="fecha_lanzamiento"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de lanzamiento (opcional)</FormLabel>
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
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Icono */}
                  <div>
                    <div className="flex items-center justify-between">
                      <FormLabel>Icono del juego (opcional)</FormLabel>
                      {juegoEditando?.icono_url && juegoIconoPreview && (
                        <Badge variant="outline" className="px-2 py-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Icono existente</span>
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center w-32 h-32">
                        {juegoIconoPreview ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={juegoIconoPreview} 
                              alt="Vista previa del icono" 
                              className="w-full h-full object-contain rounded-md"
                            />
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => {
                                setJuegoIconoPreview(null);
                                juegoForm.setValue('icono_url', '');
                              }}
                            >
                              <span className="sr-only">Eliminar</span>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              <label htmlFor="juego-icono-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80">
                                <span>{juegoEditando ? 'Cambiar icono' : 'Subir icono'}</span>
                                <input 
                                  id="juego-icono-upload" 
                                  name="juego-icono-upload" 
                                  type="file" 
                                  className="sr-only" 
                                  accept="image/*"
                                  onChange={handleJuegoIconoUpload}
                                />
                              </label>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {juegoEditando && juegoIconoPreview ? (
                            <>Puedes <strong>cambiar</strong> el icono existente o <strong>eliminarlo</strong> usando el botón X.</>  
                          ) : (
                            <>El icono se mostrará junto al nombre del juego. Idealmente debe ser un icono cuadrado con fondo transparente.</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="sticky bottom-0 bg-background pt-4 pb-2 -mx-6 px-6 border-t">
                <div className="flex justify-end gap-3 w-full">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsJuegoDialogOpen(false)}
                    className="min-w-[100px]"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmittingJuego}
                    className="flex items-center gap-2 min-w-[120px]"
                  >
                    {isSubmittingJuego ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Guardar</span>
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
