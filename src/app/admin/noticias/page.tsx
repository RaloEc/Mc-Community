'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Noticia } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical, 
  ArrowUpDown, 
  Calendar, 
  User, 
  Tag 
} from 'lucide-react'
import AdminProtection from '@/components/AdminProtection'

// Noticias de ejemplo para mostrar mientras se cargan los datos reales
const noticiasEjemplo: Noticia[] = [
  {
    id: '1',
    titulo: 'Actualización 1.20 de Minecraft',
    contenido: 'Descubre todas las novedades de la actualización 1.20 de Minecraft...',
    fecha_publicacion: '2023-06-07',
    autor: 'Admin',
    categoria: 'Actualizaciones',
    imagen_portada: '/images/news/update-120.jpg'
  },
  {
    id: '2',
    titulo: 'Nuevo servidor de Survival',
    contenido: 'Hemos lanzado un nuevo servidor de supervivencia con características únicas...',
    fecha_publicacion: '2023-07-15',
    autor: 'Moderador',
    categoria: 'Servidores',
    imagen_portada: '/images/news/survival-server.jpg'
  },
  {
    id: '3',
    titulo: 'Evento de Halloween',
    contenido: 'Prepárate para el evento especial de Halloween con recompensas exclusivas...',
    fecha_publicacion: '2023-10-20',
    autor: 'Admin',
    categoria: 'Eventos',
    imagen_portada: '/images/news/halloween-event.jpg'
  }
]

function AdminNoticiasContent() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [ordenFecha, setOrdenFecha] = useState<'asc' | 'desc'>('desc')
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState<Noticia | null>(null)
  const router = useRouter()

  useEffect(() => {
    cargarNoticias()
  }, [ordenFecha, busqueda])

  async function cargarNoticias() {
    try {
      setCargando(true)
      
      // Construir la URL con los parámetros de búsqueda
      let url = '/api/noticias?admin=true';
      
      // Añadir parámetros de búsqueda si existen
      if (busqueda) {
        url += `&busqueda=${encodeURIComponent(busqueda)}`;
      }
      
      // Añadir parámetro de orden
      url += `&ordenFecha=${ordenFecha}`;
      
      // Usar la API para obtener las noticias
      const response = await fetch(url)
      const resultado = await response.json()
      
      if (!response.ok || !resultado.success) {
        console.error('Error al cargar noticias:', resultado.error)
        // Si hay error, usar datos de ejemplo
        setNoticias(noticiasEjemplo)
        return
      }
      
      if (resultado.data && resultado.data.length > 0) {
        // Transformar los datos para incluir el nombre de la categoría
        const noticiasConCategoria = resultado.data.map(noticia => ({
          ...noticia,
          // Si tiene categorías, usar la primera como principal para mostrar
          categoria: noticia.categorias && noticia.categorias.length > 0 
            ? noticia.categorias[0].nombre 
            : 'General'
        }))
        
        // Ordenar por fecha si es necesario
        if (ordenFecha === 'asc') {
          noticiasConCategoria.sort((a, b) => 
            new Date(a.fecha_publicacion).getTime() - new Date(b.fecha_publicacion).getTime()
          )
        } else {
          noticiasConCategoria.sort((a, b) => 
            new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime()
          )
        }
        
        setNoticias(noticiasConCategoria)
      } else {
        // Si no hay datos, mostrar mensaje vacío
        setNoticias([])
      }
    } catch (error) {
      console.error('Error al cargar noticias:', error)
      setNoticias(noticiasEjemplo)
    } finally {
      setCargando(false)
    }
  }

  async function eliminarNoticia(id: string) {
    console.log('Iniciando eliminación de noticia con ID:', id)
    try {
      // Usar la API para eliminar la noticia (utiliza el cliente de servicio)
      const response = await fetch(`/api/admin/noticias?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const resultado = await response.json()
      console.log('Respuesta de la API:', resultado)
      
      if (!response.ok) {
        console.error('Error al eliminar noticia:', resultado.error)
        alert('Error al eliminar la noticia. Consulta la consola para más detalles.')
        return
      }
      
      console.log('Noticia eliminada correctamente')
      
      // Actualizar la lista de noticias
      setNoticias(noticias.filter(noticia => noticia.id !== id))
      
      // Recargar la lista de noticias para asegurarnos de que está actualizada
      setTimeout(() => {
        cargarNoticias()
      }, 500)
    } catch (error) {
      console.error('Error al eliminar noticia:', error)
      alert('Error al eliminar la noticia. Consulta la consola para más detalles.')
    }
  }

  // Ya no necesitamos filtrar aquí, ya que la API se encarga de eso
  const noticiasFiltradas = noticias

  // Función para formatear fecha
  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return 'Sin fecha';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(fecha).toLocaleDateString('es-ES', options)
  }

  // Función para truncar texto
  const truncarTexto = (texto: string, longitud: number) => {
    return texto.length > longitud ? texto.substring(0, longitud) + '...' : texto
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administración de Noticias</h1>
          <p className="text-muted-foreground">
            Gestiona las noticias del sitio web
          </p>
        </div>
        <Button onClick={() => router.push('/admin/noticias/crear')}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Noticia
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Noticias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título o autor..."
                className="pl-8"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setOrdenFecha(ordenFecha === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Fecha {ordenFecha === 'asc' ? '↑' : '↓'}
            </Button>
          </div>

          {cargando ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : noticiasFiltradas.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        Fecha
                        <ArrowUpDown 
                          className="ml-2 h-4 w-4 cursor-pointer" 
                          onClick={() => setOrdenFecha(ordenFecha === 'asc' ? 'desc' : 'asc')}
                        />
                      </div>
                    </TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {noticiasFiltradas.map((noticia) => (
                    <TableRow key={noticia.id}>
                      <TableCell className="font-medium">{truncarTexto(noticia.titulo, 40)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{noticia.categoria}</Badge>
                      </TableCell>
                      <TableCell>{formatearFecha(noticia.fecha_publicacion)}</TableCell>
                      <TableCell>
                        <span 
                          style={{ color: noticia.autor_color || '#3b82f6' }}
                          className="font-medium"
                        >
                          {noticia.autor_nombre || noticia.autor}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/admin/noticias/editar/${noticia.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setNoticiaSeleccionada(noticia)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No se encontraron noticias</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setBusqueda('')
                  setOrdenFecha('desc')
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Total: {noticiasFiltradas.length} noticias
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => cargarNoticias()}
            >
              Actualizar
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={!!noticiaSeleccionada} onOpenChange={(open) => !open && setNoticiaSeleccionada(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la noticia 
              <span className="font-semibold"> {noticiaSeleccionada?.titulo}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (noticiaSeleccionada) {
                  eliminarNoticia(noticiaSeleccionada.id)
                  setNoticiaSeleccionada(null)
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function AdminNoticias() {
  return (
    <AdminProtection>
      <AdminNoticiasContent />
    </AdminProtection>
  )
}
