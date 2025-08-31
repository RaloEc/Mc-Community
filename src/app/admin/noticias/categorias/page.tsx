'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import AdminProtection from '@/components/AdminProtection';
import { MagicMotion } from 'react-magic-motion';
import { PlusCircle, Expand, Minimize, Trash2, Edit, Check, MoreVertical, MoreHorizontal, ChevronDown, ChevronRight, Loader2, X } from 'lucide-react';
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
import { toast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import './animations.css'

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
  parent_id?: string | null;
  categoria_padre_id?: string | null; // Campo antiguo, mantener por compatibilidad
  categoria_padre?: {
    id: string;
    nombre: string;
  } | null;
  nivel?: number; // Nivel jerárquico (1, 2, 3)
  hijos?: CategoriaNoticia[]; // Subcategorías
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
        
        // Si estamos editando, filtramos la categoría actual y sus descendientes para evitar ciclos
        let categoriasFiltradas = categoriasConNivel
        if (categoria?.id) {
          const descendientes = obtenerDescendientes(categoria.id.toString(), categoriasConNivel)
          categoriasFiltradas = categoriasConNivel.filter(cat => 
            cat.id !== categoria.id && !descendientes.includes(cat.id.toString())
          )
        }
        
        // Solo permitir categorías de nivel 1 y 2 como padres (para máximo 3 niveles)
        const categoriasPadreValidas = categoriasFiltradas.filter(cat => (cat.nivel || 1) <= 2)
          
        setCategoriasPadre(categoriasPadreValidas)
      } catch (error) {
        console.error('Error al cargar categorías padre:', error)
        toast({
          description: 'Error al cargar las categorías disponibles',
          variant: "destructive"
        })
      } finally {
        setLoadingCategorias(false)
      }
    }
    
    fetchCategoriasPadre()
  }, [])

  // Generar slug automáticamente a partir del nombre
  useEffect(() => {
    const slugify = (str: string) => str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    setSlug(slugify(nombre));
  }, [nombre])

  // Filtrar categorías padre según término de búsqueda
  const categoriasFiltradas = searchTerm
    ? categoriasPadre.filter(cat => 
        cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    : categoriasPadre;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Generar slug automáticamente si no existe
      if (!slug) {
        const generatedSlug = nombre.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '')
        setSlug(generatedSlug)
      }

      // Preparar datos para guardar
      const categoriaData: CategoriaNoticia = {
        id: categoria?.id || '',
        nombre,
        slug: slug || nombre.toLowerCase().replace(/\s+/g, '-'),
        descripcion,
        orden: orden || 0,
        color: color || '#3b82f6',
        es_activa: esActiva,
        parent_id: categoriaPadreId
      }

      onSave(categoriaData)
      setFormModified(false)
    } catch (error: any) {
      console.error('Error en el formulario:', error)
      toast({
        description: error.message || 'Error al procesar el formulario',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pr-2">
      <div className="space-y-2">
        <label htmlFor="nombre" className="text-sm font-medium">Nombre</label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la categoría"
          required
          autoFocus
        />
      </div>

      {/* Slug oculto */}
      <input type="hidden" id="slug" value={slug} />

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
      
      {/* Color oculto */}
      <input type="hidden" id="color" value={color} />

      {/* Orden oculto */}
      <input type="hidden" id="orden" value={orden} />

      <div className="space-y-2">
        <label htmlFor="categoriaPadre" className="text-sm font-medium">Categoría Padre</label>
        
        {/* Buscador de categorías */}
        <div className="mb-2">
          <Input
            type="text"
            placeholder="Buscar categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
        </div>
        
        <div className="max-h-48 overflow-y-auto border rounded-md">
          <div className="p-2">
            <div 
              className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-muted/50 ${!categoriaPadreId ? 'bg-muted' : ''}`}
              onClick={() => setCategoriaPadreId(null)}
            >
              <span className="text-sm font-medium">-- Sin categoría padre (Nivel 1) --</span>
            </div>
            
            {categoriasFiltradas.map((cat) => {
              const nivel = cat.nivel || 1
              const isSelected = categoriaPadreId === cat.id.toString()
              const indentClass = nivel === 1 ? 'ml-0' : nivel === 2 ? 'ml-4' : 'ml-8'
              
              return (
                <div 
                  key={cat.id.toString()} 
                  className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-muted/50 ${indentClass} ${isSelected ? 'bg-muted' : ''}`}
                  onClick={() => setCategoriaPadreId(cat.id.toString())}
                >
                  <span className="mr-2">
                    {nivel === 1 ? '📁' : nivel === 2 ? '📂' : '📄'}
                  </span>
                  <span className="text-sm">{cat.nombre}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    Nivel {nivel}
                  </Badge>
                </div>
              )
            })}
            
            {loadingCategorias && (
              <div className="p-2 text-center">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full mt-1" />
              </div>
            )}
            
            {!loadingCategorias && categoriasFiltradas.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                No se encontraron categorías
              </div>
            )}
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Selecciona una categoría padre para crear una subcategoría. Máximo 3 niveles permitidos.
        </p>
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
    </form>
  )
}

