'use client'

import React, { useState, useEffect, useCallback } from 'react'
import AdminProtection from '@/components/AdminProtection';
import { Shield, BarChart3, Megaphone, Image as ImageIcon, Settings, PlusCircle, Edit, Trash2, MoreHorizontal, Users, MessageSquare, List, Eye, RefreshCw } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Tipos
interface Categoria {
  id: string
  nombre: string
  slug: string
  descripcion: string
  orden: number
  icono: string | null
  parent_id: string | null
  nivel: number
  color: string | null
  es_activa: boolean
  hilos_count?: number
  hilos_total?: number
  subcategorias?: Categoria[]
}

interface Etiqueta {
  id: string
  nombre: string
  descripcion: string | null
  color: string | null
}

interface CategoriaFormProps {
  categoria?: Categoria | null
  categorias: Categoria[]
  onSave: () => void
  onCancel: () => void
}

interface EtiquetaFormProps {
  etiqueta?: Etiqueta | null
  onSave: () => void
  onCancel: () => void
}

// --- Componente: Formulario de Categoría --- //
function CategoriaForm({ categoria, categorias, onSave, onCancel }: CategoriaFormProps) {
  const [nombre, setNombre] = useState(categoria?.nombre || '')
  const [slug, setSlug] = useState(categoria?.slug || '')
  const [descripcion, setDescripcion] = useState(categoria?.descripcion || '')
  const [orden, setOrden] = useState(categoria?.orden || 0)
  const [icono, setIcono] = useState(categoria?.icono || '')
  const [parentId, setParentId] = useState(categoria?.parent_id || '')
  const [nivel, setNivel] = useState(categoria?.nivel || 1)
  const [color, setColor] = useState(categoria?.color || '#3b82f6')
  const [esActiva, setEsActiva] = useState(categoria?.es_activa !== false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Calcular nivel automáticamente basado en si tiene padre
    const nivelCalculado = parentId ? 2 : 1
    
    const categoriaData = { 
      nombre, 
      slug,
      descripcion, 
      orden: Number(orden), 
      icono,
      parent_id: parentId || null,
      nivel: nivelCalculado,
      color,
      es_activa: esActiva
    }

    try {
      let response
      if (categoria && categoria.id) {
        response = await fetch(`/api/admin/foro/categorias?id=${categoria.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoriaData),
        })
      } else {
        response = await fetch('/api/admin/foro/categorias', {
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

      {categoria && (
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
      )}

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

      <div className="space-y-2">
        <label htmlFor="icono" className="text-sm font-medium">Icono (opcional)</label>
        <Input
          id="icono"
          value={icono || ''}
          onChange={(e) => setIcono(e.target.value)}
          placeholder="Nombre del icono (ej: message-square)"
        />
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
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [reassignOpen, setReassignOpen] = useState(false)
  const [fromCategoryId, setFromCategoryId] = useState<string>('')
  const [toCategoryId, setToCategoryId] = useState<string>('')

  const fetchCategorias = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/foro/categorias')
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

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/foro/categorias?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Error al eliminar la categoría.')
      toast.success('Categoría eliminada con éxito.')
      fetchCategorias()
    } catch (err: any) {
      toast.error(err.message)
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

  const openReassignDialog = (fromId: string) => {
    setFromCategoryId(fromId)
    setToCategoryId('')
    setReassignOpen(true)
  }

  const handleConfirmReassign = async () => {
    try {
      if (!fromCategoryId || !toCategoryId) {
        toast.error('Selecciona la categoría de destino')
        return
      }
      if (fromCategoryId === toCategoryId) {
        toast.error('La categoría de destino debe ser distinta a la de origen')
        return
      }
      const resp = await fetch('/api/admin/foro/hilos/reasignar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromCategoriaId: fromCategoryId, toCategoriaId: toCategoryId })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'No se pudo reasignar')
      toast.success(`Reasignados ${data?.count ?? 0} hilos`)
      setReassignOpen(false)
      setFromCategoryId('')
      setToCategoryId('')
      await fetchCategorias()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al reasignar hilos'
      toast.error(msg)
    }
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
            <CardDescription>Crea, edita y elimina las categorías del foro.</CardDescription>
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
                    : editingCategoria?.parent_id 
                      ? 'Nueva Subcategoría' 
                      : 'Nueva Categoría'}
                </DialogTitle>
              </DialogHeader>
              {isFormOpen && (
                <CategoriaForm 
                  categoria={editingCategoria} 
                  categorias={categorias} 
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
              <TableHead>Hilos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Primero mostramos las categorías principales */}
              {categorias
                .filter(cat => !cat.parent_id)
                .sort((a, b) => a.orden - b.orden)
                .map((cat) => (
                <React.Fragment key={cat.id}>
                  {/* Categoría principal */}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <span>{cat.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>{cat.descripcion}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex items-center gap-1">
                              <Badge
                                variant="secondary"
                                className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900"
                              >
                                {typeof cat.hilos_count === 'number' ? cat.hilos_count : 0}
                              </Badge>
                              <span className="text-muted-foreground">/</span>
                              <Badge
                                className="px-2 py-0.5 text-xs bg-blue-600 text-white dark:bg-blue-500"
                              >
                                {cat.parent_id
                                  ? (typeof cat.hilos_count === 'number' ? cat.hilos_count : 0)
                                  : (typeof cat.hilos_total === 'number' ? cat.hilos_total : (typeof cat.hilos_count === 'number' ? cat.hilos_count : 0))}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              {(() => {
                                const propios = typeof cat.hilos_count === 'number' ? cat.hilos_count : 0
                                const total = cat.parent_id ? propios : (typeof cat.hilos_total === 'number' ? cat.hilos_total : propios)
                                const sub = Math.max(total - propios, 0)
                                return cat.parent_id
                                  ? `${propios} propios (sin subcategorías)`
                                  : `${propios} propios, ${sub} en subcategorías (total ${total})`
                              })()}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                      <DropdownMenuItem onClick={() => { setEditingCategoria(cat); setIsFormOpen(true); }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openReassignDialog(cat.id)}>
                        <List className="mr-2 h-4 w-4" />
                        Reasignar hilos…
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setEditingCategoria({ parent_id: cat.id } as any); // Usamos 'any' para un objeto parcial
                        setIsFormOpen(true);
                      }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Subcategoría
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
                  
                  {/* Subcategorías de esta categoría principal */}
                  {categorias
                    .filter(subcat => subcat.parent_id === cat.id)
                    .sort((a, b) => a.orden - b.orden)
                    .map(subcat => (
                      <TableRow key={subcat.id} className="bg-muted/30">
                        <TableCell className="font-medium">
                          <div className="flex items-center pl-6 border-l-2 ml-2" style={{ borderColor: cat.color || '#666' }}>
                            {subcat.color && (
                              <div 
                                className="w-2 h-2 rounded-full mr-2" 
                                style={{ backgroundColor: subcat.color }}
                              />
                            )}
                            <span>{subcat.nombre}</span>
                          </div>
                        </TableCell>
                        <TableCell>{subcat.descripcion}</TableCell>
                        <TableCell>{typeof subcat.hilos_count === 'number' ? subcat.hilos_count : 0}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingCategoria(subcat); setIsFormOpen(true); }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openReassignDialog(subcat.id)}>
                                <List className="mr-2 h-4 w-4" />
                                Reasignar hilos…
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
                                      Esta acción no se puede deshacer. Esto eliminará permanentemente la subcategoría.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(subcat.id)}>Continuar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </React.Fragment>
              ))}
          </TableBody>
        </Table>
        {/* Diálogo para reasignar hilos */}
        <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reasignar hilos de categoría</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Categoría de origen</p>
                <p className="font-medium text-sm">
                  {categorias.find(c => c.id === fromCategoryId)?.nombre || '—'}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría de destino</label>
                <select
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
                  value={toCategoryId}
                  onChange={(e) => setToCategoryId(e.target.value)}
                >
                  <option value="">Selecciona una categoría…</option>
                  {categorias
                    .sort((a, b) => a.orden - b.orden)
                    .map(c => (
                      <option key={c.id} value={c.id} disabled={c.id === fromCategoryId}>
                        {c.parent_id ? '— ' : ''}{c.nombre}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground">Moverá todos los hilos de la categoría origen a la categoría seleccionada.</p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleConfirmReassign}>Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

// --- Componente: Contenido del Dashboard del Foro --- //
function ForoDashboardContent() {
  const [estadisticas, setEstadisticas] = useState({
    totalHilos: 0,
    totalPosts: 0,
    postsRecientes: 0,
    totalUsuariosActivos: 0,
    vistasPromedio: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstadisticas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/foro/estadisticas');
      if (!response.ok) {
        throw new Error('No se pudieron cargar las estadísticas del foro.');
      }
      const data = await response.json();
      setEstadisticas(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEstadisticas();
  }, [fetchEstadisticas]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center p-6">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchEstadisticas} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hilos Totales</CardTitle>
          <List className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estadisticas.totalHilos}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Posts Totales</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estadisticas.totalPosts}</div>
          <p className="text-xs text-muted-foreground">+{estadisticas.postsRecientes} esta semana</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estadisticas.totalUsuariosActivos}</div>
          <p className="text-xs text-muted-foreground">en la última semana</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vistas Promedio / Hilo</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isNaN(estadisticas.vistasPromedio) ? 0 : Math.round(estadisticas.vistasPromedio)}</div>
          <p className="text-xs text-muted-foreground">Promedio general</p>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Componente: Formulario de Etiqueta --- //
function EtiquetaForm({ etiqueta, onSave, onCancel }: EtiquetaFormProps) {
  const [nombre, setNombre] = useState(etiqueta?.nombre || '')
  const [descripcion, setDescripcion] = useState(etiqueta?.descripcion || '')
  const [color, setColor] = useState(etiqueta?.color || '#3b82f6')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const etiquetaData = { 
      nombre, 
      descripcion, 
      color
    }

    try {
      let response
      if (etiqueta) {
        response = await fetch(`/api/admin/foro/etiquetas?id=${etiqueta.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(etiquetaData),
        })
      } else {
        response = await fetch('/api/admin/foro/etiquetas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(etiquetaData),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al guardar la etiqueta.')
      }

      toast.success(`Etiqueta ${etiqueta ? 'actualizada' : 'creada'} con éxito.`)
      onSave()
    } catch (err: any) {
      toast.error(err.message)
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
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la etiqueta"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="descripcion" className="text-sm font-medium">Descripción</label>
        <Textarea
          id="descripcion"
          value={descripcion || ''}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción breve de la etiqueta"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="color" className="text-sm font-medium">Color</label>
        <div className="flex gap-2 items-center">
          <Input
            id="color"
            type="color"
            value={color || '#3b82f6'}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-10 p-1"
          />
          <Input
            type="text"
            value={color || '#3b82f6'}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#3b82f6"
            className="flex-1"
          />
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// --- Componente: Gestor de Etiquetas --- //
function EtiquetasManager() {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEtiqueta, setEditingEtiqueta] = useState<Etiqueta | null>(null)

  const fetchEtiquetas = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/foro/etiquetas')
      if (!response.ok) throw new Error('Error al cargar las etiquetas.')
      const data = await response.json()
      setEtiquetas(data)
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEtiquetas()
  }, [fetchEtiquetas])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/foro/etiquetas?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Error al eliminar la etiqueta.')
      toast.success('Etiqueta eliminada con éxito.')
      fetchEtiquetas()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleSave = () => {
    setIsFormOpen(false)
    setEditingEtiqueta(null)
    fetchEtiquetas()
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingEtiqueta(null)
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestión de Etiquetas</CardTitle>
            <CardDescription>Crea, edita y elimina las etiquetas para clasificar los hilos del foro.</CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEtiqueta(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Etiqueta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEtiqueta ? 'Editar' : 'Nueva'} Etiqueta</DialogTitle>
              </DialogHeader>
              <EtiquetaForm etiqueta={editingEtiqueta} onSave={handleSave} onCancel={handleCancel} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Color</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {etiquetas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No hay etiquetas creadas. Crea una nueva etiqueta para empezar.
                </TableCell>
              </TableRow>
            ) : (
              etiquetas.map((etiqueta) => (
                <TableRow key={etiqueta.id}>
                  <TableCell>
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: etiqueta.color || '#3b82f6' }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{etiqueta.nombre}</TableCell>
                  <TableCell>{etiqueta.descripcion}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingEtiqueta(etiqueta); setIsFormOpen(true); }}>
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
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la etiqueta.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(etiqueta.id)}>Continuar</AlertDialogAction>
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
      </CardContent>
    </Card>
  )
}

