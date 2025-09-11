import { NextResponse } from 'next/server';
import { getServiceClient } from '@/utils/supabase-service';
import { Database } from '@/lib/database.types';

type Categoria = Database['public']['Tables']['categorias']['Row'];

// Tipo para categoría con hijos
interface CategoriaConHijos extends Categoria {
  hijos?: CategoriaConHijos[];
}

export async function GET(request: Request) {
  try {
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const plana = searchParams.get('plana') === 'true';
    const tipo = searchParams.get('tipo');
    
    // Obtener el cliente de servicio para saltarse las restricciones RLS
    const serviceClient = getServiceClient();

    // Consultar las categorías usando el cliente de servicio
    const { data, error } = await serviceClient
      .from('categorias')
      .select('*')
      .order('orden');
      
    // Mapear los campos al formato esperado
    const categoriasMapeadas = (data || []).map(cat => ({
      ...cat,
      parent_id: cat.categoria_padre_id
    }));

    if (error) {
      console.error('Error al cargar categorías:', error);
      return NextResponse.json(
        { error: `Error al cargar categorías: ${error.message}` },
        { status: 500 }
      );
    }

    // Filtrar por tipo si se especifica
    let categoriasFiltradas = categoriasMapeadas || [];
    if (tipo) {
      categoriasFiltradas = categoriasFiltradas.filter(cat => cat.tipo === tipo);
    }

    // Si se solicita lista plana, devolver directamente
    if (plana) {
      return NextResponse.json({ 
        success: true, 
        data: categoriasFiltradas as CategoriaConHijos[]
      });
    }

    // Construir estructura jerárquica
    const categoriasMap = new Map<string, CategoriaConHijos>();
    const categoriasRaiz: CategoriaConHijos[] = [];

    // Primero, crear un mapa con todas las categorías
    categoriasFiltradas.forEach((categoria: Categoria & { parent_id: string | null }) => {
      categoriasMap.set(categoria.id, { 
        ...categoria, 
        categoria_padre_id: categoria.parent_id,
        hijos: [] 
      } as CategoriaConHijos);
    });

    // Luego, construir la jerarquía
    categoriasFiltradas.forEach((categoria: Categoria & { parent_id: string | null }) => {
      if (categoria.parent_id && categoriasMap.has(categoria.parent_id)) {
        // Es una subcategoría, añadirla a su padre
        const padre = categoriasMap.get(categoria.parent_id);
        if (padre && padre.hijos) {
          const categoriaHijo = categoriasMap.get(categoria.id);
          if (categoriaHijo) {
            padre.hijos.push(categoriaHijo);
          }
        }
      } else {
        // Es una categoría raíz
        categoriasRaiz.push(categoriasMap.get(categoria.id)!);
      }
    });

    // Ordenar las categorías raíz y sus hijos por el campo orden
    const ordenarCategorias = (categorias: CategoriaConHijos[]) => {
      categorias.sort((a, b) => (a.orden || 0) - (b.orden || 0));
      categorias.forEach(cat => {
        if (cat.hijos && cat.hijos.length > 0) {
          ordenarCategorias(cat.hijos);
        }
      });
      return categorias;
    };

    ordenarCategorias(categoriasRaiz);

    return NextResponse.json({
      success: true,
      data: categoriasRaiz as CategoriaConHijos[]
    });
  } catch (error) {
    console.error('Error al procesar la solicitud de categorías:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
