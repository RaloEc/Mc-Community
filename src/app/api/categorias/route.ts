import { NextResponse } from 'next/server';
import { getServiceClient } from '@/utils/supabase-service';

export const dynamic = 'force-dynamic'; // Forzar modo dinámico, sin caché
export const revalidate = 0; // No usar caché

// Función para organizar categorías en estructura jerárquica
function organizarCategoriasJerarquicas(categorias) {
  // Mapa para acceso rápido a categorías por ID
  const categoriasMap = {};
  
  // Primero, crear un mapa de todas las categorías
  categorias.forEach(categoria => {
    categoriasMap[categoria.id] = {
      ...categoria,
      subcategorias: []
    };
  });
  
  // Categorías principales (sin parent_id)
  const categoriasPrincipales = [];
  
  // Organizar en estructura jerárquica
  categorias.forEach(categoria => {
    if (categoria.parent_id && categoriasMap[categoria.parent_id]) {
      // Es una subcategoría, añadirla al padre
      categoriasMap[categoria.parent_id].subcategorias.push(categoriasMap[categoria.id]);
    } else {
      // Es una categoría principal
      categoriasPrincipales.push(categoriasMap[categoria.id]);
    }
  });
  
  // Ordenar categorías principales por el campo orden
  categoriasPrincipales.sort((a, b) => (a.orden || 0) - (b.orden || 0));
  
  // Ordenar subcategorías recursivamente
  function ordenarSubcategorias(categorias) {
    categorias.forEach(cat => {
      if (cat.subcategorias && cat.subcategorias.length > 0) {
        cat.subcategorias.sort((a, b) => (a.orden || 0) - (b.orden || 0));
        ordenarSubcategorias(cat.subcategorias);
      }
    });
  }
  
  ordenarSubcategorias(categoriasPrincipales);
  
  return categoriasPrincipales;
}

export async function GET(request) {
  try {
    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const tipo = url.searchParams.get('tipo');
    const plana = url.searchParams.get('plana') === 'true';
    
    // Obtener el cliente de servicio para saltarse las restricciones RLS
    const serviceClient = getServiceClient();

    // Consultar las categorías usando el cliente de servicio
    let query = serviceClient
      .from('categorias')
      .select('id, nombre, tipo, parent_id, slug, descripcion, orden, color, icono');
    
    // Filtrar por tipo si se especifica
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    
    // Ordenar primero por orden y luego por nombre
    const { data, error } = await query.order('orden', { ascending: true }).order('nombre');

    if (error) {
      // En lugar de mostrar un error, devolver un array vacío
      return NextResponse.json({ 
        success: true, 
        data: [] 
      });
    }

    // Devolver las categorías (planas o jerárquicas según el parámetro)
    if (plana) {
      return NextResponse.json({ 
        success: true, 
        data: data || [] 
      });
    } else {
      // Organizar en estructura jerárquica
      const categoriasJerarquicas = organizarCategoriasJerarquicas(data || []);
      return NextResponse.json({ 
        success: true, 
        data: categoriasJerarquicas 
      });
    }
  } catch (error) {
    console.error('Error al procesar la solicitud de categorías:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
