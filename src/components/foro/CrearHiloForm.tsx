"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useUserTheme } from '@/hooks/useUserTheme';
import type { Database } from '@/lib/database.types';

type CategoriaForo = Database['public']['Tables']['foro_categorias']['Row'] & {
  hijos?: CategoriaForo[];
};
import TiptapEditor from '@/components/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

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
  const { user } = useAuth();
  const router = useRouter();
  const { userColor } = useUserTheme();
  
  // Estilo personalizado para el input con el color del usuario
  const inputFocusStyle = useMemo(() => ({
    '--ring': userColor,
    '--ring-offset-width': '2px',
    '--ring-offset-color': 'hsl(var(--background))',
    '--ring-offset-shadow': 'var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)',
    '--ring-shadow': 'var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color)',
    '--tw-ring-color': `hsl(${userColor} / var(--tw-ring-opacity, 0.5))`,
    '--tw-ring-opacity': '0.5',
    '--tw-ring-offset-shadow': 'var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)',
    '--tw-ring-shadow': 'var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color)',
    'boxShadow': 'var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)',
  }), [userColor]);
  
  // Estado para controlar categorías expandidas
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Función para alternar la expansión de una categoría
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
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
      router.push(`/foro/hilo/${nuevoHilo.id}`);

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
        <div className="bg-white border border-gray-200 dark:border-border rounded-md p-4 max-h-[300px] overflow-y-auto">
          {categoriaId && (
            <div className="mb-4 pb-2 border-b border-border">
              <p className="text-sm text-gray-600 dark:text-muted-foreground">Categoría seleccionada:</p>
              <div className="flex items-center mt-1">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: categorias.find(c => c.id === categoriaId)?.color || 
                                   categorias.find(c => c.hijos?.some(sc => sc.id === categoriaId))?.hijos?.find(sc => sc.id === categoriaId)?.color || 
                                   '#7c3aed' }}
                />
                <span className="font-medium text-gray-900 dark:text-foreground">
                  {categorias.find(c => c.id === categoriaId)?.nombre || 
                   categorias.find(c => c.hijos?.some(sc => sc.id === categoriaId))?.hijos?.find(sc => sc.id === categoriaId)?.nombre}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto text-gray-500 hover:text-gray-900 dark:text-muted-foreground dark:hover:text-foreground"
                  onClick={() => setCategoriaId('')}
                >
                  Cambiar
                </Button>
              </div>
            </div>
          )}
          
          {!categoriaId && (
            <div>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mb-2">Selecciona una categoría:</p>
              <div className="space-y-2">
                {categorias.map((categoria) => (
                  <div key={categoria.id} className="space-y-1">
                    <div className="flex items-center">
                      {categoria.hijos && categoria.hijos.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-0 h-6 w-6 mr-1"
                          onClick={() => toggleCategory(categoria.id)}
                        >
                          <span className="text-gray-500 dark:text-muted-foreground">
                            {expandedCategories[categoria.id] ? '▼' : '►'}
                          </span>
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        className="justify-start p-2 h-auto w-full text-left"
                        onClick={() => setCategoriaId(categoria.id)}
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: categoria.color || '#7c3aed' }}
                          />
                          <span>{categoria.nombre}</span>
                        </div>
                      </Button>
                    </div>
                    
                    {/* Subcategorías */}
                    {categoria.hijos && categoria.hijos.length > 0 && expandedCategories[categoria.id] && (
                      <div className="ml-6 pl-2 border-l border-gray-700 space-y-1">
                        {categoria.hijos.map((subcat) => (
                          <Button 
                            key={subcat.id}
                            variant="ghost" 
                            className="justify-start p-2 h-auto w-full text-left"
                            onClick={() => setCategoriaId(subcat.id)}
                          >
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: subcat.color || '#7c3aed' }}
                              />
                              <span>{subcat.nombre}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
