/**
 * Gestor de Categorías del Foro - Versión Refactorizada
 * Soporta hasta 3 niveles de jerarquía con un componente recursivo.
 */

"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useValidatedCategories,
  type CategoriaForo,
} from "@/hooks/useValidatedCategories";
import {
  construirArbolCategorias,
  type CategoriaArbol,
  type CategoriaPlana,
} from "@/lib/foro/categorias-utils";
import { FolderOpen, Plus, Edit, Trash2, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type Categoria = Omit<CategoriaForo, "id"> & {
  id: string;
  orden: number;
  total_hilos: number;
};

interface CategoriaFormData {
  nombre: string;
  slug: string;
  descripcion: string;
  icono: string;
  parent_id: string | null;
  es_activa: boolean;
}

// Componente helper para mostrar la información de la categoría
function CategoriaItemDisplay({ categoria }: { categoria: CategoriaArbol }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <h4 className="font-medium truncate">{categoria.nombre}</h4>
        {!categoria.es_activa && (
          <Badge variant="outline" className="text-xs">
            Inactiva
          </Badge>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">
        <span>{categoria.total_hilos || 0} hilos</span>
      </div>
    </div>
  );
}

// Componente helper para mostrar los botones de acción
function CategoriaItemActions({
  categoria,
  nivel,
  onEdit,
  onDelete,
  onCreateSubcategoria,
}: {
  categoria: CategoriaArbol;
  nivel: number;
  onEdit: (cat: Categoria) => void;
  onDelete: (id: string) => void;
  onCreateSubcategoria: (parentId: string) => void;
}) {
  const canCreateSubcategoria = nivel < 3;

  const handleActionClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    e.stopPropagation(); // Prevenir que el acordeón se abra/cierre
    action();
  };

  return (
    <div className="flex-shrink-0 flex items-center gap-1">
      {/* Placeholder para el chevron del acordeón (siempre presente) */}
      <div className="w-4 h-7 flex-shrink-0" />
      
      {/* Botón de añadir subcategoría o placeholder */}
      <div className="w-7 h-7 flex-shrink-0">
        {canCreateSubcategoria ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary hover:text-primary"
            onClick={(e) =>
              handleActionClick(e, () => onCreateSubcategoria(categoria.id))
            }
            title="Crear subcategoría"
          >
            <Plus className="h-4 w-4" />
          </Button>
        ) : (
          <div className="w-7 h-7" />
        )}
      </div>
      
      {/* Botón de editar */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={(e) =>
          handleActionClick(e, () => onEdit(categoria as Categoria))
        }
        title="Editar categoría"
      >
        <Edit className="h-4 w-4" />
      </Button>
      
      {/* Botón de eliminar */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={(e) => handleActionClick(e, () => onDelete(categoria.id))}
        title="Eliminar categoría"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Componente recursivo unificado
function CategoriaItemRecursivo({
  categoria,
  nivel = 1,
  onEdit,
  onDelete,
  onCreateSubcategoria,
  userColor,
}: {
  categoria: CategoriaArbol;
  nivel?: number;
  onEdit: (cat: Categoria) => void;
  onDelete: (id: string) => void;
  onCreateSubcategoria: (parentId: string) => void;
  userColor?: string | null;
}) {
  const hasSubcategorias =
    categoria.subcategorias && categoria.subcategorias.length > 0;
  const finalUserColor = userColor || '#3b82f6';

  // Contenedor común para ambos casos
  const containerContent = (
    <>
      {/* Contenido principal - Ocupa el espacio disponible */}
      <div className="flex-1 flex items-center gap-2">
        <CategoriaItemDisplay categoria={categoria} />
        {/* Placeholder invisible para alinear con el chevron en items padre */}
        {!hasSubcategorias && <div className="w-4 h-4 flex-shrink-0" />}
      </div>
      {/* Botones de acción - Alineados a la derecha */}
      <CategoriaItemActions
        categoria={categoria}
        nivel={nivel}
        onEdit={onEdit}
        onDelete={onDelete}
        onCreateSubcategoria={onCreateSubcategoria}
      />
    </>
  );

  // --- Caso 1: Nodo Hoja (Sin subcategorías) ---
  if (!hasSubcategorias) {
    return (
      <div 
        className="flex items-center gap-2 px-3 py-2 rounded-lg group transition-colors"
        style={{
          backgroundColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          if (finalUserColor) {
            e.currentTarget.style.backgroundColor = `${finalUserColor}10`;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {containerContent}
      </div>
    );
  }

  // --- Caso 2: Nodo Padre (Con subcategorías) ---
  
  return (
    <AccordionItem value={categoria.id} className="border-none">
      <div 
        className="flex items-center gap-2 px-3 py-2 rounded-lg group transition-colors"
        style={{
          backgroundColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          if (finalUserColor) {
            e.currentTarget.style.backgroundColor = `${finalUserColor}10`;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {/* Contenido principal - Ocupa el espacio disponible */}
        <div className="flex-1 flex items-center gap-2">
          <CategoriaItemDisplay categoria={categoria} />
        </div>
        
        {/* Botones de acción */}
        <CategoriaItemActions
          categoria={categoria}
          nivel={nivel}
          onEdit={onEdit}
          onDelete={onDelete}
          onCreateSubcategoria={onCreateSubcategoria}
        />
        
        {/* Divisor vertical */}
        <div className="w-px h-6 bg-border" />
        
        {/* Chevron del acordeón a la derecha */}
        <AccordionTrigger className="p-0 hover:no-underline [&[data-state=open]>svg]:rotate-180 ml-2">
          <div className="flex items-center">
            {/* El SVG del chevron se renderiza automáticamente */}
          </div>
        </AccordionTrigger>
      </div>
      <AccordionContent className="pl-6 pt-1 space-y-1">
        {/* Renderiza los hijos dentro de su propio acordeón */}
        <Accordion type="multiple" className="space-y-1">
          {categoria.subcategorias.map((sub) => (
            <CategoriaItemRecursivo
              key={sub.id}
              categoria={sub}
              nivel={nivel + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateSubcategoria={onCreateSubcategoria}
              userColor={userColor}
            />
          ))}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function GestorCategoriasNuevo() {
  const { profile } = useAuth();
  const {
    data: categoriasData,
    refetch,
    isLoading,
    error,
  } = useValidatedCategories();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(
    null
  );
  const [dialogEliminar, setDialogEliminar] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoriaFormData>({
    nombre: "",
    slug: "",
    descripcion: "",
    icono: "",
    parent_id: null,
    es_activa: true,
  });

  // Actualizar categorías cuando cambian los datos
  React.useEffect(() => {
    if (categoriasData && Array.isArray(categoriasData)) {
      const categoriasConOrden: Categoria[] = categoriasData
        .filter((c) => !!(c as any).id)
        .map((cat, index) => ({
          ...(cat as any),
          id: String((cat as any).id),
          orden: (cat as any).orden ?? index,
          total_hilos: (cat as any).total_hilos ?? 0,
        }));
      setCategorias(categoriasConOrden);
    }
  }, [categoriasData]);

  // Construir árbol de categorías y ordenar alfabéticamente
  const arbolCategorias = useMemo(() => {
    const sortTree = (nodes: CategoriaArbol[] = []): CategoriaArbol[] => {
      const ordenados = [...nodes]
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map((n) => ({
          ...n,
          subcategorias: n.subcategorias ? sortTree(n.subcategorias) : [],
        }));
      return ordenados;
    };
    // Adaptar a CategoriaPlana estricta
    const planas: CategoriaPlana[] = categorias
      .filter((c) => !!c && !!c.id && !!c.nombre && !!c.slug)
      .map((c) => ({
        id: c.id,
        nombre: c.nombre as string,
        slug: c.slug as string,
        descripcion: c.descripcion ?? null,
        color: undefined,
        icono: c.icono ?? null,
        parent_id: c.parent_id ?? null,
        nivel: c.nivel,
        orden: c.orden,
        es_activa: c.es_activa,
        total_hilos: c.total_hilos,
      }));
    const base = construirArbolCategorias(planas) || [];
    return sortTree(base);
  }, [categorias]);

  // Categorías que pueden ser padres (nivel 1 y 2)
  const categoriasPadrePosibles = useMemo(() => {
    return categorias.filter((c) => {
      if (categoriaEditando && c.id === categoriaEditando.id) return false;
      return c.nivel === 1 || c.nivel === 2;
    });
  }, [categorias, categoriaEditando]);

  // Calcular nivel automáticamente
  const nivelCalculado = useMemo(() => {
    if (!formData.parent_id) return 1;
    const padre = categorias.find((c) => c.id === formData.parent_id);
    return padre ? (padre.nivel || 1) + 1 : 1;
  }, [formData.parent_id, categorias]);

  // Sin drag & drop ni reordenamiento manual. El orden es alfabético.

  const handleAbrirFormulario = (categoria?: Categoria) => {
    if (categoria) {
      setCategoriaEditando(categoria);
      setFormData({
        nombre: categoria.nombre,
        slug: categoria.slug,
        descripcion: categoria.descripcion || "",
        icono: "",
        parent_id: categoria.parent_id || null,
        es_activa: categoria.es_activa ?? true,
      });
    } else {
      setCategoriaEditando(null);
      setFormData({
        nombre: "",
        slug: "",
        descripcion: "",
        icono: "",
        parent_id: null,
        es_activa: true,
      });
    }
    setDialogAbierto(true);
  };

  const handleCreateSubcategoria = (parentId: string) => {
    setCategoriaEditando(null);
    setFormData({
      nombre: "",
      slug: "",
      descripcion: "",
      icono: "",
      parent_id: parentId,
      es_activa: true,
    });
    setDialogAbierto(true);
  };

  const handleGuardar = async () => {
    try {
      const url = categoriaEditando
        ? `/api/admin/foro/categorias?id=${categoriaEditando.id}`
        : "/api/admin/foro/categorias";

      const response = await fetch(url, {
        method: categoriaEditando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          nivel: nivelCalculado,
          // orden calculado en backend o ignorado; UI usa orden alfabético
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar");
      }

      toast.success(
        categoriaEditando ? "Categoría actualizada" : "Categoría creada"
      );
      setDialogAbierto(false);
      refetch();
    } catch (error: any) {
      console.error("Error al guardar categoría:", error);
      toast.error(error.message || "Error al guardar la categoría");
    }
  };

  const handleEliminar = async () => {
    if (!dialogEliminar) return;

    try {
      const response = await fetch(
        `/api/admin/foro/categorias?id=${dialogEliminar}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar");
      }

      toast.success("Categoría eliminada correctamente");
      setDialogEliminar(null);
      refetch();
    } catch (error: any) {
      console.error("Error al eliminar categoría:", error);
      toast.error(error.message || "Error al eliminar la categoría");
    }
  };

  const generarSlug = (nombre: string) => {
    return nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
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
              Organiza las categorías del foro en hasta 3 niveles (orden
              alfabético)
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
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Cargando categorías...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Error al cargar las categorías</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "Error desconocido"}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : !arbolCategorias || arbolCategorias.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay categorías. Crea una para comenzar.
            </p>
            <Button onClick={() => handleAbrirFormulario()}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera categoría
            </Button>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-1">
            {arbolCategorias.map((categoria) => (
              <CategoriaItemRecursivo
                key={categoria.id}
                categoria={categoria}
                nivel={1}
                onEdit={handleAbrirFormulario}
                onDelete={setDialogEliminar}
                onCreateSubcategoria={handleCreateSubcategoria}
                userColor={profile?.color}
              />
            ))}
          </Accordion>
        )}
      </CardContent>

      {/* Dialog para crear/editar categoría */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {categoriaEditando ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
                    slug: generarSlug(nombre),
                  });
                }}
                placeholder="Ej: Discusión General"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                placeholder="Descripción de la categoría..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Categoría Padre (Opcional)</Label>
              <Select
                value={formData.parent_id || "none"}
                onValueChange={(value) => {
                  const parentId = value === "none" ? null : value;
                  setFormData({ ...formData, parent_id: parentId });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ninguna (Principal)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    📁 Ninguna (Principal - Nivel 1)
                  </SelectItem>
                  {categoriasPadrePosibles.map((cat) => {
                    if (!cat || !cat.id || !cat.nombre) return null;
                    const nivelEmoji = cat.nivel === 1 ? "📁" : "📂";
                    const indent = cat.nivel === 2 ? "  ↳ " : "";

                    return (
                      <SelectItem
                        key={cat.id}
                        value={cat.id}
                        className={cat.nivel === 2 ? "pl-6" : ""}
                      >
                        {indent}
                        {nivelEmoji} {cat.nombre} (Nivel {cat.nivel})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Switch
                    id="activa"
                    checked={formData.es_activa}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, es_activa: checked })
                    }
                  />
                  <Label htmlFor="activa" className="cursor-pointer font-medium">
                    {formData.es_activa ? "Categoría activa" : "Categoría inactiva"}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-9">
                  {formData.es_activa
                    ? "Se mostrará en el foro"
                    : "No se mostrará en el foro"}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Nivel {nivelCalculado}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar}>
              {categoriaEditando ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog
        open={!!dialogEliminar}
        onOpenChange={() => setDialogEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la categoría y
              todas sus subcategorías.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
