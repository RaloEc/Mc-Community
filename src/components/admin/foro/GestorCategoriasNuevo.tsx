/**
 * Gestor de Categorías del Foro - Versión con Acordeones Anidados
 * Soporta hasta 3 niveles de jerarquía con drag & drop
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { useValidatedCategories, type CategoriaForo } from '@/hooks/useValidatedCategories';
import { construirArbolCategorias, type CategoriaArbol } from '@/lib/foro/categorias-utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FolderOpen, Plus, Edit, Trash2, GripVertical, Folder, FolderTree } from 'lucide-react';
import { toast } from 'sonner';

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

// Componente para un item de categoría con drag & drop
function CategoriaItem({ 
  categoria, 
  nivel = 1,
  onEdit, 
  onDelete 
}: { 
  categoria: CategoriaArbol; 
  nivel?: number;
  onEdit: (cat: Categoria) => void; 
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

  const getBadgeColor = (nivel: number) => {
    switch (nivel) {
      case 1: return 'bg-blue-500';
      case 2: return 'bg-green-500';
      case 3: return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getNivelLabel = (nivel: number) => {
    switch (nivel) {
      case 1: return 'Principal';
      case 2: return 'Subcategoría';
      case 3: return 'Sub-Subcategoría';
      default: return `Nivel ${nivel}`;
    }
  };

  const hasSubcategorias = categoria.subcategorias && categoria.subcategorias.length > 0;

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Icono de la categoría */}
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-2xl"
          style={{ backgroundColor: categoria.color || '#3b82f6' + '20' }}
        >
          {categoria.icono || (nivel === 1 ? '📁' : nivel === 2 ? '📂' : '📄')}
        </div>

        {/* Información de la categoría */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {categoria.nombre}
            </h4>
            <Badge className={`${getBadgeColor(nivel)} text-white text-xs`}>
              {getNivelLabel(nivel)}
            </Badge>
            {!categoria.es_activa && (
              <Badge variant="outline" className="text-xs">
                Inactiva
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {categoria.slug}
            </span>
            <span className="flex items-center gap-1">
              <FolderTree className="h-3 w-3" />
              {categoria.total_hilos || 0} hilos
            </span>
          </div>
        </div>

        {/* Color indicator */}
        {categoria.color && (
          <div
            className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
            style={{ backgroundColor: categoria.color }}
            title={categoria.color}
          />
        )}

        {/* Acciones */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(categoria as Categoria)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(categoria.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Componente recursivo para renderizar categorías con acordeones anidados
function CategoriaAccordion({
  categoria,
  nivel = 1,
  onEdit,
  onDelete,
  onReorder,
}: {
  categoria: CategoriaArbol;
  nivel?: number;
  onEdit: (cat: Categoria) => void;
  onDelete: (id: string) => void;
  onReorder: (items: CategoriaArbol[], parentId: string | null) => void;
}) {
  const hasSubcategorias = categoria.subcategorias && categoria.subcategorias.length > 0;
  const [subcategorias, setSubcategorias] = useState(categoria.subcategorias || []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSubcategorias((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      // Notificar al padre del cambio
      onReorder(newItems, categoria.id);
      
      return newItems;
    });
  };

  if (!hasSubcategorias) {
    return <CategoriaItem categoria={categoria} nivel={nivel} onEdit={onEdit} onDelete={onDelete} />;
  }

  return (
    <AccordionItem value={categoria.id} className="border-none">
      <div className="space-y-2">
        <CategoriaItem categoria={categoria} nivel={nivel} onEdit={onEdit} onDelete={onDelete} />
        
        <AccordionTrigger className="ml-8 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 py-2">
          <span className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            {subcategorias.length} subcategoría{subcategorias.length !== 1 ? 's' : ''}
          </span>
        </AccordionTrigger>
        
        <AccordionContent className="ml-8 space-y-2 pt-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={subcategorias.map(sub => sub.id)}
              strategy={verticalListSortingStrategy}
            >
              <Accordion type="multiple" className="space-y-2">
                {subcategorias.map((sub) => (
                  <CategoriaAccordion
                    key={sub.id}
                    categoria={sub}
                    nivel={nivel + 1}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReorder={onReorder}
                  />
                ))}
              </Accordion>
            </SortableContext>
          </DndContext>
        </AccordionContent>
      </div>
    </AccordionItem>
  );
}

export default function GestorCategoriasNuevo() {
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

  // Construir árbol de categorías
  const arbolCategorias = useMemo(() => {
    return construirArbolCategorias(categorias as any);
  }, [categorias]);

  // Categorías que pueden ser padres (nivel 1 y 2)
  const categoriasPadrePosibles = useMemo(() => {
    return categorias.filter(c => {
      if (categoriaEditando && c.id === categoriaEditando.id) return false;
      return c.nivel === 1 || c.nivel === 2;
    });
  }, [categorias, categoriaEditando]);

  // Calcular nivel automáticamente
  const nivelCalculado = useMemo(() => {
    if (!formData.parent_id) return 1;
    const padre = categorias.find(c => c.id === formData.parent_id);
    return padre ? (padre.nivel || 1) + 1 : 1;
  }, [formData.parent_id, categorias]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCategorias((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleReorder = async (items: CategoriaArbol[], parentId: string | null) => {
    try {
      // Actualizar orden en el servidor
      const updates = items.map((item, index) => ({
        id: item.id,
        orden: index,
      }));

      await fetch('/api/admin/foro/categorias/reordenar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      toast.success('Orden actualizado');
      refetch();
    } catch (error) {
      console.error('Error al reordenar:', error);
      toast.error('Error al actualizar el orden');
    }
  };

  const handleAbrirFormulario = (categoria?: Categoria) => {
    if (categoria) {
      setCategoriaEditando(categoria);
      setFormData({
        nombre: categoria.nombre,
        slug: categoria.slug,
        descripcion: categoria.descripcion || '',
        color: categoria.color || '#3b82f6',
        icono: categoria.icono || '',
        parent_id: categoria.parent_id || null,
        es_activa: categoria.es_activa ?? true,
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
          nivel: nivelCalculado,
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
              Organiza las categorías del foro en hasta 3 niveles de jerarquía
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
        ) : arbolCategorias.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay categorías. Crea una para comenzar.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={arbolCategorias.map(cat => cat.id)}
              strategy={verticalListSortingStrategy}
            >
              <Accordion type="multiple" className="space-y-3">
                {arbolCategorias.map((categoria) => (
                  <CategoriaAccordion
                    key={categoria.id}
                    categoria={categoria}
                    nivel={1}
                    onEdit={handleAbrirFormulario}
                    onDelete={setDialogEliminar}
                    onReorder={handleReorder}
                  />
                ))}
              </Accordion>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      {/* Dialog para crear/editar categoría */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => {
                    const nombre = e.target.value;
                    setFormData({ 
                      ...formData, 
                      nombre,
                      slug: generarSlug(nombre)
                    });
                  }}
                  placeholder="Ej: Discusión General"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="discusion-general"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción de la categoría..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3b82f6"
                  />
                </div>
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
                    const parentId = value === 'none' ? null : value;
                    setFormData({ ...formData, parent_id: parentId });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ninguna (Principal)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">📁 Ninguna (Principal - Nivel 1)</SelectItem>
                    {categoriasPadrePosibles.map((cat) => {
                      if (!cat || !cat.id || !cat.nombre) return null;
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

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Switch
                    id="activa"
                    checked={formData.es_activa}
                    onCheckedChange={(checked) => setFormData({ ...formData, es_activa: checked })}
                  />
                  <Label htmlFor="activa" className="cursor-pointer">Categoría activa</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Las categorías inactivas no se mostrarán en el foro
                </p>
              </div>
              <Badge className="bg-blue-500 text-white">
                Nivel {nivelCalculado}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar}>
              {categoriaEditando ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={!!dialogEliminar} onOpenChange={() => setDialogEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la categoría y todas sus subcategorías.
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
