"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useUserTheme } from '@/hooks/useUserTheme';
import type { Database } from '@/lib/database.types';
import TiptapEditor from '@/components/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CategorySelector, type Category } from '@/components/foro/CategorySelector';

type CategoriaForo = Database['public']['Tables']['foro_categorias']['Row'] & {
  subcategorias?: CategoriaForo[];
};

interface CrearHiloFormProps {
  categorias: CategoriaForo[];
  userId: string;
}

// Mantenemos la exportación nombrada para compatibilidad
export function CrearHiloForm({ categorias }: CrearHiloFormProps) {
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [categoriaId, setCategoriaId] = useState<string>(''); // Este será el UUID
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { userColor } = useUserTheme();
  
  // Convertir categorías al formato esperado por CategorySelector (recursivo para 3 niveles)
  const formatCategory = (cat: CategoriaForo): Category => ({
    id: cat.id,
    nombre: cat.nombre,
    color: cat.color || undefined,
    subcategories: cat.subcategorias?.map(formatCategory),
  });

  const formattedCategories: Category[] = useMemo(() => {
    return categorias.map(formatCategory);
  }, [categorias]);

  // Función recursiva para encontrar una categoría por ID (soporta 3 niveles)
  const findCategoryById = (id: string, categories: Category[] = formattedCategories): Category | null => {
    for (const cat of categories) {
      if (cat.id === id) return cat;
      if (cat.subcategories) {
        const found = findCategoryById(id, cat.subcategories);
        if (found) return found;
      }
    }
    return null;
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setCategoriaId(category.id);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Debes iniciar sesión para crear un hilo.');
      return;
    }
    if (!titulo.trim() || !contenido.trim() || !categoriaId) {
      toast.error('Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/foro/crear-hilo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          titulo,
          contenido,
          categoria_id: categoriaId, // Enviar el UUID directamente
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el hilo.');
      }

      const nuevoHilo = await response.json();
      toast.success('¡Hilo creado con éxito!');
      router.push(`/foro/hilos/${nuevoHilo.id}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

    if (!isClient) {
    return <div className='text-center p-8'>Cargando...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-8 bg-white p-6 rounded-lg shadow-md dark:bg-card/80">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-foreground">Acceso Restringido</h2>
        <p className='mb-4 text-gray-700 dark:text-muted-foreground'>Debes iniciar sesión para poder crear un nuevo hilo.</p>
        <Button onClick={() => router.push('/login?redirect=/foro/crear-hilo')}>
          Ir a Iniciar Sesión
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-transparent p-6 px-0 rounded-lg shadow-sm dark:shadow-none">
      <div className="space-y-1">
        <label htmlFor="titulo" className="text-sm font-medium text-gray-900 dark:text-foreground">Título del Hilo</label>
        <div className="relative">
          <Input
            id="titulo"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Escribe un título claro y conciso"
            maxLength={100}
            required
            className="transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              '--tw-ring-color': userColor,
              '--tw-ring-opacity': '0.1',
              '--tw-ring-offset-width': '0.1px',
              '--tw-ring-offset-color': 'hsl(var(--background))',
            } as React.CSSProperties}
          />
          {titulo.length > 0 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {titulo.length}/100
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-900 dark:text-foreground">Contenido</label>
        <div className="min-h-[300px] rounded-md border border-gray-200 dark:border-input bg-white dark:bg-transparent p-2">
          <TiptapEditor
            value={contenido}
            onChange={setContenido}
            placeholder="Escribe el contenido de tu hilo aquí..."
            userColor={userColor}
          />
        </div>
      </div>
      
      <div className="mb-6">
        <label htmlFor="categoria" className="block text-sm font-medium text-foreground mb-2">
          Categoría
        </label>
        <div className="bg-card dark:bg-black/80 border border-border rounded-md p-4 max-h-[400px] overflow-y-auto shadow-sm">
          {selectedCategory && (
            <div className="mb-4 pb-3 border-b border-border/50">
              <p className="text-sm text-muted-foreground mb-1">Categoría seleccionada:</p>
              <div className="flex items-center">
                {selectedCategory.color && (
                  <div 
                    className="w-2 h-2 rounded-full mr-2 flex-shrink-0" 
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                )}
                <span className="font-medium text-foreground truncate">
                  {selectedCategory.nombre}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={() => {
                    setSelectedCategory(null);
                    setCategoriaId('');
                  }}
                >
                  Cambiar
                </Button>
              </div>
            </div>
          )}
          
          {!selectedCategory && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Selecciona una categoría:</p>
              <CategorySelector
                categories={formattedCategories}
                selectedCategoryId={categoriaId}
                onSelectCategory={handleCategorySelect}
              />
            </div>
          )}
        </div>
        {categoriaId === '' && (
          <p className="text-red-500 text-sm mt-1">Debes seleccionar una categoría</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Publicando...' : 'Publicar Hilo'}
        </Button>
      </div>
    </form>
  );
}

// Añadimos la exportación por defecto para solucionar el error de compilación
export default CrearHiloForm;
