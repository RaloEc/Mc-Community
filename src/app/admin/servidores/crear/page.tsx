'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
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
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react'
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

export default function CrearServidor() {
  const [enviando, setEnviando] = useState(false)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  
  // Inicializar formulario con validación
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      ip: '',
      version: '1.20.4',
      jugadores: '0/0',
      tipo: 'Survival',
      imagen: '',
      destacado: false,
      aprobado: true,
    },
  })

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
    try {
      setEnviando(true)
      
      // Preparar datos para insertar
      const servidorData = {
        nombre: values.nombre,
        descripcion: values.descripcion,
        ip: values.ip,
        version: values.version,
        jugadores: values.jugadores,
        tipo: values.tipo,
        imagen: values.imagen || null,
        destacado: values.destacado,
        aprobado: values.aprobado,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      // Insertar en Supabase
      const { data, error } = await supabase
        .from('servidores')
        .insert(servidorData)
        .select('id')
        .single()
      
      if (error) {
        console.error('Error al crear servidor:', error)
        throw new Error('Error al crear servidor: ' + error.message)
      }
      
      // Redirigir a la lista de servidores
      router.push('/admin/servidores')
      
    } catch (error) {
      console.error('Error al crear servidor:', error)
      alert('Error al crear servidor. Por favor, inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
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
        <h1 className="text-3xl font-bold tracking-tight">Crear Servidor</h1>
      </div>
      
      <Card className="border-border/40 dark:bg-black">
        <CardHeader>
          <CardTitle>Información del Servidor</CardTitle>
          <CardDescription>
            Completa los detalles del servidor que deseas añadir a la plataforma.
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
                
                <FormField
                  control={form.control}
                  name="destacado"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Servidor destacado</FormLabel>
                        <FormDescription>
                          Marcar este servidor como destacado en la página principal
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
                      <span>Guardar Servidor</span>
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
