'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ModCard } from './ModCard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// Usar el cliente singleton de Supabase
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

export function FeaturedMods() {
  const [featuredMods, setFeaturedMods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedMods = async () => {
      try {
        setLoading(true);
        
        // Obtener los 3 mods más descargados usando la estructura correcta de la tabla
        const { data: popularMods, error: popularError } = await supabase
          .from('mods')
          .select('*')
          .order('total_downloads', { ascending: false }) // Nombre correcto de la columna
          .limit(3);

        if (popularError) throw popularError;

        // Obtener los 3 mods más recientes usando la estructura correcta de la tabla
        const { data: recentMods, error: recentError } = await supabase
          .from('mods')
          .select('*')
          .order('date_modified_api', { ascending: false }) // Nombre correcto de la columna
          .limit(3);

        if (recentError) throw recentError;

        // Combinar y eliminar duplicados
        const allMods = [...(popularMods || []), ...(recentMods || [])];
        const uniqueMods = Array.from(new Map(allMods.map(mod => [mod.id, mod])).values());
        
        // Las categorías ya están incluidas en el campo 'categories' como un array
        // No es necesario hacer consultas adicionales
        const modsWithCategories = uniqueMods.slice(0, 4).map(mod => {
          // Transformar las categorías al formato esperado por ModCard
          const formattedCategories = (mod.categories || []).map(categoryName => ({
            id: categoryName,
            nombre: categoryName
          }));
          
          return {
            ...mod,
            categorias: formattedCategories
          };
        });
        
        // Tomar hasta 4 mods únicos con sus categorías
        setFeaturedMods(modsWithCategories);
      } catch (err) {
        console.error('Error al cargar mods destacados:', err);
        setError('No se pudieron cargar los mods destacados. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedMods();
  }, []);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg border p-4 animate-pulse">
            <div className="h-40 bg-muted rounded-md mb-4"></div>
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (featuredMods.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay mods destacados disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredMods && featuredMods.length > 0 && featuredMods
          .filter(mod => mod) // Asegurarse de que el mod no es null/undefined
          .map((mod) => (
            <ModCard key={mod?.id || Math.random()} mod={mod} /> // Usar optional chaining para mod.id y un fallback para la key
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button asChild>
          <Link href="/mods" className="inline-flex items-center">
            Ver todos los mods <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
