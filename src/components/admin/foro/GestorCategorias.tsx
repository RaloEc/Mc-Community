/**
 * Gestor de categorías mejorado con drag & drop
 * Permite reorganizar categorías visualmente
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEstadisticasCategorias } from './hooks/useEstadisticasForo';
import { useValidatedCategories, type CategoriaForo } from '@/hooks/useValidatedCategories';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FolderOpen, Plus, Edit, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

// Usar el tipo validado del hook
type Categoria = CategoriaForo & {
  orden: number;
  total_hilos: number;
}

interface CategoriaFormData {
  nombre: string;
  slug: string;
  descripcion: string;
  color: string;
  icono: string;
  parent_id: string | null;
  es_activa: boolean;
}

function CategoriaItem({ categoria, onEdit, onDelete }: {
  categoria: Categoria;
  onEdit: (categoria: Categoria) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoria.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 rounded-lg border bg-card ${
        categoria.nivel === 2 ? 'ml-8' : ''
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {categoria.color && (
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: categoria.color }}
        />
      )}

      {categoria.icono && <span className="text-xl">{categoria.icono}</span>}

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{categoria.nombre}</span>
          {!categoria.es_activa && (
            <Badge variant="destructive" className="text-xs">
              Inactiva
            </Badge>
          )}
          {categoria.nivel === 2 && (
            <Badge variant="outline" className="text-xs">
              Subcategoría
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {categoria.descripcion || 'Sin descripción'}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {categoria.total_hilos} hilos • Slug: {categoria.slug}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(categoria)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(categoria.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function GestorCategorias() {
  // Usar hook validado con Zod
  const { data: categoriasData, refetch, isLoading, error } = useValidatedCategories();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [dialogEliminar, setDialogEliminar] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoriaFormData>({
    nombre: '',
    slug: '',
    descripcion: '',
    color: '#3b82f6',
    icono: '',
    parent_id: null,
    es_activa: true,
  });

  // Actualizar categorías cuando cambian los datos
  React.useEffect(() => {
    if (categoriasData) {
      const categoriasConOrden = categoriasData.map((cat, index) => ({
        ...cat,
        orden: cat.orden ?? index,
        total_hilos: cat.total_hilos ?? 0,
      }));
      setCategorias(categoriasConOrden);
    }
  }, [categoriasData]);

  // Mostrar error si falla la carga
  React.useEffect(() => {
    if (error) {
      console.error('Error al cargar categorías:', error)
      toast.error('Error al cargar las categorías del foro')
    }
  }, [error]);

  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategorias((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Actualizar orden en el servidor
        actualizarOrden(newItems);

        return newItems;
      });
    }
  }, []);

  const actualizarOrden = async (nuevasCategorias: Categoria[]) => {
    try {
      // Aquí deberías llamar a tu API para actualizar el orden
      const updates = nuevasCategorias.map((cat, index) => ({
        id: cat.id,
        orden: index,
      }));

      const response = await fetch('/api/admin/foro/categorias/orden', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) throw new Error('Error al actualizar el orden');

      toast.success('Orden actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar orden:', error);
      toast.error('Error al actualizar el orden');
      refetch();
    }
  };

  const handleAbrirFormulario = (categoria?: Categoria) => {
    if (categoria) {
      setCategoriaEditando(categoria);
      setFormData({
        nombre: categoria.nombre,
        slug: categoria.slug,
        descripcion: categoria.descripcion,
        color: categoria.color || '#3b82f6',
        icono: categoria.icono || '',
        parent_id: categoria.parent_id || null,
        es_activa: categoria.es_activa,
      });
    } else {
      setCategoriaEditando(null);
      setFormData({
        nombre: '',
        slug: '',
        descripcion: '',
        color: '#3b82f6',
        icono: '',
        parent_id: null,
        es_activa: true,
      });
    }
    setDialogAbierto(true);
  };

  const handleGuardar = async () => {
    try {
      const url = categoriaEditando
        ? `/api/admin/foro/categorias?id=${categoriaEditando.id}`
        : '/api/admin/foro/categorias';

      const response = await fetch(url, {
        method: categoriaEditando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          nivel: nivelCalculado, // Usar nivel calculado automáticamente
          orden: categorias.length,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }

      toast.success(categoriaEditando ? 'Categoría actualizada' : 'Categoría creada');
      setDialogAbierto(false);
      refetch();
    } catch (error: any) {
      console.error('Error al guardar categoría:', error);
      toast.error(error.message || 'Error al guardar la categoría');
    }
  };

  const handleEliminar = async () => {
    if (!dialogEliminar) return;

    try {
      const response = await fetch(`/api/admin/foro/categorias?id=${dialogEliminar}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      toast.success('Categoría eliminada correctamente');
      setDialogEliminar(null);
      refetch();
    } catch (error: any) {
      console.error('Error al eliminar categoría:', error);
      toast.error(error.message || 'Error al eliminar la categoría');
    }
  };

  const generarSlug = (nombre: string) => {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Filtrar categorías que pueden ser padres (nivel 1 o 2)
  // Una categoría de nivel 3 no puede tener hijas
  const categoriasPadrePosibles = React.useMemo(() => {
    return categorias.filter(c => {
      // Excluir la categoría que se está editando para evitar auto-referencia
      if (categoriaEditando && c.id === categoriaEditando.id) {
        return false;
      }
      // Solo nivel 1 y 2 pueden ser padres (nivel 3 es el máximo)
      return c.nivel === 1 || c.nivel === 2;
    });
  }, [categorias, categoriaEditando]);

  // Categorías principales solo para visualización
  const categoriasPrincipales = React.useMemo(() => {
    return categorias.filter(c => c.nivel === 1 || (!c.nivel && !c.parent_id));
  }, [categorias]);

  // Calcular nivel automáticamente según el padre seleccionado
  const nivelCalculado = React.useMemo(() => {
    if (!formData.parent_id) return 1;
    const padre = categorias.find(c => c.id === formData.parent_id);
    return padre ? (padre.nivel || 1) + 1 : 1;
  }, [formData.parent_id, categorias]);

  // Debug: Log para verificar categorías
  React.useEffect(() => {
    if (categorias.length > 0) {
      console.log('Total categorías cargadas:', categorias.length);
      console.log('Categorías que pueden ser padres:', categoriasPadrePosibles.length);
      console.log('Nivel calculado:', nivelCalculado);
    }
  }, [categorias, categoriasPadrePosibles.length, nivelCalculado]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Gestión de Categorías
            </CardTitle>
            <CardDescription className="mt-2">
              Organiza las categorías del foro con drag & drop
            </CardDescription>
          </div>
          <Button onClick={() => handleAbrirFormulario()}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando categorías...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            Error al cargar las categorías. Por favor, recarga la página.
          </div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categorias.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {categorias.map((categoria) => (
                    <CategoriaItem
                      key={categoria.id}
                      categoria={categoria}
                      onEdit={handleAbrirFormulario}
                      onDelete={setDialogEliminar}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {categorias.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay categorías. Crea una para comenzar.
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Dialog de formulario */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      nombre: e.target.value,
                      slug: generarSlug(e.target.value),
                    });
                  }}
                  placeholder="Nombre de la categoría"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="slug-de-la-categoria"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción de la categoría"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icono">Icono (emoji)</Label>
                <Input
                  id="icono"
                  value={formData.icono}
                  onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                  placeholder="📁"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">Categoría Padre (Opcional)</Label>
                <Select
                  value={formData.parent_id || 'none'}
                  onValueChange={(value) => {
                    // Convertir 'none' a null para la base de datos
                    const parentId = value === 'none' ? null : value;
                    setFormData({ ...formData, parent_id: parentId });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ninguna (Principal)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">📁 Ninguna (Principal - Nivel 1)</SelectItem>
                    {categoriasPadrePosibles.map((cat, index) => {
                        // ---- VALIDACIÓN ROBUSTA ----
                        // Verificar que la categoría y su ID sean válidos
                        if (!cat || typeof cat.id !== 'string' || cat.id.trim() === '') {
                          console.error(
                            `Error de datos: Se encontró una categoría inválida en el índice ${index}.`,
                            cat
                          );
                          return null; // No renderizar el SelectItem defectuoso
                        }
                        
                        // Verificar que tenga nombre válido
                        if (!cat.nombre || typeof cat.nombre !== 'string' || cat.nombre.trim() === '') {
                          console.error(
                            `Error de datos: Categoría con ID "${cat.id}" tiene nombre inválido.`,
                            cat
                          );
                          return null;
                        }
                        // ---- FIN VALIDACIÓN ----

                        // Obtener emoji según nivel
                        const nivelEmoji = cat.nivel === 1 ? '📁' : '📂';
                        const indent = cat.nivel === 2 ? '  ↳ ' : '';
                        
                        return (
                          <SelectItem 
                            key={cat.id} 
                            value={cat.id}
                            className={cat.nivel === 2 ? 'pl-6' : ''}
                          >
                            {indent}{nivelEmoji} {cat.nombre} (Nivel {cat.nivel})
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="activa"
                checked={formData.es_activa}
                onCheckedChange={(checked) => setFormData({ ...formData, es_activa: checked })}
              />
              <Label htmlFor="activa">Categoría activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={!formData.nombre || !formData.slug}>
              {categoriaEditando ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={!!dialogEliminar} onOpenChange={() => setDialogEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la categoría permanentemente. Si tiene hilos asociados,
              no podrá eliminarse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEliminar} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