// --- Componentes Placeholder para nuevas secciones --- //
function PlaceholderContent({ title, icon: Icon }: { title: string, icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Icon className="mr-2 h-5 w-5" /> {title}</CardTitle>
        <CardDescription>Esta sección está en construcción.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>El contenido para la gestión de {title.toLowerCase()} se implementará aquí.</p>
      </CardContent>
    </Card>
  );
}

// --- Página Principal de Admin Foro --- //
export default function AdminForoPage() {
  return (
    <AdminProtection>
      <div className="space-y-6 p-4 md:p-8 w-full">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Administración del Foro</h1>
        </div>
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-4 md:grid-cols-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="moderacion">Moderación</TabsTrigger>
            <TabsTrigger value="categorias">Categorías</TabsTrigger>
            <TabsTrigger value="etiquetas">Etiquetas</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            <TabsTrigger value="anuncios">Anuncios</TabsTrigger>
            <TabsTrigger value="medios">Medios</TabsTrigger>
            <TabsTrigger value="configuracion">Configuración</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="space-y-4">
            <ForoDashboardContent />
          </TabsContent>
          <TabsContent value="moderacion">
            <PlaceholderContent title="Moderación" icon={Shield} />
          </TabsContent>
          <TabsContent value="categorias" className="space-y-4">
            <CategoriasManager />
          </TabsContent>
          <TabsContent value="etiquetas" className="space-y-4">
            <EtiquetasManager />
          </TabsContent>
          <TabsContent value="estadisticas">
            <PlaceholderContent title="Estadísticas" icon={BarChart3} />
          </TabsContent>
          <TabsContent value="anuncios">
            <PlaceholderContent title="Anuncios" icon={Megaphone} />
          </TabsContent>
          <TabsContent value="medios">
            <PlaceholderContent title="Medios" icon={ImageIcon} />
          </TabsContent>
          <TabsContent value="configuracion">
            <PlaceholderContent title="Configuración" icon={Settings} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminProtection>
  );
}
