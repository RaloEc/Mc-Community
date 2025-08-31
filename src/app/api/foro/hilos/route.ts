import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/utils/supabase-service';

// Interfaces para tipar correctamente los datos
interface Autor {
  username?: string;
  role?: string;
  avatar_url?: string;
}

interface Categoria {
  nombre?: string;
  slug?: string;
  color?: string;
}

interface HiloForo {
  id: string;
  titulo: string;
  contenido?: string;
  autor_id?: string;
  created_at: string;
  ultimo_post_at?: string;
  vistas?: number;
  votos_conteo: any;
  respuestas_conteo: any;
  autor?: Autor;
  categoria?: Categoria;
}

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const url = new URL(request.url);
    const tipo = url.searchParams.get('tipo') || 'destacados';
    const buscar = url.searchParams.get('buscar') || '';
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    const categoriaSlug = url.searchParams.get('categoriaSlug') || null;
    
    // Usar el cliente de servicio para evitar problemas de RLS
    const supabase = getServiceClient();
    
    // Si tenemos categoriaSlug, resolvemos el ID de la categoría
    let categoriaId: string | null = null;
    if (categoriaSlug) {
      // Verificar si es un UUID válido
      if (categoriaSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        categoriaId = categoriaSlug;
      } else {
        // Buscar por slug
        const { data: categoria } = await supabase
          .from('foro_categorias')
          .select('id')
          .eq('slug', categoriaSlug)
          .single();
        
        if (categoria) {
          categoriaId = categoria.id;
        }
      }
    }
    
    // Base select para hilos
    const baseSelect = `
      id, 
      titulo, 
      contenido,
      autor_id,
      created_at,
      ultimo_post_at,
      vistas,
      votos_conteo:foro_votos_hilos(count),
      respuestas_conteo:foro_posts(count),
      autor:perfiles!autor_id(username, role, avatar_url),
      categoria:foro_categorias!categoria_id(nombre, slug, color)
    `;

    let query = supabase.from('foro_hilos').select(baseSelect);

    // Filtrar por categoría si se especificó
    if (categoriaId) {
      query = query.eq('categoria_id', categoriaId);
    }

    // Aplicar búsqueda si se especificó
    if (buscar) {
      query = query.or(`titulo.ilike.%${buscar}%,contenido.ilike.%${buscar}%,perfiles!autor_id(username).ilike.%${buscar}%`);
    }

    // Configurar la consulta según el tipo
    switch (tipo) {
      case 'destacados':
        // Hilos con más votos y respuestas (combinamos ambos criterios)
        query = query.order('votos_conteo', { ascending: false });
        break;
      case 'recientes':
        // Hilos más recientes
        query = query.order('created_at', { ascending: false });
        break;
      case 'sin_respuestas':
        // Hilos sin respuestas
        query = query.eq('respuestas_conteo', 0).order('created_at', { ascending: false });
        break;
      default:
        // Por defecto, mostrar los más recientes
        query = query.order('created_at', { ascending: false });
    }

    // Limitar resultados
    const { data, error } = await query.limit(limit);

    if (error) {
      console.error('Error al obtener hilos del foro:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener hilos del foro',
        errorDetails: error.message
      }, { status: 500 });
    }

    // Normalizar los conteos y estructurar los datos para el frontend
    let hilosNormalizados = data?.map((hilo: any) => {
      const votos = Array.isArray(hilo.votos_conteo) 
        ? (hilo.votos_conteo[0]?.count ?? 0) 
        : (hilo.votos_conteo as any)?.count ?? 0;
      
      const respuestas = Array.isArray(hilo.respuestas_conteo) 
        ? (hilo.respuestas_conteo[0]?.count ?? 0) 
        : (hilo.respuestas_conteo as any)?.count ?? 0;
      
      // Asegurar que los datos del autor estén en el formato esperado
      const autor = {
        username: hilo.autor?.username || 'Anónimo',
        avatar_url: hilo.autor?.avatar_url,
        rol: hilo.autor?.role // Mapear 'role' a 'rol' para el frontend
      };
      
      // Asegurar que los datos de categoría estén en el formato esperado
      const categoria = hilo.categoria ? {
        nombre: hilo.categoria.nombre || 'Sin categoría',
        slug: hilo.categoria.slug || '',
        color: hilo.categoria.color || '#3b82f6'
      } : undefined;
      
      return { 
        ...hilo, 
        votos_conteo: votos, 
        respuestas_conteo: respuestas,
        autor,
        categoria
      };
    }) || [];
    
    // Verificar si hay IDs duplicados
    const idsMap = new Map();
    const duplicados: string[] = [];
    hilosNormalizados.forEach(hilo => {
      if (idsMap.has(hilo.id)) {
        duplicados.push(hilo.id);
      } else {
        idsMap.set(hilo.id, true);
      }
    });
    
    if (duplicados.length > 0) {
      console.warn('¡ATENCIÓN! Se encontraron IDs duplicados en los hilos:', duplicados);
      
      // Eliminar duplicados manteniendo solo la primera aparición de cada ID
      const hilosSinDuplicados = [];
      const idsVistos = new Set();
      
      for (const hilo of hilosNormalizados) {
        if (!idsVistos.has(hilo.id)) {
          hilosSinDuplicados.push(hilo);
          idsVistos.add(hilo.id);
        }
      }
      
      hilosNormalizados = hilosSinDuplicados;
    }

    return NextResponse.json({ 
      success: true, 
      items: hilosNormalizados,
      _debug: {
        hasDuplicates: duplicados.length > 0,
        duplicateIds: duplicados,
        originalCount: data?.length || 0,
        finalCount: hilosNormalizados.length
      }
    });
  } catch (error) {
    console.error('Error en API de foros:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
