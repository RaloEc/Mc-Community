"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Eye, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash2, 
  Filter, 
  ArrowUpDown,
  Calendar
} from 'lucide-react'
import AdminProtection from '@/components/AdminProtection'
import Link from 'next/link'

// Tipo para las noticias
type Noticia = {
  id: string
  titulo: string
  resumen: string
  contenido: string
  imagen_url: string
  fecha_publicacion: string
  autor: string
  autor_id: string
  autor_nombre?: string
  autor_color?: string
  categoria_id?: string
  categoria_nombre?: string
  slug: string
  vistas: number
  destacada: boolean
  es_activa: boolean
  categorias?: {
    categoria_id: string
    categoria: {
      nombre: string
      slug: string
      color: string
    }
  }[]
}

// Tipo para las categorías
type Categoria = {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  color: string
  es_activa: boolean
}

export default function ListadoNoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [noticiaParaEliminar, setNoticiaParaEliminar] = useState<string | null>(null)
  const [ordenarPor, setOrdenarPor] = useState<string>('fecha_desc')
  const elementosPorPagina = 10
  
  const router = useRouter()
  const { toast } = useToast()

  // Cargar noticias
  useEffect(() => {
    const cargarNoticias = async () => {
      try {
        setCargando(true)
        setError(null)
        
        // Construir URL con parámetros
        const params = new URLSearchParams()
        params.append('pagina', paginaActual.toString())
        params.append('limite', elementosPorPagina.toString())
        
        if (busqueda) {
          params.append('busqueda', busqueda)
        }
        
        if (categoriaFiltro) {
          params.append('categoria', categoriaFiltro)
        }
        
        if (ordenarPor) {
          params.append('ordenar', ordenarPor)
        }
        
        const respuesta = await fetch(`/api/admin/noticias?${params.toString()}&admin=true`)
        
        if (!respuesta.ok) {
          throw new Error(`Error al cargar noticias: ${respuesta.status}`)
        }
        
        const data = await respuesta.json()
        setNoticias(data.noticias || [])
        setTotalPaginas(data.total_paginas || 1)
      } catch (err: any) {
        setError(err.message || 'Error al cargar noticias')
        toast({
          title: 'Error',
          description: err.message || 'Error al cargar noticias',
          variant: 'destructive'
        })
      } finally {
        setCargando(false)
      }
    }
    
    cargarNoticias()
  }, [paginaActual, busqueda, categoriaFiltro, ordenarPor, toast])

  // Cargar categorías para filtros
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const respuesta = await fetch('/api/admin/noticias/categorias?admin=true')
        
        if (!respuesta.ok) {
          throw new Error(`Error al cargar categorías: ${respuesta.status}`)
        }
        
        const data = await respuesta.json()
        setCategorias(data || [])
      } catch (err: any) {
        console.error('Error al cargar categorías:', err)
      }
    }
    
    cargarCategorias()
  }, [])

  // Función para eliminar noticia
  const eliminarNoticia = async (id: string) => {
    try {
      const respuesta = await fetch(`/api/admin/noticias?id=${id}&admin=true`, {
        method: 'DELETE'
      })
      
      if (!respuesta.ok) {
        throw new Error(`Error al eliminar noticia: ${respuesta.status}`)
      }
      
      // Actualizar lista de noticias
      setNoticias(noticias.filter(noticia => noticia.id !== id))
      
      toast({
        title: 'Noticia eliminada',
        description: 'La noticia ha sido eliminada correctamente',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al eliminar la noticia',
        variant: 'destructive'
      })
    } finally {
      setNoticiaParaEliminar(null)
    }
  }

  // Función para cambiar ordenamiento
  const cambiarOrden = (campo: string) => {
    if (ordenarPor === `${campo}_asc`) {
      setOrdenarPor(`${campo}_desc`)
    } else {
      setOrdenarPor(`${campo}_asc`)
    }
  }

  // Función para formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Renderizar esqueletos de carga
  const renderizarEsqueletos = () => {
    return Array(elementosPorPagina).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
        <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
      </TableRow>
    ))
  }

  return (
    <AdminProtection>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Listado de Noticias</h2>
          <Button asChild>
            <Link href="/admin/noticias/crear">
              <Plus className="mr-2 h-4 w-4" /> Crear Noticia
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Noticias</CardTitle>
            <CardDescription>
              Administra todas las noticias del sitio. Puedes filtrar, ordenar y buscar noticias específicas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título o contenido..."
                  className="pl-8"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    Categoría
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por categoría</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCategoriaFiltro('')}>
                    Todas las categorías
                  </DropdownMenuItem>
                  {categorias.map((categoria) => (
                    <DropdownMenuItem 
                      key={categoria.id}
                      onClick={() => setCategoriaFiltro(categoria.id)}
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: categoria.color || '#3b82f6' }}
                        />
                        {categoria.nombre}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      <Button variant="ghost" onClick={() => cambiarOrden('titulo')}>
                        Título <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => cambiarOrden('categoria')}>
                        Categoría <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => cambiarOrden('fecha')}>
                        Fecha <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => cambiarOrden('vistas')}>
                        Vistas <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargando ? (
                    renderizarEsqueletos()
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        Error al cargar noticias: {error}
                      </TableCell>
                    </TableRow>
                  ) : noticias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        No se encontraron noticias
                      </TableCell>
                    </TableRow>
                  ) : (
                    noticias.map((noticia) => (
                      <TableRow key={noticia.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="truncate max-w-[300px]">{noticia.titulo}</span>
                            {noticia.destacada && (
                              <Badge variant="secondary" className="w-fit mt-1">Destacada</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {noticia.categorias && noticia.categorias.length > 0 ? (
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: noticia.categorias[0].categoria?.color || '#3b82f6' }}
                              />
                              <span>{noticia.categorias[0].categoria?.nombre || 'Sin nombre'}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin categoría</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {formatearFecha(noticia.fecha_publicacion)}
                          </div>
                        </TableCell>
                        <TableCell>{noticia.vistas || 0}</TableCell>
                        <TableCell>
                          <Badge variant={noticia.es_activa !== false ? "default" : "outline"}>
                            {noticia.es_activa !== false ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/noticias/editar/${noticia.id}`}>
                                  <Edit className="mr-2 h-4 w-4" /> Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/noticias/${noticia.slug}`} target="_blank">
                                  <Eye className="mr-2 h-4 w-4" /> Ver
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Se eliminará permanentemente la noticia 
                                      &quot;{noticia.titulo}&quot; del sistema.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => eliminarNoticia(noticia.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando página {paginaActual} de {totalPaginas}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual >= totalPaginas}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AdminProtection>
  )
}