// Funciones auxiliares para manejar jerarquías
function calcularNiveles(categorias: CategoriaNoticia[]): CategoriaNoticia[] {
  const categoriasMap = new Map<string, CategoriaNoticia>()
  
  // Crear mapa de categorías
  categorias.forEach(cat => {
    categoriasMap.set(cat.id.toString(), { ...cat, nivel: 1, hijos: [] })
  })
  
  // Calcular niveles
  const calcularNivel = (categoriaId: string, visitados = new Set<string>()): number => {
    if (visitados.has(categoriaId)) return 1 // Evitar ciclos
    
    const categoria = categoriasMap.get(categoriaId)
    if (!categoria || !categoria.parent_id) return 1
    
    visitados.add(categoriaId)
    const nivelPadre = calcularNivel(categoria.parent_id, visitados)
    visitados.delete(categoriaId)
    
    return nivelPadre + 1
  }
  
  // Asignar niveles y organizar hijos
  categorias.forEach(cat => {
    const categoria = categoriasMap.get(cat.id.toString())!
    categoria.nivel = calcularNivel(cat.id.toString())
    
    if (cat.parent_id) {
      const padre = categoriasMap.get(cat.parent_id)
      if (padre) {
        padre.hijos = padre.hijos || []
        padre.hijos.push(categoria)
      }
    }
  })
  
  return Array.from(categoriasMap.values())
}

function obtenerDescendientes(categoriaId: string, categorias: CategoriaNoticia[]): string[] {
  const descendientes: string[] = []
  
  const buscarHijos = (padreId: string) => {
    categorias.forEach(cat => {
      if (cat.parent_id === padreId) {
        descendientes.push(cat.id.toString())
        buscarHijos(cat.id.toString())
      }
    })
  }
  
  buscarHijos(categoriaId)
  return descendientes
}

