"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/lib/database.types';

type CategoriaForo = Database['public']['Tables']['foro_categorias']['Row'] & {
  subcategorias?: CategoriaForo[];
};
import TiptapEditor from '@/components/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface CrearHiloFormProps {
  categorias: CategoriaForo[];
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
        <label htmlFor="categoria" className="text-sm font-medium">Categoría</label>
        <Select onValueChange={setCategoriaId} value={categoriaId}>
          <SelectTrigger id="categoria">
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categorias.map((cat) => (
              <SelectGroup key={cat.id}>
                <SelectLabel className="flex items-center gap-2 font-bold">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: cat.color || '#3b82f6' }}
                  />
                  {cat.nombre}
                </SelectLabel>
                {/* La categoría principal también es seleccionable */}
                <SelectItem 
                  value={cat.id} 
                  className="pl-6 text-sm flex items-center gap-2"
                >
                   <div 
                      className="w-2 h-2 rounded-full flex-shrink-0 bg-gray-400" 
                    />
                  General
                </SelectItem>

                {/* Subcategorías */}
                {cat.subcategorias?.map((subcat) => (
                  <SelectItem 
                    key={subcat.id} 
                    value={subcat.id}
                    className="pl-6 text-sm flex items-center gap-2"
                  >
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: subcat.color || '#3b82f6' }}
                    />
                    {subcat.nombre}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

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
