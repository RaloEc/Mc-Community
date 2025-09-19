'use client'

import React, { useState, useEffect, useCallback } from 'react'
import AdminProtection from '@/components/AdminProtection';
import { PlusCircle, Edit, Trash2, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ArbolCategorias, CategoriaBase } from '@/components/categorias/ArbolCategorias'
import './animations.css'

// Tipos
interface CategoriaNoticia extends CategoriaBase {
  categoria_padre_id?: string | null; // Campo antiguo, mantener por compatibilidad
  categoria_padre?: {
    id: string;
    nombre: string;
  } | null;
}

interface CategoriaFormProps {
  categoria: CategoriaNoticia | null
  onSave: (categoria: CategoriaNoticia) => void
  onCancel: () => void
  onFormModifiedChange: (isModified: boolean) => void
  isSubmitting: boolean
  setIsSubmitting: (isSubmitting: boolean) => void
}

// --- Componente: Formulario de Categoría --- //
function CategoriaForm({ categoria, onSave, onCancel, onFormModifiedChange, isSubmitting, setIsSubmitting }: CategoriaFormProps) {
  const [nombre, setNombre] = useState(categoria?.nombre || '')
  const [slug, setSlug] = useState(categoria?.slug || '')
  const [descripcion, setDescripcion] = useState(categoria?.descripcion || '')
  const [orden, setOrden] = useState(categoria?.orden || 0)
  const [color, setColor] = useState(categoria?.color || '#3b82f6')
  const [esActiva, setEsActiva] = useState(categoria?.es_activa !== false)
  const [categoriaPadreId, setCategoriaPadreId] = useState<string | null>(categoria?.parent_id || null)
  const [categoriasPadre, setCategoriasPadre] = useState<CategoriaNoticia[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Actualizar estados cuando cambia la categoría a editar
  useEffect(() => {
    if (categoria) {
      setNombre(categoria.nombre || '')
      setSlug(categoria.slug || '')
      setDescripcion(categoria.descripcion || '')
      setOrden(categoria.orden || 0)
      setColor(categoria.color || '#3b82f6')
      setEsActiva(categoria.es_activa !== false)
      setCategoriaPadreId(categoria.parent_id || null)
    }
  }, [categoria])
  const [formModified, setFormModified] = useState(false)

  // Detectar cambios en el formulario
  useEffect(() => {
    const isModified = nombre !== (categoria?.nombre || '') ||
        descripcion !== (categoria?.descripcion || '') ||
        esActiva !== (categoria?.es_activa !== false) ||
        categoriaPadreId !== (categoria?.parent_id || null);
    
    setFormModified(isModified);
    onFormModifiedChange(isModified);
  }, [nombre, descripcion, esActiva, categoriaPadreId, categoria, onFormModifiedChange])

  // Cargar las categorías disponibles para ser padre
  useEffect(() => {
    const fetchCategoriasPadre = async () => {
      setLoadingCategorias(true)
      try {
        const response = await fetch('/api/admin/noticias/categorias?admin=true')
        if (!response.ok) throw new Error('Error al cargar las categorías')
        const data = await response.json()
        
        // Calcular niveles y filtrar para evitar ciclos
        const categoriasConNivel = calcularNiveles(data)
        
        // Filtrar para evitar ciclos (no mostrar la categoría actual ni sus descendientes)
        let categoriasDisponibles = categoriasConNivel
        if (categoria?.id) {
          const descendientes = obtenerDescendientes(categoria.id.toString(), categoriasConNivel)
          categoriasDisponibles = categoriasConNivel.filter(c => 
            c.id.toString() !== categoria.id.toString() && 
            !descendientes.includes(c.id.toString())
          )
        }
        
        // Filtrar por término de búsqueda si existe
        if (searchTerm) {
          const termLower = searchTerm.toLowerCase()
          categoriasDisponibles = categoriasDisponibles.filter(c => 
            c.nombre.toLowerCase().includes(termLower)
          )
        }
        
        setCategoriasPadre(categoriasDisponibles)
      } catch (error) {
        console.error('Error al cargar categorías padre:', error)
      } finally {
        setLoadingCategorias(false)
      }
    }
    
    fetchCategoriasPadre()
  }, [categoria, searchTerm])

  // Manejar el guardado del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Validar campos obligatorios
      if (!nombre.trim()) {
        throw new Error('El nombre es obligatorio')
      }
      
      // Crear objeto de categoría
      const categoriaData: CategoriaNoticia = {
        id: categoria?.id || '',
        nombre: nombre.trim(),
        slug: slug.trim() || nombre.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        descripcion: descripcion.trim(),
        orden: orden || 0,
        color,
        es_activa: esActiva,
        parent_id: categoriaPadreId
      }
      
      onSave(categoriaData)
    } catch (error: any) {
      toast({
        variant: "destructive",
        description: error.message
      })
      setIsSubmitting(false)
    }
  }

  // Manejar selección de categoría padre
  const handleSeleccionarPadre = (id: string | number) => {
    setCategoriaPadreId(id.toString() === categoriaPadreId ? null : id.toString())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="nombre" className="text-sm font-medium">
          Nombre
        </label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la categoría"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="descripcion" className="text-sm font-medium">
          Descripción
        </label>
        <Textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción de la categoría"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Categoría Padre (opcional)
        </label>
        <div className="border rounded-md p-2">
          <Input
            type="text"
            placeholder="Buscar categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          
          {loadingCategorias ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            <ArbolCategorias
              categorias={categoriasPadre}
              seleccionadas={categoriaPadreId ? [categoriaPadreId] : []}
              onSeleccionar={handleSeleccionarPadre}
              className="max-h-48"
              soloActivas={true}
              estiloVisual="arbol"
              mostrarIconos={true}
              colorPorNivel={true}
            />
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="esActiva"
          checked={esActiva}
          onChange={(e) => setEsActiva(e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="esActiva" className="text-sm font-medium">
          Categoría activa
        </label>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formModified}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : categoria?.id ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  )
}

// Funciones auxiliares para manejar jerarquías
function calcularNiveles(categorias: CategoriaNoticia[]): CategoriaNoticia[] {
  // Crear un mapa para acceso rápido por ID
  const categoriasMap = new Map<string, CategoriaNoticia>()
  categorias.forEach(cat => {
    categoriasMap.set(cat.id.toString(), { ...cat, nivel: 1, hijos: [] })
  })
  
  // Asignar niveles y construir jerarquía
  categorias.forEach(cat => {
    if (cat.parent_id) {
      const padre = categoriasMap.get(cat.parent_id.toString())
      if (padre) {
        const categoriaActual = categoriasMap.get(cat.id.toString())
        if (categoriaActual) {
          categoriaActual.nivel = (padre.nivel || 1) + 1
          
          // Añadir como hijo al padre
          if (!padre.hijos) padre.hijos = []
          padre.hijos.push(categoriaActual)
        }
      }
    }
  })
  
  // Filtrar solo las categorías de nivel 1 (raíz)
  return Array.from(categoriasMap.values()).filter(cat => cat.nivel === 1)
}

function obtenerDescendientes(categoriaId: string, categorias: CategoriaNoticia[]): string[] {
  const resultado: string[] = []
  
  function buscarHijos(id: string) {
    const hijos = categorias.filter(c => c.parent_id === id)
    hijos.forEach(hijo => {
      resultado.push(hijo.id.toString())
      buscarHijos(hijo.id.toString())
    })
  }
  
  buscarHijos(categoriaId)
  return resultado
}

// --- Componente: Gestor de Categorías --- //
function CategoriasManager() {
  // Estados del componente
  const [categorias, setCategorias] = useState<CategoriaNoticia[]>([])
  const [categoriasPlanas, setCategoriasPlanas] = useState<CategoriaNoticia[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<CategoriaNoticia | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<(number | string)[]>([])
  const [creatingIds, setCreatingIds] = useState<(number | string)[]>([])
  const [highlightedIds, setHighlightedIds] = useState<(number | string)[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formModified, setFormModified] = useState(false)

  const fetchCategorias = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/noticias/categorias?admin=true')
      if (!response.ok) throw new Error('Error al cargar las categorías.')
      const data = await response.json()
      
      // Guardar la lista plana para operaciones
      setCategoriasPlanas(data)
      
      // Calcular niveles jerárquicos
      const categoriasConNivel = calcularNiveles(data)
      setCategorias(categoriasConNivel)
    } catch (err: any) {
      setError(err.message)
      toast({
        variant: "destructive",
        description: err.message || "Error al cargar las categorías"
      })
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategorias()
  }, [fetchCategorias])
  
  // Función para eliminar una categoría con animación
  const handleDelete = async (id: string | number) => {
    // Primero agregamos el ID a la lista de IDs en proceso de eliminación
    // para activar la animación de salida
    setDeletingIds(prev => [...prev, id])
    
    // Esperamos a que termine la animación antes de hacer la petición DELETE
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/noticias/categorias?admin=true`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id })
        })
        
        if (!response.ok) throw new Error('Error al eliminar la categoría')
        
        // Recargar categorías después de eliminar
        await fetchCategorias()
        
        toast({
          description: 'Categoría eliminada correctamente'
        })
      } catch (error: any) {
        console.error('Error al eliminar la categoría:', error)
        toast({
          variant: "destructive",
          description: error.message || 'Error al eliminar la categoría'
        })
      } finally {
        // Eliminar el ID de la lista de IDs en proceso de eliminación
        setDeletingIds(prev => prev.filter(item => item !== id))
      }
    }, 300) // Tiempo suficiente para que se vea la animación de salida
  }

  const handleSave = async (categoria: CategoriaNoticia) => {
    setIsSubmitting(true);
    try {
      let nuevaCategoriaId: string | number = '';
      
      if (editingCategoria) {
        // Actualizar categoría existente
        const response = await fetch(`/api/admin/noticias/categorias?admin=true`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(categoria)
        });
        
        if (!response.ok) throw new Error('Error al actualizar la categoría');
        const data = await response.json();
        nuevaCategoriaId = data.id || editingCategoria.id;
        
        toast({
          description: 'Categoría actualizada correctamente'
        });
      } else {
        // Crear nueva categoría
        const response = await fetch(`/api/admin/noticias/categorias?admin=true`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(categoria)
        });
        
        if (!response.ok) throw new Error('Error al crear la categoría');
        const data = await response.json();
        nuevaCategoriaId = data.id;
        
        // Añadir a la lista de IDs en proceso de creación para la animación
        setCreatingIds(prev => [...prev, nuevaCategoriaId]);
        
        toast({
          description: 'Categoría creada correctamente'
        });
      }
      
      // Recargar categorías y cerrar el formulario
      await fetchCategorias();
      setIsFormOpen(false);
      setEditingCategoria(null);
      
      // Resaltar la categoría recién creada/actualizada
      setHighlightedIds(prev => [...prev, nuevaCategoriaId]);
      setTimeout(() => {
        setHighlightedIds(prev => prev.filter(id => id !== nuevaCategoriaId));
      }, 3000);
      
      // Quitar de la lista de IDs en proceso de creación después de un tiempo
      setTimeout(() => {
        setCreatingIds(prev => prev.filter(id => id !== nuevaCategoriaId));
      }, 1000);
    } catch (error: any) {
      console.error('Error al guardar la categoría:', error);
      toast({
        variant: "destructive",
        description: error.message || 'Error al guardar la categoría'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditarCategoria = (categoria: CategoriaNoticia) => {
    setEditingCategoria(categoria);
    setIsFormOpen(true);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold">Categorías de Noticias</CardTitle>
          <CardDescription>
            Gestiona las categorías para organizar las noticias
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isFormOpen} onOpenChange={(open) => {
            if (!open && formModified) {
              if (confirm('¿Estás seguro de cerrar? Perderás los cambios no guardados.')) {
                setIsFormOpen(false);
                setEditingCategoria(null);
              }
            } else {
              setIsFormOpen(open);
              if (!open) setEditingCategoria(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setIsFormOpen(true); setEditingCategoria(null); }}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
                </DialogTitle>
              </DialogHeader>
              {(isFormOpen) && (
                <>
                  <CategoriaForm
                    categoria={editingCategoria}
                    onSave={handleSave}
                    onCancel={() => {
                      if (!formModified || confirm('¿Estás seguro de cerrar? Perderás los cambios no guardados.')) {
                        setIsFormOpen(false);
                        setEditingCategoria(null);
                      }
                    }}
                    onFormModifiedChange={setFormModified}
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                  />
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={() => fetchCategorias()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </div>
        ) : categoriasPlanas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay categorías creadas. Crea tu primera categoría.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Listado de Categorías</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchCategorias()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>
            
            {/* Usar nuestro componente ArbolCategorias con estilo admin */}
            <ArbolCategorias
              categorias={categorias}
              mostrarContador={true}
              mostrarBadgeActivo={true}
              expandirTodo={true}
              estiloVisual="admin"
              mostrarIconos={true}
              colorPorNivel={true}
            />
            
            {/* Tabla de acciones rápidas */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Acciones Rápidas</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Noticias</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriasPlanas.map(cat => (
                    <TableRow key={cat.id} className={`
                      ${deletingIds.includes(cat.id) ? 'opacity-50' : ''}
                      ${creatingIds.includes(cat.id) ? 'bg-green-50' : ''}
                      ${highlightedIds.includes(cat.id) ? 'bg-blue-50' : ''}
                    `}>
                      <TableCell>
                        <div className="font-medium">{cat.nombre}</div>
                        <div className="text-sm text-muted-foreground">{cat.slug}</div>
                      </TableCell>
                      <TableCell>
                        {cat.es_activa !== false ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-500">
                            Inactiva
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {cat.noticias_count || 0}
                        </Badge>
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
                            <DropdownMenuItem onClick={() => handleEditarCategoria(cat)}>
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
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la categoría
                                    {cat.hijos && cat.hijos.length > 0 && ' y todas sus subcategorías'}.
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// --- Componente: Página Principal --- //
function CategoriasNoticiasPage() {
  return (
    <AdminProtection>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">Administración de Categorías</h1>
        <CategoriasManager />
      </div>
    </AdminProtection>
  )
}

export default CategoriasNoticiasPage;