// --- Componente: Gestor de Categorías --- //
function CategoriasManager() {
  // Estados del componente
  const [categorias, setCategorias] = useState<CategoriaNoticia[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<CategoriaNoticia | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<(number | string)[]>([])
  const [creatingIds, setCreatingIds] = useState<(number | string)[]>([])
  const [highlightedIds, setHighlightedIds] = useState<(number | string)[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandAll, setExpandAll] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formModified, setFormModified] = useState(false)

  const fetchCategorias = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/noticias/categorias?admin=true')
      if (!response.ok) throw new Error('Error al cargar las categorías.')
      const data = await response.json()
      console.log('Datos de categorías recibidos:', data)
      
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
        
        // Marcar como destacada para animación de actualización
        setHighlightedIds(prev => [...prev, nuevaCategoriaId]);
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
        
        // Marcar como creando para animación de entrada
        setCreatingIds(prev => [...prev, nuevaCategoriaId]);
      }
      
      // Recargar categorías y cerrar el formulario
      await fetchCategorias();
      setIsFormOpen(false);
      setEditingCategoria(null);
      setFormModified(false);
      
      toast({
        description: `La categoría ${categoria.nombre} ha sido ${editingCategoria ? 'actualizada' : 'creada'} correctamente.`
      });
      
      // Eliminar IDs de los estados de animación después de un tiempo
      setTimeout(() => {
        setCreatingIds(prev => prev.filter(id => id !== nuevaCategoriaId));
        setHighlightedIds(prev => prev.filter(id => id !== nuevaCategoriaId));
      }, 1500);
    } catch (error) {
      console.error('Error al guardar la categoría:', error);
      toast({
        variant: "destructive",
        description: "Ha ocurrido un error al guardar la categoría."
      });
    } finally {
      setIsSubmitting(false); // Importante: restablecer isSubmitting siempre, tanto en éxito como en error
    }
  }
  
  const handleCancel = () => {
    setEditingCategoria(null)
    setIsFormOpen(false)
    setFormModified(false)
    setIsSubmitting(false)
  }

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedCategories(new Set())
    } else {
      const allParentIds = categorias
        .filter(cat => categorias.some(child => child.parent_id === cat.id))
        .map(cat => cat.id.toString())
      setExpandedCategories(new Set(allParentIds))
    }
    setExpandAll(!expandAll)
  }

  const hasChildren = (categoryId: string) => {
    return categorias.some(cat => cat.parent_id === categoryId)
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Gestión de Categorías</CardTitle>
            <CardDescription>Crea, edita y elimina las categorías de noticias.</CardDescription>
          </div>
          <div className="flex gap-2 w-full md:w-auto md:justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleExpandAll}
              className="flex items-center gap-2 w-full md:w-auto text-xs md:text-sm"
            >
              {expandAll ? (
                <>
                  <Minimize className="h-4 w-4" />
                  Colapsar Todo
                </>
              ) : (
                <>
                  <Expand className="h-4 w-4" />
                  Expandir Todo
                </>
              )}
            </Button>
            <Dialog 
              open={isFormOpen} 
              onOpenChange={(open) => {
                // Si se está intentando cerrar y hay cambios sin guardar o está enviando
                if (!open && (formModified || isSubmitting)) {
                  // Prevenir cierre si está enviando
                  if (isSubmitting) {
                    return;
                  }
                  
                  // Confirmar antes de cerrar si hay cambios sin guardar
                  if (confirm('¿Estás seguro de cerrar? Hay cambios sin guardar.')) {
                    handleCancel();
                  } else {
                    return; // No cerrar si el usuario cancela
                  }
                } else if (!open) {
                  // Si se está cerrando sin cambios, limpiar el estado
                  handleCancel();
                } else {
                  // Si se está abriendo
                  setIsFormOpen(open);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto" onClick={() => { setEditingCategoria(null); setIsFormOpen(true); }}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nueva Categoría
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" onInteractOutside={(e) => {
                if (formModified || isSubmitting) {
                  e.preventDefault();
                  if (!isSubmitting && confirm('¿Estás seguro de cerrar? Hay cambios sin guardar.')) {
                    handleCancel();
                    setIsFormOpen(false);
                  }
                }
              }}
              onEscapeKeyDown={(e) => {
                if (formModified || isSubmitting) {
                  e.preventDefault();
                  if (!isSubmitting && confirm('¿Estás seguro de cerrar? Hay cambios sin guardar.')) {
                    handleCancel();
                    setIsFormOpen(false);
                  }
                }
              }}>
                <DialogClose 
                  className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                  onClick={(e) => {
                    if (formModified || isSubmitting) {
                      e.preventDefault();
                      if (!isSubmitting && confirm('¿Estás seguro de cerrar? Hay cambios sin guardar.')) {
                        handleCancel();
                        setIsFormOpen(false);
                      }
                    } else {
                      handleCancel();
                      setIsFormOpen(false);
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cerrar</span>
                </DialogClose>
                <DialogHeader className="pb-2">
                  <DialogTitle>
                    {editingCategoria?.id 
                      ? 'Editar Categoría' 
                      : 'Nueva Categoría'}
                  </DialogTitle>
                </DialogHeader>
                {isFormOpen && (
                  <>
                    <div className="overflow-y-auto">
                      <CategoriaForm 
                        categoria={editingCategoria} 
                        onSave={handleSave} 
                        onCancel={handleCancel}
                        onFormModifiedChange={setFormModified}
                        isSubmitting={isSubmitting}
                        setIsSubmitting={setIsSubmitting}
                      />
                    </div>
                    <div className="mt-6 border-t pt-4 flex justify-end space-x-2 bg-background w-full">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        onClick={() => {
                          setIsSubmitting(true);
                          document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                        }}
                        className="relative bg-blue-500 text-white shadow hover:bg-blue-600"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          'Guardar Cambios'
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={isSubmitting}
                        onClick={(e) => {
                          // Prevenir cierre si hay cambios sin guardar o está enviando
                          if (isSubmitting) {
                            return;
                          }
                          
                          if (formModified) {
                            if (confirm('¿Estás seguro de cerrar? Hay cambios sin guardar.')) {
                              handleCancel();
                              setIsFormOpen(false);
                            }
                          } else {
                            handleCancel();
                            setIsFormOpen(false);
                          }
                        }}
                        className="border-blue-500/20 text-blue-500 hover:bg-blue-500/10"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="animate-table-container">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jerarquía</TableHead>
                <TableHead className="hidden md:table-cell">Categoría Padre</TableHead>
                <TableHead>Noticias</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Renderizar jerarquía de hasta 3 niveles con animación */}
              {(() => {
              // Ordenar por orden dentro de cada nivel
              const ordenadas = [...categorias].sort((a, b) => {
                // Primero por nivel, luego por orden
                const nivelA = a.nivel || 1
                const nivelB = b.nivel || 1
                if (nivelA !== nivelB) return nivelA - nivelB
                return (a.orden || 0) - (b.orden || 0)
              })
              
              // Función para renderizar una categoría individual
              const renderCategoria = (cat: CategoriaNoticia, nivel: number = 1): JSX.Element => {
                const tieneHijos = hasChildren(cat.id.toString())
                const estaExpandida = expandedCategories.has(cat.id.toString())
                
                // Iconos y prefijos según el nivel
                const getIconoNivel = (nivel: number) => {
                  switch (nivel) {
                    case 1: return '📁'
                    case 2: return '📂'
                    case 3: return '📄'
                    default: return '📄'
                  }
                }
                
                const getIndentacion = (nivel: number) => {
                  const baseIndent = '  '.repeat(Math.max(0, nivel - 1))
                  switch (nivel) {
                    case 1: return ''
                    case 2: return baseIndent + '├─ '
                    case 3: return baseIndent + '│  └─ '
                    default: return baseIndent + '│     └─ '
                  }
                }
                
                const getBadgeColor = (nivel: number) => {
                  switch (nivel) {
                    case 1: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900'
                    case 2: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900'
                    case 3: return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900'
                    default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-black dark:text-gray-300 dark:border-gray-900'
                  }
                }
                
                return (
                  <TableRow 
                    key={cat.id}
                    className={`categoria-item transition-all duration-200 
                      ${deletingIds.includes(cat.id) ? 'deleting' : ''} 
                      ${creatingIds.includes(cat.id) ? 'creating' : ''}
                      ${highlightedIds.includes(cat.id) ? 'highlight' : ''}
                      ${tieneHijos ? 'cursor-pointer hover:bg-muted/50' : ''}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {/* Botón de expansión/colapso */}
                        {tieneHijos ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-muted"
                            onClick={() => toggleExpanded(cat.id.toString())}
                          >
                            {estaExpandida ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <div className="w-6" /> // Espaciador para alineación
                        )}
                        
                        <span className="text-lg">{getIconoNivel(nivel)}</span>
                        <span className="text-sm text-muted-foreground font-mono">{getIndentacion(nivel)}</span>
                        <span className={nivel === 1 ? 'font-bold' : nivel === 2 ? 'font-medium' : 'font-normal'}>
                          {cat.nombre}
                        </span>
                        
                        {/* Contador de hijos */}
                        {tieneHijos && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {ordenadas.filter(c => c.parent_id === cat.id).length}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {cat.parent_id ? (
                        (() => {
                          const padre = categorias.find(p => p.id === cat.parent_id)
                          return padre ? (
                            <span className="text-sm">{padre.nombre}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">Padre no encontrado</span>
                          )
                        })()
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900"
                      >
                        {typeof cat.noticias_count === 'number' ? cat.noticias_count : 0}
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
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente la categoría
                                  {nivel < 3 && ' y todas sus subcategorías'}.
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
                )
              }
              
              // Función recursiva para construir la jerarquía con colapso
              const construirJerarquiaColapsable = (parentId: string | null = null, nivel: number = 1): JSX.Element[] => {
                const resultado: JSX.Element[] = []
                
                // Obtener hijos del padre actual
                const hijos = ordenadas.filter(cat => cat.parent_id === parentId)
                
                hijos.forEach(cat => {
                  // Añadir la categoría actual
                  resultado.push(renderCategoria(cat, nivel))
                  
                  // Si está expandida y tiene hijos, añadir recursivamente
                  const tieneHijos = hasChildren(cat.id.toString())
                  const estaExpandida = expandedCategories.has(cat.id.toString())
                  
                  if (tieneHijos && estaExpandida && nivel < 3) {
                    resultado.push(...construirJerarquiaColapsable(cat.id.toString(), nivel + 1))
                  }
                })
                
                return resultado
              }
              
              // Construir la jerarquía completa empezando desde las categorías raíz
              const construirJerarquia = () => {
                const resultado: JSX.Element[] = []
                
                // Añadir categorías de nivel 1 y sus hijos expandidos
                resultado.push(...construirJerarquiaColapsable(null, 1))
                
                // Añadir categorías huérfanas (sin padre válido)
                const huerfanas = ordenadas.filter(cat => {
                  if (!cat.parent_id) return false // Las de nivel 1 ya están incluidas
                  return !ordenadas.some(padre => padre.id === cat.parent_id)
                })
                
                huerfanas.forEach(huerfana => {
                  resultado.push(renderCategoria(huerfana, huerfana.nivel || 1))
                })
                
                return resultado
              }
              
              // Construir y devolver la jerarquía completa
              return construirJerarquia();
            })()}
            </TableBody>
          </Table>
        </div>
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
