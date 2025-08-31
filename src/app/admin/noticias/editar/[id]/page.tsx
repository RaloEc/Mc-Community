'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getServiceClient } from '@/lib/supabase'
import type { Noticia } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import TiptapEditor, { processEditorContent } from '@/components/TiptapEditor' // Importamos processEditorContent
import { ChevronDown, ChevronRight, X } from 'lucide-react'
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
  }),
  contenido: z.string().min(20, {
    message: 'El contenido debe tener al menos 20 caracteres',
  }),
  categoria_ids: z.array(z.string()).min(1, {
    message: 'Selecciona al menos una categoría',
  }),
  imagen_portada: z.string().optional(),

  destacada: z.boolean().default(false),
})

function EditarNoticiaContent({ params }: { params: { id: string } }) {
  const [noticia, setNoticia] = useState<Noticia | null>(null)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargandoCategorias, setCargandoCategorias] = useState(true)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [nombreUsuario, setNombreUsuario] = useState<string>('Admin')
  const router = useRouter()
  const { id } = params

  // Configurar el formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      contenido: '',
      categoria_ids: [],
      imagen_portada: '',
      destacada: false,
    },
  })

  // Estado para controlar qué categorías están expandidas
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Función para alternar la expansión de una categoría
  const toggleCategory = (categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter(id => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  // Función para renderizar categorías jerárquicas
  const renderCategoriasJerarquicas = (categorias: Categoria[], field: any, isMobile: boolean, nivel: number = 0) => {
    return (
      <div className={`${nivel > 0 ? 'ml-4 border-l-2 pl-2 border-gray-200 dark:border-gray-700' : ''}`}>
        {categorias.map((categoria) => {
          const isSelected = field.value?.includes(categoria.id);
          const tieneHijos = categoria.hijos && categoria.hijos.length > 0;
          const isExpanded = expandedCategories.includes(categoria.id);
          
          return (
            <div key={categoria.id} className="mb-1">
              <div className="flex items-center gap-1">
                {tieneHijos && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-0 h-6 w-6"
                    onClick={() => toggleCategory(categoria.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
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
              
              {tieneHijos && isExpanded && (
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

  // Obtener información del usuario actual
  useEffect(() => {
    async function obtenerUsuario() {
      try {
        console.log('Obteniendo información del usuario actual...')
        
        // Primero verificamos si hay una sesión activa
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error al obtener sesión:', sessionError)
          return
        }
        
        if (!sessionData.session) {
          console.warn('No hay sesión activa')
          return
        }
        
        // Si hay sesión, entonces obtenemos el usuario
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Error al obtener usuario autenticado:', userError)
          return
        }
        
        if (!user) {
          console.warn('No hay usuario autenticado')
          return
        }
        
        console.log('Usuario autenticado:', user.id, user.email)
        // Guardar el ID del usuario
        setUsuarioId(user.id)
        
        // Usar la nueva API route para obtener el perfil del usuario
        console.log('Consultando API para obtener perfil del usuario:', user.id)
        const response = await fetch(`/api/admin/perfil?userId=${user.id}`)
        
        if (!response.ok) {
          console.error('Error al obtener perfil del usuario:', response.statusText)
          // Si hay error al obtener el perfil, usar el email como respaldo
          setNombreUsuario(user.email || 'Admin')
          return
        }
        
        const resultado = await response.json()
        
        if (!resultado.success || !resultado.data) {
          console.error('Error en la respuesta de la API de perfil:', resultado.error)
          setNombreUsuario(user.email || 'Admin')
          return
        }
        
        const perfil = resultado.data
        console.log('Perfil de usuario obtenido:', perfil)
        
        if (perfil && perfil.username) {
          // Usar el nombre de usuario si está disponible
          console.log('Usando nombre de usuario del perfil:', perfil.username)
          setNombreUsuario(perfil.username)
        } else if (perfil && perfil.nombre_completo) {
          // Si no hay username pero hay nombre completo, usarlo
          console.log('Usando nombre completo del perfil:', perfil.nombre_completo)
          setNombreUsuario(perfil.nombre_completo)
        } else if (perfil && perfil.email) {
          // Si hay email en el perfil, usarlo
          console.log('Usando email del perfil:', perfil.email)
          setNombreUsuario(perfil.email)
        } else {
          // Si no hay perfil o username, usar el email o un valor predeterminado
          console.log('No se encontró nombre en el perfil, usando email:', user.email)
          setNombreUsuario(user.email || 'Admin')
        }
      } catch (error) {
        console.error('Error general al obtener usuario:', error)
        // En caso de error, establecer un valor predeterminado
        setNombreUsuario('Admin')
      }
    }
    
    obtenerUsuario()
  }, [])

  useEffect(() => {
    async function cargarNoticia() {
      try {
        setCargando(true)
        
        // Obtener la noticia de la API
        const response = await fetch(`/api/noticias/${id}`)
        const resultado = await response.json()
        
        if (!response.ok || !resultado.success) {
          console.error('Error al cargar noticia:', resultado.error)
          router.push('/admin/noticias')
          return
        }
        
        const data = resultado.data
        
        if (!data) {
          console.error('Noticia no encontrada')
          router.push('/admin/noticias')
          return
        }
        
        // Guardar la noticia en el estado
        setNoticia(data)
        
        // Obtener los IDs de las categorías
        const categoriasSeleccionadas = data.categorias ? data.categorias.map(cat => cat.id) : []
        
        // Establecer los valores del formulario
        form.reset({
          titulo: data.titulo,
          contenido: data.contenido,
          categoria_ids: categoriasSeleccionadas,
          imagen_portada: data.imagen_portada || '',
          destacada: data.destacada || false,
        })
        
        // Establecer la vista previa de la imagen si existe
        if (data.imagen_portada) {
          setImagenPreview(data.imagen_portada)
        }
      } catch (error) {
        console.error('Error al cargar noticia:', error)
        router.push('/admin/noticias')
      } finally {
        setCargando(false)
      }
    }
    
    if (id) {
      cargarNoticia()
    }
  }, [id, router, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log('=== INICIO DEL PROCESO DE ACTUALIZACIÓN DE NOTICIA ===');
      setEnviando(true)
      
      // Analizar el contenido para buscar imágenes
      if (values.contenido) {
        console.log('Analizando contenido para detectar imágenes...');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = values.contenido;
        const images = tempDiv.querySelectorAll('img');
        console.log(`Se encontraron ${images.length} imágenes en el contenido`);
        
        // Mostrar las URLs de las imágenes encontradas
        images.forEach((img, index) => {
          const src = img.getAttribute('src');
          console.log(`Imagen ${index + 1}: ${src?.substring(0, 100)}${src && src.length > 100 ? '...' : ''}`);
          
          // Verificar si la imagen es una URL de Supabase
          if (src && src.includes('supabase')) {
            console.log(`Imagen ${index + 1} parece ser una URL de Supabase`);
          } else if (src && src.startsWith('blob:')) {
            console.warn(`Imagen ${index + 1} es una URL de blob temporal que necesita ser procesada`);
          } else if (src && src.startsWith('data:')) {
            console.warn(`Imagen ${index + 1} es una URL de datos que necesita ser procesada`);
          }
        });
        
        // Procesar las imágenes temporales (blob URLs y data URLs) antes de guardar
        console.log('Procesando imágenes temporales antes de guardar...');
        try {
          const contentWithProcessedImages = await processEditorContent(values.contenido);
          console.log('Imágenes procesadas correctamente');
          values.contenido = contentWithProcessedImages;
          
          // Verificar que las imágenes se hayan procesado correctamente
          const tempDivAfter = document.createElement('div');
          tempDivAfter.innerHTML = values.contenido;
          const imagesAfter = tempDivAfter.querySelectorAll('img');
          let allProcessed = true;
          
          imagesAfter.forEach((img, index) => {
            const src = img.getAttribute('src');
            if (src && (src.startsWith('blob:') || src.startsWith('data:'))) {
              console.error(`Imagen ${index + 1} sigue siendo temporal después del procesamiento: ${src}`);
              allProcessed = false;
            }
          });
          
          if (!allProcessed) {
            console.warn('Algunas imágenes no se procesaron correctamente. Intentando continuar de todos modos.');
          } else {
            console.log('Todas las imágenes se procesaron correctamente a URLs permanentes');
          }
        } catch (error) {
          console.error('Error al procesar imágenes:', error);
          alert('Hubo un error al procesar las imágenes. Algunas imágenes podrían no mostrarse correctamente.');
          // Continuamos a pesar del error para no perder el contenido
        }
      }
      
      // Preparar datos para enviar a la API
      const datosActualizados = {
        id: id,
        titulo: values.titulo,
        contenido: values.contenido,
        imagen_portada: values.imagen_portada || null,
        autor: noticia?.autor || 'Admin',
        autor_id: usuarioId, // Añadir el ID del usuario
        autor_nombre: nombreUsuario, // Añadir el nombre de usuario
        destacada: values.destacada,
        categoria_ids: values.categoria_ids
      }

      // Usar la API para actualizar la noticia (utiliza el cliente de servicio)
      const response = await fetch('/api/admin/noticias', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosActualizados),
      })
      
      const resultado = await response.json()
      
      if (!response.ok) {
        console.error('Error al actualizar noticia:', resultado.error)
        alert(`Error al actualizar la noticia: ${resultado.error || 'Error desconocido'}`)
        setEnviando(false)
        return
      }
      
      console.log('Noticia actualizada correctamente:', resultado)
      
      // Redirigir a la lista de noticias
      router.push('/admin/noticias')
    } catch (error) {
      console.error('Error al actualizar noticia:', error)
      alert('Error al actualizar la noticia. Por favor, inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

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

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
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
        <h1 className="text-2xl font-bold tracking-tight">Editar Noticia</h1>
        <p className="text-muted-foreground">
          Modifica la información de la noticia
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Información de la Noticia</CardTitle>
            <CardDescription>
              Actualiza los campos que desees modificar
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

              {/* Categorías - Ancho completo */}
              <FormField
                control={form.control}
                name="categoria_ids"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Categorías</FormLabel>
                    <FormControl>
                      <div className="space-y-2 w-full">
                        {cargandoCategorias ? (
                          <div className="text-sm text-muted-foreground">Cargando categorías...</div>
                        ) : categorias.length > 0 ? (
                          <div className="w-full">
                            {/* Instrucciones para el usuario */}
                            <div className="text-xs text-muted-foreground mb-2">
                              <p>Haz clic en las flechas para expandir o colapsar las categorías. Puedes seleccionar hasta 4 categorías.</p>
                            </div>

                            {/* Categorías seleccionadas */}
                            {field.value && field.value.length > 0 && (
                              <div className="mb-3 p-2 border rounded-md bg-muted/30">
                                <p className="text-xs font-medium mb-1">Categorías seleccionadas:</p>
                                <div className="flex flex-wrap gap-1">
                                  {field.value.map((catId: string) => {
                                    // Buscar la categoría por ID (función recursiva)
                                    const findCategoriaById = (cats: Categoria[], id: string): Categoria | undefined => {
                                      for (const cat of cats) {
                                        if (cat.id === id) return cat;
                                        if (cat.hijos && cat.hijos.length > 0) {
                                          const found = findCategoriaById(cat.hijos, id);
                                          if (found) return found;
                                        }
                                      }
                                      return undefined;
                                    };
                                    
                                    const categoria = findCategoriaById(categorias, catId);
                                    
                                    return categoria ? (
                                      <div key={catId} className="flex items-center bg-primary/10 rounded-full px-2 py-1">
                                        {categoria.icono && <span className="mr-1">{categoria.icono}</span>}
                                        <span className="text-xs">{categoria.nombre}</span>
                                        <Button 
                                          type="button" 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-4 w-4 p-0 ml-1"
                                          onClick={() => {
                                            const updatedCategories = field.value.filter((id: string) => id !== catId);
                                            field.onChange(updatedCategories);
                                          }}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Área con borde para la lista de categorías */}
                            <div className="border rounded-md p-3 max-h-[300px] overflow-y-auto">
                              {/* Versión móvil con estructura jerárquica */}
                              <div className="md:hidden flex flex-col gap-2 w-full">
                                {renderCategoriasJerarquicas(categorias, field, true)}
                              </div>
                              
                              {/* Versión escritorio con estructura jerárquica */}
                              <div className="hidden md:flex flex-col gap-2 w-full justify-start">
                                {renderCategoriasJerarquicas(categorias, field, false)}
                              </div>
                            </div>
                            
                            {field.value.length >= 4 && (
                              <p className="text-xs text-amber-500 mt-2">Has alcanzado el límite de 4 categorías</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No hay categorías disponibles</div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Selecciona hasta 4 categorías para esta noticia
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              


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
                          id="imagen-noticia-editar"
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
                      <span>Guardar Cambios</span>
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

export default function EditarNoticia({ params }: { params: { id: string } }) {
  return (
    <AdminProtection>
      <EditarNoticiaContent params={params} />
    </AdminProtection>
  )
}
