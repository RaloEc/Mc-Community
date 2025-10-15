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

    // Consultar las categorías con sus relaciones jerárquicas
    const { data, error } = await serviceClient
      .from('categorias')
      .select(`
        *,
        subcategorias:categorias!parent_id(
          *,
          subcategorias:categorias!parent_id(*)
        )
      `)
      .is('parent_id', null) // Solo obtener las categorías raíz
      .order('orden');
      
    // Mapear los campos al formato esperado por el CategorySelector
    const categoriasMapeadas = (data || []).map(cat => ({
      ...cat,
      parent_id: cat.categoria_padre_id,
      // Mapear subcategorías a la propiedad 'subcategories' que espera el componente
      subcategories: (cat.subcategorias || []).map(sub => ({
        ...sub,
        parent_id: sub.categoria_padre_id,
        // Mapear sub-subcategorías si existen
        subcategories: sub.subcategorias || []
      }))
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

    // Primero, crear un mapa con todas las categorías
    const categoriasMap = new Map<string, CategoriaConHijos>();
    const categoriasRaiz: CategoriaConHijos[] = [];

    // Crear un mapa de categorías sin hijos primero
    categoriasFiltradas.forEach((categoria: Categoria & { parent_id: string | null }) => {
      categoriasMap.set(categoria.id, { 
        ...categoria,
        categoria_padre_id: categoria.parent_id,
        hijos: []
      });
    });

    // Construir la jerarquía
    categoriasFiltradas.forEach((categoria: Categoria & { parent_id: string | null }) => {
      const categoriaActual = categoriasMap.get(categoria.id);
      if (!categoriaActual) return;
      
      if (categoria.parent_id && categoriasMap.has(categoria.parent_id)) {
        // Es una subcategoría, añadirla a su padre
        const padre = categoriasMap.get(categoria.parent_id);
        if (padre && padre.hijos) {
          // Crear una copia de la categoría para evitar problemas de referencia
          padre.hijos.push({
            ...categoriaActual,
            hijos: [] // Inicializar hijos como array vacío
          });
        }
      } else {
        // Es una categoría raíz
        categoriasRaiz.push({
          ...categoriaActual,
          hijos: [] // Inicializar hijos como array vacío
        });
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
