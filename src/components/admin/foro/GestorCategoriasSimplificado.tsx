/**
 * Gestor de Categorías Simplificado
 * Lista anidada y expandible con acciones rápidas
 * Optimizado para móviles
 */

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Loader2 } from 'lucide-react';
import { useValidatedCategories } from '@/hooks/useValidatedCategories';
import { construirArbolCategorias } from '@/lib/foro/categorias-utils';
import { CategoryList, type Category } from '@/components/categories/CategoryList';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCategoryMutations } from '@/hooks/useCategoryMutations';

const createCategorySchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  slug: z.string().min(1, 'El slug es requerido').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  color: z.string().optional(),
  icono: z.string().max(2, 'Máximo 2 caracteres').optional(),
});

type CreateCategoryFormData = z.infer<typeof createCategorySchema>;

export default function GestorCategoriasSimplificado() {
  const { data: categoriasData, refetch, isLoading, error } = useValidatedCategories();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const { createSubcategory } = useCategoryMutations();

  // Transformar datos a formato de árbol
  const categoriasArbol = useMemo(() => {
    if (!categoriasData) return [];
    
    // Mapear a formato Category
    const categoriasMapeadas: Category[] = categoriasData.map(cat => ({
      id: cat.id,
      nombre: cat.nombre,
      slug: cat.slug,
      descripcion: cat.descripcion,
      color: cat.color,
      icono: cat.icono,
      parent_id: cat.parent_id,
      nivel: cat.nivel || 1,
      orden: cat.orden || 0,
      es_activa: cat.es_activa ?? true,
      total_hilos: cat.total_hilos || 0,
    }));

    // Construir árbol
    const arbol = construirArbolCategorias(categoriasMapeadas);
    
    // Mapear subcategorias recursivamente
    const mapearSubcategorias = (cats: any[]): Category[] => {
      return cats.map(cat => ({
        ...cat,
        children: cat.subcategorias ? mapearSubcategorias(cat.subcategorias) : undefined,
      }));
    };

    return mapearSubcategorias(arbol);
  }, [categoriasData]);

  // Form para crear categoría principal
  const createForm = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      nombre: '',
      slug: '',
      descripcion: '',
      color: '#3b82f6',
      icono: '📁',
    },
  });

  const generarSlug = (nombre: string) => {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCreateCategory = async (data: CreateCategoryFormData) => {
    await createSubcategory.mutateAsync({
      nombre: data.nombre,
      slug: data.slug,
      descripcion: data.descripcion,
      color: data.color,
      icono: data.icono,
      parent_id: '', // Sin padre = categoría principal
      nivel: 1,
    });
    setCreateDialogOpen(false);
    createForm.reset();
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Gestión de Categorías
            </CardTitle>
            <CardDescription className="mt-2">
              Lista simplificada con acciones rápidas. Optimizada para móviles.
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Error al cargar las categorías</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <CategoryList categories={categoriasArbol} onRefetch={refetch} />
        )}
      </CardContent>

      {/* Dialog para crear categoría principal */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nueva Categoría Principal</DialogTitle>
            <DialogDescription>
              Crea una nueva categoría de nivel 1
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateCategory)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Discusión General" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          createForm.setValue('slug', generarSlug(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <Input placeholder="discusion-general" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL amigable (se genera automáticamente)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descripción de la categoría..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            type="color" 
                            className="w-16 h-10 cursor-pointer"
                            {...field}
                          />
                        </FormControl>
                        <FormControl>
                          <Input 
                            placeholder="#3b82f6"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="icono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icono (emoji)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="📁"
                          maxLength={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={createSubcategory.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createSubcategory.isPending}>
                  {createSubcategory.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Crear Categoría
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
