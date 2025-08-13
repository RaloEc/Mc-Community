'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Servidor, SolicitudServidor } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Image as ImageIcon, Loader2 } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import Link from 'next/link'
import { Dropzone } from '@/components/ui/dropzone'

// Tipos de servidores disponibles
const tiposServidor = [
  'Survival',
  'Creativo',
  'SkyBlock',
  'BedWars',
  'SkyWars',
  'Factions',
  'Prison',
  'Towny',
  'Roleplay',
  'Minijuegos',
  'Hardcore',
  'UHC',
  'Vanilla',
  'Modded',
  'Otro'
]

// Esquema de validación
const formSchema = z.object({
  nombre: z.string().min(3, {
    message: 'El nombre debe tener al menos 3 caracteres',
  }).max(50, {
    message: 'El nombre no puede tener más de 50 caracteres',
  }),
  descripcion: z.string().min(10, {
    message: 'La descripción debe tener al menos 10 caracteres',
  }).max(500, {
    message: 'La descripción no puede tener más de 500 caracteres',
  }),
  ip: z.string().min(3, {
    message: 'La IP debe tener al menos 3 caracteres',
  }).max(100, {
    message: 'La IP no puede tener más de 100 caracteres',
  }),
  version: z.string().min(1, {
    message: 'La versión es obligatoria',
  }).max(20, {
    message: 'La versión no puede tener más de 20 caracteres',
  }),
  jugadores: z.string().min(1, {
    message: 'La capacidad de jugadores es obligatoria',
  }).max(20, {
    message: 'La capacidad no puede tener más de 20 caracteres',
  }),
  tipo: z.string().min(1, {
    message: 'El tipo de servidor es obligatorio',
  }),
  imagen: z.string().optional(),
  destacado: z.boolean().default(false),
  aprobado: z.boolean().default(true),
})

