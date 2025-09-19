'use client';

import { useEffect, useState } from 'react';
import CrearHiloForm from '@/components/foro/CrearHiloForm';
import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { useUserTheme } from '@/hooks/useUserTheme';

export default function CrearHiloPage() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();
  const { getThemeAdjustedBorderColor } = useUserTheme();
  const borderStyle = getThemeAdjustedBorderColor(0.5);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        redirect('/login?message=Debes iniciar sesión para crear un hilo.');
        return;
      }
      
      setUserId(user.id);

      // Obtener todas las categorías con datos completos
      const { data: categoriasPlanas, error } = await supabase
        .from('foro_categorias')
        .select('id, nombre, descripcion, color, parent_id, nivel, orden, icono')
        .order('orden', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        setLoading(false);
        return;
      }
      
      // Convertir la lista plana en estructura jerárquica
      const categoriasMap = {};
      const categoriasJerarquicas = [];
      
      // Primero crear un mapa de todas las categorías
      if (categoriasPlanas) {
        categoriasPlanas.forEach(cat => {
          categoriasMap[cat.id] = {
            ...cat,
            hijos: []
          };
        });
        
        // Luego organizar en estructura jerárquica
        categoriasPlanas.forEach(cat => {
          if (cat.parent_id && categoriasMap[cat.parent_id]) {
            // Es una subcategoría, agregar a su padre
            categoriasMap[cat.parent_id].hijos.push(categoriasMap[cat.id]);
          } else {
            // Es categoría principal
            categoriasJerarquicas.push(categoriasMap[cat.id]);
          }
        });
      }

      setCategorias(categoriasJerarquicas);
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl py-1 px-0 sm:px-6 lg:px-8">
        <div className="backdrop-blur-md border border-gray-700/50 rounded-lg shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-0 px-0 sm:px-6 lg:px-8">
      <div 
        className="backdrop-blur-md rounded-lg shadow-lg p-6"
        style={{
          border: '1px solid',
          ...borderStyle
        }}
      >
        <h1 
          className="text-3xl font-bold text-gray-900 dark:text-foreground mb-1 pb-2"
          style={{ borderBottom: `2px solid ${borderStyle.borderColor}`, borderColor: borderStyle.borderColor }}
        >
          Crear Nuevo Hilo
        </h1>
        <CrearHiloForm categorias={categorias} userId={userId} />
      </div>
    </div>
  );
}
