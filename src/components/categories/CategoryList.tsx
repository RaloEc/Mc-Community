'use client';

import { CategoryItem } from "@/components/categories/CategoryItem";

// Estructura de datos de categoría
export interface Category {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string | null;
  color?: string | null;
  icono?: string | null;
  parent_id: string | null;
  nivel: number;
  orden: number;
  es_activa: boolean;
  total_hilos?: number;
  children?: Category[];
}

interface CategoryListProps {
  categories: Category[];
  onRefetch?: () => void;
}

export const CategoryList = ({ categories, onRefetch }: CategoryListProps) => {
  // Filtramos solo las categorías principales (sin padre)
  const topLevelCategories = categories.filter((cat) => !cat.parent_id || cat.nivel === 1);

  if (topLevelCategories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hay categorías creadas.</p>
        <p className="text-sm mt-2">Crea una categoría principal para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {topLevelCategories.map((category) => (
        <CategoryItem 
          key={category.id} 
          category={category} 
          level={1}
          onRefetch={onRefetch}
        />
      ))}
    </div>
  );
};
