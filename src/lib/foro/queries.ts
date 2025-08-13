import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

type CategoriaForo = Database['public']['Tables']['foro_categorias']['Row'] & {
  subcategorias?: CategoriaForo[];
};
import { unstable_noStore as noStore } from 'next/cache';

export async function getForoCategorias(): Promise<CategoriaForo[]> {
  noStore();
  const supabase = createClient();

  const { data, error } = await supabase
    .from('foro_categorias')
    .select('*')
    .eq('es_activa', true)
    .order('nivel', { ascending: true })
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error fetching foro categorias:', error);
    return [];
  }

  // Organizar categorías en estructura jerárquica
  const categoriasMap = new Map();
  const categoriasRaiz = [];

  // Primero, almacenar todas las categorías en un mapa por ID
  data?.forEach(cat => categoriasMap.set(cat.id, { ...cat, subcategorias: [] }));

  // Luego, organizar en estructura jerárquica
  data?.forEach(cat => {
    if (cat.parent_id && categoriasMap.has(cat.parent_id)) {
      // Es una subcategoría, añadirla a su categoría padre
      const padre = categoriasMap.get(cat.parent_id);
      padre.subcategorias.push(categoriasMap.get(cat.id));
    } else {
      // Es una categoría raíz
      categoriasRaiz.push(categoriasMap.get(cat.id));
    }
  });

  return categoriasRaiz || [];
}
