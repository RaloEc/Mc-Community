"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
      <div className="text-center py-8 bg-card p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Acceso Restringido</h2>
        <p className='mb-4'>Debes iniciar sesión para poder crear un nuevo hilo.</p>
        <Button onClick={() => router.push('/login?redirect=/foro/crear-hilo')}>Ir a Iniciar Sesión</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="titulo" className="text-sm font-medium">Título del Hilo</label>
        <Input
          id="titulo"
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Escribe un título claro y conciso"
          maxLength={100}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Contenido</label>
        <div className="min-h-[300px] rounded-md border border-input bg-transparent p-2">
          <TiptapEditor
            value={contenido}
            onChange={setContenido}
            placeholder="Escribe el contenido de tu hilo aquí..."
          />
        </div>
      </div>
      
      <div className="mb-6">
        <label htmlFor="categoria" className="block text-sm font-medium text-gray-200 mb-2">
          Categoría
        </label>
        <div className="bg-gray-800 border border-gray-700 rounded-md p-4 max-h-[300px] overflow-y-auto">
          {categoriaId && (
            <div className="mb-4 pb-2 border-b border-gray-700">
              <p className="text-sm text-gray-400">Categoría seleccionada:</p>
              <div className="flex items-center mt-1">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: categorias.find(c => c.id === categoriaId)?.color || 
                                   categorias.find(c => c.hijos?.some(sc => sc.id === categoriaId))?.hijos?.find(sc => sc.id === categoriaId)?.color || 
                                   '#7c3aed' }}
                />
                <span className="font-medium text-white">
                  {categorias.find(c => c.id === categoriaId)?.nombre || 
                   categorias.find(c => c.hijos?.some(sc => sc.id === categoriaId))?.hijos?.find(sc => sc.id === categoriaId)?.nombre}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto text-gray-400 hover:text-white"
                  onClick={() => setCategoriaId('')}
                >
                  Cambiar
                </Button>
              </div>
            </div>
          )}
          
          {!categoriaId && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Selecciona una categoría:</p>
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
                          <span className="text-gray-400">
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
