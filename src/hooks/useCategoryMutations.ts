'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UpdateCategoryData {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  color?: string;
  icono?: string;
}

interface CreateCategoryData {
  nombre: string;
  slug: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  parent_id: string;
  nivel: number;
}

interface DeleteCategoryData {
  id: string;
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  // Mutación para renombrar/actualizar categoría
  const updateCategory = useMutation({
    mutationFn: async (data: UpdateCategoryData) => {
      const response = await fetch(`/api/admin/foro/categorias?id=${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar la categoría');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar la query de categorías para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['foro-categorias'] });
      toast.success('Categoría actualizada correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar la categoría');
    },
  });

  // Mutación para crear subcategoría
  const createSubcategory = useMutation({
    mutationFn: async (data: CreateCategoryData) => {
      const response = await fetch('/api/admin/foro/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          es_activa: true,
          orden: 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear la subcategoría');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foro-categorias'] });
      toast.success('Subcategoría creada correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la subcategoría');
    },
  });

  // Mutación para eliminar categoría
  const deleteCategory = useMutation({
    mutationFn: async (data: DeleteCategoryData) => {
      const response = await fetch(`/api/admin/foro/categorias?id=${data.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar la categoría');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foro-categorias'] });
      toast.success('Categoría eliminada correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar la categoría');
    },
  });

  return {
    updateCategory,
    createSubcategory,
    deleteCategory,
  };
}