export default function EditarServidor({ params }: { params: { id: string } }) {
  const [isSolicitudReview, setIsSolicitudReview] = useState(false);
  const [solicitudOriginal, setSolicitudOriginal] = useState<SolicitudServidor | null>(null);
  const [enviando, setEnviando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [servidor, setServidor] = useState<Servidor | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Inicializar formulario con validación
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      ip: '',
      version: '',
      jugadores: '',
      tipo: '',
      imagen: '',
      destacado: false,
      aprobado: true,
    },
  })

  // Cargar datos del servidor o solicitud
  useEffect(() => {
    async function cargarDatos() {
      try {
        setCargando(true)
        setError(null)
        
        // Primero intentar cargar como una solicitud pendiente
        const { data: solicitudData, error: solicitudError } = await supabase
          .from('solicitudes_servidores')
          .select('*')
          .eq('id', params.id) // Asumimos que el ID de la ruta es el ID de la solicitud
          .single();

        if (solicitudData && !solicitudError) {
          setIsSolicitudReview(true);
          setSolicitudOriginal(solicitudData);
          form.reset({
            nombre: solicitudData.nombre_servidor || '',
            descripcion: solicitudData.descripcion_solicitud || '',
            ip: solicitudData.ip_servidor || '',
            version: solicitudData.version_preferida || '',
            jugadores: '', // El admin debe completar esto
            tipo: solicitudData.tipo_juego || '',
            imagen: solicitudData.url_imagen_logo || '',
            destacado: false,
            aprobado: false, // Se aprobará al guardar
          });
          if (solicitudData.url_imagen_logo) {
            setImagenPreview(solicitudData.url_imagen_logo);
          }
          setCargando(false);
          return;
        } else if (solicitudError && solicitudError.code !== 'PGRST116') { // PGRST116: No rows found
          console.error('Error al cargar solicitud de servidor:', solicitudError);
          setError('No se pudo cargar la solicitud. Por favor, inténtalo de nuevo.');
          setCargando(false);
          return;
        }

        // Si no es una solicitud o no se encontró, intentar cargar como servidor existente
        setIsSolicitudReview(false);
        const { data, error } = await supabase
          .from('servidores')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (error) {
          console.error('Error al cargar servidor:', error)
          setError('No se pudo cargar el servidor. Por favor, inténtalo de nuevo.')
          return
        }
        
        if (!data) {
          setError('No se encontró el servidor solicitado.')
          return
        }
        
        // Guardar datos del servidor (si se cargó uno)
        setServidor(data); 
        
        // Establecer valores en el formulario
        form.reset({
          nombre: data.nombre,
          descripcion: data.descripcion,
          ip: data.ip,
          version: data.version,
          jugadores: data.jugadores,
          tipo: data.tipo,
          imagen: data.imagen || '',
          destacado: data.destacado,
          aprobado: data.aprobado !== undefined ? data.aprobado : true,
        })
        
        // Establecer vista previa de imagen
        if (data.imagen) {
          setImagenPreview(data.imagen)
        }
        
      } catch (error) {
        console.error('Error al cargar servidor:', error)
        setError('Ocurrió un error al cargar los datos del servidor.')
      } finally {
        setCargando(false)
      }
    }
    
    cargarDatos();
  }, [params.id]); // form no debería estar en las dependencias aquí para evitar re-cargas innecesarias

  // Manejar la carga de imagen
  async function handleFileUpload(file: File) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Error al subir la imagen')
      }
      
      const data = await response.json()
      
      if (data.url) {
        // Actualizar la vista previa
        setImagenPreview(data.url)
        // Actualizar el valor en el formulario
        form.setValue('imagen', data.url)
        return data.url
      } else {
        console.error('Error al subir la imagen:', data.error)
        return null
      }
    } catch (error) {
      console.error('Error al subir la imagen:', error)
      return null
    }
  }

  // Enviar formulario
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setEnviando(true);
    setError(null);

    try {
      if (isSolicitudReview && solicitudOriginal) {
        // Aprobar una solicitud y crear nuevo servidor usando la API Route
        const response = await fetch('/api/servidores/aprobar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            id: solicitudOriginal.id,
            // Podemos enviar los valores del formulario para sobrescribir los de la solicitud
            nombre: values.nombre,
            descripcion: values.descripcion,
            ip: values.ip,
            version: values.version,
            capacidad_jugadores: parseInt(values.jugadores) || 100,
            tipo: values.tipo,
            imagen: values.imagen,
            destacado: values.destacado
          }),
        });

        const resultado = await response.json();
        
        if (!response.ok) {
          throw new Error(resultado.error || 'Error al aprobar la solicitud');
        }

        alert('Solicitud de servidor aprobada y servidor creado exitosamente!');
        router.push('/admin/servidores');

      } else if (servidor) {
        // Actualizar un servidor existente usando la API Route
        const response = await fetch('/api/servidores/actualizar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: params.id,
            nombre: values.nombre,
            descripcion: values.descripcion,
            ip: values.ip,
            version: values.version,
            capacidad_jugadores: parseInt(values.jugadores) || 100,
            tipo: values.tipo,
            imagen: values.imagen || null,
            destacado: values.destacado
          }),
        });

        const resultado = await response.json();
        
        if (!response.ok) {
          throw new Error(resultado.error || 'Error al actualizar el servidor');
        }

        alert('Servidor actualizado exitosamente!');
        router.push('/admin/servidores');
      } else {
        throw new Error('No hay servidor ni solicitud para procesar.');
      }
    } catch (e: any) {
      console.error('Error al guardar:', e);
      setError(`Error al guardar: ${e.message}`);
    } finally {
      setEnviando(false);
    }
  }
  // Mostrar pantalla de carga
  if (cargando) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando datos del servidor...</p>
        </div>
      </div>
    )
  }

  // Mostrar mensaje de error si no se pudo cargar el servidor
  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/admin/servidores')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Editar Servidor</h1>
        </div>
        
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin/servidores')}
            >
              Volver a la lista de servidores
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/admin/servidores')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Editar Servidor</h1>
      </div>
      
      <Card className="border-border/40 dark:bg-black">
        <CardHeader>
          <CardTitle>{isSolicitudReview ? 'Revisar Solicitud de Servidor' : 'Editar Servidor'}</CardTitle>
          <CardDescription>
            {isSolicitudReview ? 'Revisa los detalles de la solicitud y completa la información para aprobar el servidor.' : 'Modifica los detalles del servidor existente.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del servidor</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Survival Premium" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nombre visible del servidor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP / Dominio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: play.ejemplo.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        IP o dominio para conectarse al servidor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Versión</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 1.20.4" {...field} />
                      </FormControl>
                      <FormDescription>
                        Versión de Minecraft compatible
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="jugadores"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad de jugadores</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 100/200" {...field} />
                      </FormControl>
                      <FormDescription>
                        Formato: actuales/máximos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de servidor</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposServidor.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Categoría principal del servidor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="destacado"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Servidor destacado</FormLabel>
                          <FormDescription>
                            Mostrar en la sección destacada
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {!isSolicitudReview && (
                    <FormField
                      control={form.control}
                      name="aprobado"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Servidor aprobado</FormLabel>
                            <FormDescription>
                              Visible públicamente en el sitio
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe las características principales del servidor..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Información detallada sobre el servidor, sus características y atractivos
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imagen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagen del servidor</FormLabel>
                    <FormControl>
                      <div>
                        <Dropzone
                          previewUrl={imagenPreview}
                          onFileSelect={handleFileUpload}
                          label="Arrastra y suelta o haz clic para subir una imagen"
                          id="imagen-servidor"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Sube una imagen representativa del servidor (logo, captura de pantalla, etc.)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => router.push('/admin/servidores')}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={enviando}
                  className="gap-1"
                >
                  {enviando ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      <span>{isSolicitudReview ? 'Aprobar y Guardar' : 'Actualizar Servidor'}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
