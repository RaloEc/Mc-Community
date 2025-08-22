'use client'

import React, { useState, useEffect, useCallback } from 'react'
import AdminProtection from '@/components/AdminProtection';
import { PlusCircle, Edit, Trash2, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import "@/components/admin/categoria-animation.css"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Tipos
interface CategoriaNoticia {
  id: number | string;
  nombre: string;
  slug: string;
  descripcion?: string;
  orden?: number;
  color?: string;
  es_activa?: boolean;
  noticias_count?: number;
  categoria_padre_id?: string | null;
  categoria_padre?: {
    id: string;
    nombre: string;
  } | null;
}

interface CategoriaFormProps {
  categoria?: CategoriaNoticia | null;
  onSave: () => void;
  onCancel: () => void;
}

// --- Componente: Formulario de Categoría --- //
function CategoriaForm({ categoria, onSave, onCancel }: CategoriaFormProps) {
  const [nombre, setNombre] = useState(categoria?.nombre || '')
  const [slug, setSlug] = useState(categoria?.slug || '')
  const [descripcion, setDescripcion] = useState(categoria?.descripcion || '')
  const [orden, setOrden] = useState(categoria?.orden || 0)
  const [color, setColor] = useState(categoria?.color || '#3b82f6')
  const [esActiva, setEsActiva] = useState(categoria?.es_activa !== false)
  const [categoriaPadreId, setCategoriaPadreId] = useState<string | null>(categoria?.categoria_padre_id || null)
  const [categoriasPadre, setCategoriasPadre] = useState<CategoriaNoticia[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingCategorias, setLoadingCategorias] = useState(false)

  // Cargar las categorías disponibles para ser padre
  useEffect(() => {
    const fetchCategoriasPadre = async () => {
      setLoadingCategorias(true)
      try {
        const response = await fetch('/api/admin/noticias/categorias?admin=true')
        if (!response.ok) throw new Error('Error al cargar las categorías')
        const data = await response.json()
        
        // Si estamos editando, filtramos la categoría actual para evitar ciclos
        const categoriasFiltradas = categoria?.id 
          ? data.filter((cat: CategoriaNoticia) => cat.id !== categoria.id)
          : data
          
        setCategoriasPadre(categoriasFiltradas)
      } catch (error) {
        console.error('Error al cargar categorías padre:', error)
        toast.error('Error al cargar las categorías disponibles')
      } finally {
        setLoadingCategorias(false)
      }
    }
    
    fetchCategoriasPadre()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const categoriaData = { 
      nombre, 
      slug,
      descripcion, 
      orden: Number(orden), 
      color,
      es_activa: esActiva,
      categoria_padre_id: categoriaPadreId
    }

    try {
      let response
      if (categoria && categoria.id) {
        response = await fetch(`/api/admin/noticias/categorias?id=${categoria.id}&admin=true`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoriaData),
        })
      } else {
        response = await fetch('/api/admin/noticias/categorias?admin=true', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoriaData),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar la categoría')
      }

      toast.success(`Categoría ${categoria ? 'actualizada' : 'creada'} con éxito.`)
      onSave()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="nombre" className="text-sm font-medium">Nombre</label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => {
            const newName = e.target.value;
            setNombre(newName);
            const slugify = (str: string) => str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
            setSlug(slugify(newName));
          }}
          placeholder="Nombre de la categoría"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="block text-sm font-medium text-gray-300">Slug</label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="URL amigable (ej: mi-categoria)"
          required
        />
        <p className="text-xs text-muted-foreground">Se genera automáticamente, pero puedes editarlo.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="descripcion" className="text-sm font-medium">Descripción</label>
        <Textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción breve de la categoría"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="color" className="text-sm font-medium">Color</label>
        <div className="flex gap-2 items-center">
          <Input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-10 p-1"
          />
          <Input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#3b82f6"
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="orden" className="text-sm font-medium">Orden</label>
        <Input
          id="orden"
          type="number"
          value={orden}
          onChange={(e) => setOrden(Number(e.target.value))}
          placeholder="Orden de aparición"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="categoriaPadre" className="text-sm font-medium">Categoría Padre</label>
        <select
          id="categoriaPadre"
          value={categoriaPadreId || ''}
          onChange={(e) => setCategoriaPadreId(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          disabled={loadingCategorias}
        >
          <option value="">-- Sin categoría padre --</option>
          {categoriasPadre.map((cat) => (
            <option key={cat.id.toString()} value={cat.id.toString()}>
              {cat.nombre}
            </option>
          ))}
        </select>
        {loadingCategorias && <p className="text-xs text-muted-foreground">Cargando categorías...</p>}
        <p className="text-xs text-muted-foreground">Selecciona una categoría padre para crear una subcategoría</p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="esActiva"
          checked={esActiva}
          onChange={(e) => setEsActiva(e.target.checked)}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="esActiva" className="text-sm font-medium">Categoría activa</label>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// --- Componente: Gestor de Categorías --- //
function CategoriasManager() {
  // Usamos toast de sonner directamente
  // const { toast } = useToast()
  const [categorias, setCategorias] = useState<CategoriaNoticia[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<CategoriaNoticia | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<(number | string)[]>([])

  const fetchCategorias = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/noticias/categorias?admin=true')
      if (!response.ok) throw new Error('Error al cargar las categorías.')
      const data = await response.json()
      setCategorias(data)
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategorias()
  }, [fetchCategorias])

  const handleDelete = async (id: number | string, forzar: boolean = false) => {
    try {
      // Si no estamos forzando la eliminación, primero agregamos el ID a la lista de elementos eliminándose
      // para activar la animación
      if (!forzar) {
        // Agregamos el ID a la lista de elementos en eliminación para activar la animación
        setDeletingIds(prev => [...prev, id]);
        
        // Esperamos un breve momento para que la animación comience antes de hacer la petición
        // Esto evita el parpadeo
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const url = forzar
        ? `/api/admin/noticias/categorias?id=${id}&admin=true&forzar=true`
        : `/api/admin/noticias/categorias?id=${id}&admin=true`;
      
      const response = await fetch(url, { method: 'DELETE' })
      
      if (!response.ok) {
        // Si hay un error, quitamos el ID de la lista de eliminación para detener la animación
        if (!forzar) {
          setDeletingIds(prev => prev.filter(itemId => itemId !== id));
        }

        // Intentar obtener el mensaje de error detallado del servidor
        let errorData;
        try {
          errorData = await response.json();
          console.log('Datos de error recibidos:', errorData); // Para depuración
        } catch (parseError) {
          console.error('Error al parsear la respuesta:', parseError);
          errorData = { error: 'Error al eliminar la categoría' };
        }
        
        if (response.status === 400 && errorData.tieneAsociaciones) {
          // Mostrar un diálogo de confirmación para forzar la eliminación
          if (confirm(`Esta categoría tiene ${errorData.cantidadNoticias} noticias asociadas. ¿Deseas moverlas a la categoría "General" y eliminar esta categoría?`)) {
            console.log('Usuario confirmó reasignar noticias y eliminar categoría');
            return handleDelete(id, true); // Llamar de nuevo con forzar=true
          } else {
            console.log('Usuario canceló la eliminación');
            return; // El usuario canceló la operación
          }
        }
        
        // Extraer solo la primera parte del mensaje de error (antes de "Ejemplos:")
        let mensajeSimplificado = errorData.error;
        if (mensajeSimplificado && mensajeSimplificado.includes('Ejemplos:')) {
          mensajeSimplificado = mensajeSimplificado.split('Ejemplos:')[0].trim();
        }
        
        // Error específico: la categoría tiene noticias asociadas
        toast.error(mensajeSimplificado || 'No se puede eliminar la categoría', {
          description: errorData.error?.includes('Ejemplos:') ? 
            `Ejemplos de noticias asociadas: ${errorData.error.split('Ejemplos:')[1].split('Debes')[0].trim()}` : 
            'Debes eliminar estas asociaciones primero o reasignar las noticias a otra categoría.',
          duration: 8000 // Mostrar por más tiempo para que el usuario pueda leer
        });
        return;
      }
      
      // Si la eliminación fue exitosa, no recargamos las categorías para evitar parpadeos
      if (!forzar) {
        // Mostramos el mensaje de éxito inmediatamente
        toast.success('Categoría eliminada con éxito.');
        
        // Esperamos a que termine la animación y luego eliminamos la categoría del estado local
        setTimeout(() => {
          // Eliminamos la categoría del estado local en lugar de recargar todas
          setCategorias(prev => prev.filter(cat => cat.id !== id));
          // Limpiamos el ID de la lista de eliminación
          setDeletingIds(prev => prev.filter(itemId => itemId !== id));
        }, 400); // Ajustamos el tiempo para que coincida con la duración de la transición CSS
      } else {
        toast.success('Categoría eliminada con éxito.');
        // Para el caso de forzar, sí necesitamos recargar para obtener la categoría General
        fetchCategorias();
      }
    } catch (err: any) {
      // Si hay un error, quitamos el ID de la lista de eliminación
      setDeletingIds(prev => prev.filter(itemId => itemId !== id));
      console.error('Error en handleDelete:', err);
      toast.error('Error al eliminar la categoría', {
        description: err.message
      });
    }
  }

  const handleSave = () => {
    setIsFormOpen(false)
    setEditingCategoria(null)
    fetchCategorias()
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingCategoria(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestión de Categorías</CardTitle>
            <CardDescription>Crea, edita y elimina las categorías de noticias.</CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingCategoria(null); setIsFormOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategoria?.id 
                    ? 'Editar Categoría' 
                    : 'Nueva Categoría'}
                </DialogTitle>
              </DialogHeader>
              {isFormOpen && (
                <CategoriaForm 
                  categoria={editingCategoria} 
                  onSave={handleSave} 
                  onCancel={handleCancel} 
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría Padre</TableHead>
              <TableHead>Noticias</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Primero ordenamos por orden y luego agrupamos por jerarquía */}
            {(() => {
              // Primero ordenamos todas las categorías por su campo orden
              const ordenadas = [...categorias].sort((a, b) => (a.orden || 0) - (b.orden || 0));
              
              // Separamos categorías principales (sin padre) y subcategorías
              const principales = ordenadas.filter(cat => !cat.categoria_padre_id);
              const subcategorias = ordenadas.filter(cat => cat.categoria_padre_id);
              
              // Función para renderizar una categoría
              const renderCategoria = (cat: CategoriaNoticia, esSubcategoria = false) => (
                <TableRow 
                  key={cat.id}
                  className={`categoria-item ${deletingIds.includes(cat.id) ? 'deleting' : ''}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {esSubcategoria && <div className="w-4 h-4 flex items-center justify-center">└</div>}
                      {cat.color && (
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                      <span>{cat.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell>{cat.descripcion}</TableCell>
                  <TableCell>
                    {cat.categoria_padre ? (
                      <Badge variant="outline" className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        {cat.categoria_padre.nombre}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">Categoría principal</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="secondary"
                            className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900"
                          >
                            {typeof cat.noticias_count === 'number' ? cat.noticias_count : 0}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            {typeof cat.noticias_count === 'number' ? cat.noticias_count : 0} noticias en esta categoría
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0" 
                          disabled={deletingIds.includes(cat.id)}>
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingCategoria(cat); setIsFormOpen(true); }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la categoría.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(cat.id)}>Continuar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
              
              // Resultado final: primero las categorías principales, luego sus subcategorías
              const resultado = [];
              
              // Para cada categoría principal
              for (const principal of principales) {
                // Añadir la categoría principal
                resultado.push(renderCategoria(principal));
                
                // Añadir sus subcategorías
                const hijos = subcategorias.filter(sub => sub.categoria_padre_id === principal.id);
                for (const hijo of hijos) {
                  resultado.push(renderCategoria(hijo, true));
                }
              }
              
              // Añadir subcategorías huérfanas (si las hay)
              const huerfanas = subcategorias.filter(sub => 
                !principales.some(p => p.id === sub.categoria_padre_id)
              );
              
              for (const huerfana of huerfanas) {
                resultado.push(renderCategoria(huerfana));
              }
              
              return resultado;
            })()}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function CategoriasNoticiasPage() {
  return (
    <AdminProtection>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Categorías de Noticias</h1>
            <p className="text-muted-foreground">
              Gestiona las categorías para organizar las noticias del sitio
            </p>
          </div>
        </div>
        <CategoriasManager />
      </div>
    </AdminProtection>
  )
}

export default CategoriasNoticiasPage;
