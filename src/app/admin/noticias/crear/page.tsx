'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getServiceClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import TiptapEditor, { processEditorContent } from '@/components/TiptapEditor' // Importamos processEditorContent
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
import { ArrowLeft, Save, Image as ImageIcon, Upload } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import Link from 'next/link'
import { Dropzone } from '@/components/ui/dropzone'
import AdminProtection from '@/components/AdminProtection'

// Tipo para las categorías
type Categoria = {
  id: string;
  nombre: string;
  parent_id?: string | null;
  slug?: string | null;
  descripcion?: string | null;
  orden?: number | null;
  color?: string | null;
  icono?: string | null;
  tipo?: string;
  hijos?: Categoria[];
}

// Esquema de validación
const formSchema = z.object({
  titulo: z.string().min(5, {
    message: 'El título debe tener al menos 5 caracteres',
  }).max(100, {
    message: 'El título no puede tener más de 100 caracteres',
  }).optional(), // Hacer opcional temporalmente
  contenido: z.string().optional(), // Hacer opcional temporalmente
  categoria_ids: z.array(z.string()).optional(), // Hacer opcional temporalmente
  imagen_portada: z.string().optional(),
  autor: z.string().optional(),
  destacada: z.boolean().default(false),
})

function CrearNoticiaContent() {
  const [enviando, setEnviando] = useState(false)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargandoCategorias, setCargandoCategorias] = useState(true)
  const [nombreUsuario, setNombreUsuario] = useState('Admin') // Valor predeterminado
  const router = useRouter()
  const { user, session } = useAuth() // Usar el contexto de autenticación
  
  // Función para renderizar categorías jerárquicas
  const renderCategoriasJerarquicas = (categorias: Categoria[], field: any, isMobile: boolean, nivel: number = 0) => {
    return (
      <div className={`${nivel > 0 ? 'ml-4 border-l-2 pl-2 border-gray-200 dark:border-gray-700' : ''}`}>
        {categorias.map((categoria) => {
          const isSelected = field.value?.includes(categoria.id);
          const tieneHijos = categoria.hijos && categoria.hijos.length > 0;
          
          return (
            <div key={categoria.id} className="mb-1">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={`text-sm ${isSelected ? 'bg-primary text-primary-foreground' : ''} ${categoria.color ? `border-${categoria.color}-500` : ''}`}
                  onClick={() => {
                    if (isSelected) {
                      const updatedCategories = field.value.filter((id: string) => id !== categoria.id);
                      field.onChange(updatedCategories);
                    } else if (field.value.length < 4) {
                      field.onChange([...field.value, categoria.id]);
                    }
                  }}
                >
                  {categoria.icono && (
                    <span className="mr-1">{categoria.icono}</span>
                  )}
                  {categoria.nombre}
                </Button>
                
                {categoria.descripcion && (
                  <span className="text-xs text-muted-foreground hidden md:inline">{categoria.descripcion}</span>
                )}
              </div>
              
              {tieneHijos && (
                renderCategoriasJerarquicas(categoria.hijos!, field, isMobile, nivel + 1)
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Cargar categorías al iniciar
  useEffect(() => {
    async function cargarCategorias() {
      try {
        setCargandoCategorias(true)
        
        // Usar la API Route con soporte para jerarquía
        const response = await fetch('/api/admin/categorias')
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.data) {
          setCategorias(result.data)
        } else if (result.error) {
          console.error('Error al cargar categorías:', result.error)
        }
      } catch (error) {
        console.error('Error al cargar categorías:', error)
      } finally {
        setCargandoCategorias(false)
      }
    }
    
    cargarCategorias()
  }, [])

  // Estado para almacenar el ID del usuario actual
  const [usuarioId, setUsuarioId] = useState<string | null>(null)

  // Obtener información del usuario actual
  useEffect(() => {
    async function obtenerUsuario() {
      try {
        console.log('Obteniendo información del usuario actual desde AuthContext...')
        
        // Usar el usuario del contexto de autenticación en lugar de consultar directamente a Supabase
        if (!session || !user) {
          console.warn('No hay usuario autenticado en el contexto')
          
          // Intentar obtener la sesión usando el cliente del navegador como respaldo
          const supabaseBrowser = createClient()
          const { data: { user: supabaseUser }, error: userError } = await supabaseBrowser.auth.getUser()
          
          if (userError || !supabaseUser) {
            console.error('Error al obtener usuario autenticado como respaldo:', userError)
            return
          }
          
          console.log('Usuario autenticado desde cliente respaldo:', supabaseUser.id, supabaseUser.email)
          setUsuarioId(supabaseUser.id)
          setNombreUsuario(supabaseUser.email || 'Admin')
          return
        }
        
        console.log('Usuario autenticado desde contexto:', user.id, user.email || user.username)
        // Guardar el ID del usuario
        setUsuarioId(user.id)
        
        // Usar la información del perfil que ya tenemos en el contexto
        if (user.username) {
          console.log('Usando nombre de usuario del contexto:', user.username)
          setNombreUsuario(user.username)
        } else if (user.email) {
          console.log('Usando email del contexto:', user.email)
          setNombreUsuario(user.email)
        } else if (session?.user?.email) {
          console.log('Usando email de la sesión:', session.user.email)
          setNombreUsuario(session.user.email)
        } else {
          console.log('No se encontró nombre en el contexto, usando valor predeterminado')
          setNombreUsuario('Admin')
        }
      } catch (error) {
        console.error('Error general al obtener usuario:', error)
        // En caso de error, establecer un valor predeterminado
        setNombreUsuario('Admin')
      }
    }
    
    obtenerUsuario()
  }, [])

  // Configurar el formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      contenido: '',
      categoria_ids: [],
      imagen_portada: '',
      autor: nombreUsuario,
      destacada: false,
    },
    mode: 'onChange', // Cambiar a onChange para validación más suave
    reValidateMode: 'onBlur', // Validar solo al salir del campo
  })

  // Función para manejar eventos que podrían causar desplazamiento
  const preventDefaultScroll = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Agregar manejadores de eventos para prevenir desplazamiento
  useEffect(() => {
    const editorElement = document.querySelector('.ProseMirror')
    if (editorElement) {
      editorElement.addEventListener('wheel', preventDefaultScroll, { passive: false })
      editorElement.addEventListener('touchmove', preventDefaultScroll, { passive: false })
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener('wheel', preventDefaultScroll)
        editorElement.removeEventListener('touchmove', preventDefaultScroll)
      }
    }
  }, [])

  // Manejar la carga de imagen
  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim()
    
    // Validar URL si no está vacía
    if (url) {
      try {
        new URL(url)
        form.setValue('imagen_portada', url)
        setImagenPreview(url)
      } catch (error) {
        // URL inválida
        form.setValue('imagen_portada', '')
        setImagenPreview(null)
        alert('Por favor, introduce una URL de imagen válida')
      }
    } else {
      // URL vacía
      form.setValue('imagen_portada', '')
      setImagenPreview(null)
    }
  }

  // Subir archivo a Supabase Storage usando la API Route
  const handleFileUpload = async (file: File) => {
    if (!file) return
    try {
      // Mostrar indicador de carga o mensaje
      setEnviando(true)
      
      // Crear FormData para enviar el archivo
      const formData = new FormData()
      formData.append('file', file)
      
      // Usar nuestra API Route en lugar de Supabase directamente
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al subir la imagen')
      }
      
      // Actualizar el formulario con la URL de la imagen
      const publicUrl = result.data.url
      form.setValue('imagen_portada', publicUrl)
      setImagenPreview(publicUrl)
    } catch (error) {
      console.error('Error al subir imagen:', error)
      alert('Error al subir la imagen: ' + (error.message || 'Error desconocido'))
    } finally {
      setEnviando(false)
    }
  }

  // Actualizar el valor del autor cuando cambie nombreUsuario
  useEffect(() => {
    form.setValue('autor', nombreUsuario)
  }, [nombreUsuario, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log('=== INICIO DEL PROCESO DE GUARDADO DE NOTICIA ===')
      setEnviando(true)

      // Validaciones finales antes de enviar
      if (!values.titulo || values.titulo.length < 5) {
        console.warn('Validación fallida: Título demasiado corto')
        alert('El título debe tener al menos 5 caracteres')
        setEnviando(false)
        return
      }

      if (!values.contenido || values.contenido.length < 20) {
        console.warn('Validación fallida: Contenido demasiado corto')
        alert('El contenido debe tener al menos 20 caracteres')
        setEnviando(false)
        return
      }

      if (!values.categoria_ids || values.categoria_ids.length === 0) {
        console.warn('Validación fallida: No se seleccionaron categorías')
        alert('Debes seleccionar al menos una categoría')
        setEnviando(false)
        return
      }

      // Validar URL de imagen si está presente
      if (values.imagen_portada) {
        console.log('Validando URL de imagen de portada:', values.imagen_portada)
        try {
          new URL(values.imagen_portada)
          console.log('URL de imagen válida')
        } catch (error) {
          console.error('URL de imagen inválida:', values.imagen_portada, error)
          alert('La URL de la imagen no es válida')
          setEnviando(false)
          return
        }
      } else {
        console.log('No se proporcionó imagen de portada')
      }

      // Analizar el contenido para buscar imágenes
      if (values.contenido) {
        console.log('Analizando contenido para detectar imágenes...')
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = values.contenido
        const images = tempDiv.querySelectorAll('img')
        console.log(`Se encontraron ${images.length} imágenes en el contenido`)
        
        // Mostrar las URLs de las imágenes encontradas
        images.forEach((img, index) => {
          const src = img.getAttribute('src')
          console.log(`Imagen ${index + 1}: ${src?.substring(0, 100)}${src && src.length > 100 ? '...' : ''}`)
          
          // Verificar si la imagen es una URL de Supabase
          if (src && src.includes('supabase')) {
            console.log(`Imagen ${index + 1} parece ser una URL de Supabase`)
          } else if (src && src.startsWith('blob:')) {
            console.warn(`Imagen ${index + 1} es una URL de blob temporal que necesita ser procesada`)
          } else if (src && src.startsWith('data:')) {
            console.warn(`Imagen ${index + 1} es una URL de datos que necesita ser procesada`)
          }
        })
        
        // Procesar las imágenes temporales (blob URLs y data URLs) antes de guardar
        console.log('Procesando imágenes temporales antes de guardar...')
        try {
          const contentWithProcessedImages = await processEditorContent(values.contenido)
          console.log('Imágenes procesadas correctamente')
          values.contenido = contentWithProcessedImages
          
          // Verificar que las imágenes se hayan procesado correctamente
          const tempDivAfter = document.createElement('div')
          tempDivAfter.innerHTML = values.contenido
          const imagesAfter = tempDivAfter.querySelectorAll('img')
          let allProcessed = true
          
          imagesAfter.forEach((img, index) => {
            const src = img.getAttribute('src')
            if (src && (src.startsWith('blob:') || src.startsWith('data:'))) {
              console.error(`Imagen ${index + 1} sigue siendo temporal después del procesamiento: ${src}`)
              allProcessed = false
            }
          })
          
          if (!allProcessed) {
            console.warn('Algunas imágenes no se procesaron correctamente. Intentando continuar de todos modos.')
          } else {
            console.log('Todas las imágenes se procesaron correctamente a URLs permanentes')
          }
        } catch (error) {
          console.error('Error al procesar imágenes:', error)
          alert('Hubo un error al procesar las imágenes. Algunas imágenes podrían no mostrarse correctamente.')
          // Continuamos a pesar del error para no perder el contenido
        }
      }

      // Preparar datos para enviar a la API
      const datosNoticia = {
        titulo: values.titulo,
        contenido: values.contenido,
        imagen_portada: values.imagen_portada || null,
        autor: values.autor || nombreUsuario,
        autor_id: usuarioId, // Añadir el ID del usuario
        autor_nombre: nombreUsuario, // Añadir el nombre de usuario
        destacada: values.destacada,
        categoria_ids: values.categoria_ids
      }

      console.log('Enviando datos de noticia:', {
        titulo: datosNoticia.titulo,
        contenido: datosNoticia.contenido?.substring(0, 100) + '...',
        imagen_portada: datosNoticia.imagen_portada,
        autor: datosNoticia.autor,
        categoria_ids: datosNoticia.categoria_ids,
        tamaño_contenido: datosNoticia.contenido?.length || 0
      })

      console.log('Llamando a API Route para guardar noticia...')
      // Llamar a nuestra API Route
      const response = await fetch('/api/admin/noticias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: values.titulo,
          contenido: values.contenido,
          autor: usuarioId,
          imagen_portada: values.imagen_portada || null,
          categoria_ids: values.categoria_ids || [],
          destacada: values.destacada || false,
        }),
      })
      
      console.log('Respuesta recibida de la API:', response.status, response.statusText)
      const resultado = await response.json()
      console.log('Datos de respuesta:', resultado)
      
      if (!response.ok) {
        console.error('Error al crear noticia:', resultado.error)
        alert(resultado.error || 'Error al crear la noticia')
        setEnviando(false)
        return
      }
      
      console.log('Noticia creada exitosamente con ID:', resultado.id)
      console.log('=== FIN DEL PROCESO DE GUARDADO DE NOTICIA ===')
      
      // Si todo salió bien, redirigir a la lista de noticias
      router.push('/admin/noticias')
    } catch (error) {
      console.error('Error al crear noticia:', error)
      alert('Ocurrió un error al crear la noticia')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/noticias" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Crear Nueva Noticia</h1>
        <p className="text-muted-foreground">
          Añade una nueva noticia al sitio web
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Crear Nueva Noticia</CardTitle>
            <CardDescription>
              Completa el formulario para crear una nueva noticia
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Destacada</span>
            <label
              htmlFor="toggleDestacadaHeader"
              className={`relative block h-7 w-12 rounded-full transition-colors [-webkit-tap-highlight-color:_transparent] ${form.watch('destacada') ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <input 
                type="checkbox" 
                id="toggleDestacadaHeader" 
                className="peer sr-only" 
                checked={form.watch('destacada')}
                onChange={(e) => form.setValue('destacada', e.target.checked)}
              />

              <span
                className={`absolute inset-y-0 start-0 m-1 size-5 rounded-full bg-gray-300 ring-[5px] ring-white transition-all ring-inset dark:bg-gray-600 dark:ring-gray-900 ${form.watch('destacada') ? 'start-6 w-2 bg-white ring-transparent dark:bg-gray-900' : ''}`}
              >
              </span>
            </label>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título de la noticia" {...field} />
                    </FormControl>
                    <FormDescription>
                      Este será el título principal de la noticia
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contenido"
                render={({ field }) => (
                  <div className="mb-4">
                    <FormLabel>Contenido</FormLabel>
                    <TiptapEditor 
                      value={field.value} 
                      onChange={(value) => {
                        field.onChange(value)
                      }}
                    />
                    <FormMessage />
                  </div>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="categoria_ids"
                  render={({ field }) => (
                    <FormItem className="w-full md:col-span-2">
                      <FormLabel>Categorías</FormLabel>
                      <FormControl>
                        <div className="space-y-2 w-full">
                          {cargandoCategorias ? (
                            <div className="text-sm text-muted-foreground">Cargando categorías...</div>
                          ) : categorias.length > 0 ? (
                            <>
                              <div className="md:hidden flex flex-col gap-2 w-full max-h-[200px] overflow-y-auto pb-2">
                                {renderCategoriasJerarquicas(categorias, field, true)}
                              </div>
                              <div className="hidden md:flex flex-col gap-2 w-full justify-start">
                                {renderCategoriasJerarquicas(categorias, field, false)}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">No hay categorías disponibles</div>
                          )}
                          {field.value.length >= 4 && (
                            <p className="text-xs text-amber-500 mt-2">Has alcanzado el límite de 4 categorías</p>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>Selecciona hasta 4 categorías para esta noticia</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imagen_portada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagen destacada</FormLabel>
                    <FormControl>
                      <div>
                        <Dropzone
                          previewUrl={imagenPreview}
                          onFileSelect={handleFileUpload}
                          label="Arrastra y suelta o haz clic para subir una imagen"
                          id="imagen-noticia"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Sube una imagen arrastrándola, haciendo clic o pegándola desde el portapapeles (Ctrl+V)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />



              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => router.push('/admin/noticias')}
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
                      <span>Guardar Noticia</span>
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

export default function CrearNoticia() {
  return (
    <AdminProtection>
      <CrearNoticiaContent />
    </AdminProtection>
  )
}
