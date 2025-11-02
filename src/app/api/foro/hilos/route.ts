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

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const url = new URL(request.url);
    const tab = url.searchParams.get('tab') || url.searchParams.get('tipo') || 'recientes';
    const timeRange = url.searchParams.get('timeRange') || '24h';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = 10;
    
    // Parámetros legacy para compatibilidad
    const rawTipo = url.searchParams.get('tipo') || 'destacados';
    const tipo = rawTipo.replace(/-/g, '_');
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
    
    // Función para obtener la fecha según el rango de tiempo
    const getDateFromRange = (range: string): string => {
      const now = new Date();
      const from = new Date(now);
      if (range === "24h") {
        from.setHours(now.getHours() - 24);
      } else {
        from.setDate(now.getDate() - 7);
      }
      return from.toISOString();
    };

    // Base select para hilos con conteos optimizados
    const baseSelect = `
      id, 
      slug,
      titulo, 
      contenido,
      autor_id,
      created_at,
      updated_at,
      ultimo_post_at,
      vistas,
      votos_conteo:foro_votos_hilos(count),
      respuestas_conteo:foro_posts(count),
      autor:perfiles!autor_id(id, username, public_id, role, avatar_url, color),
      categoria:foro_categorias!categoria_id(nombre, slug, color),
      weapon_stats_record:weapon_stats_records!weapon_stats_id( id, weapon_name, stats )
    `;

    let query = supabase.from('foro_hilos').select(baseSelect, { count: 'exact' }).is('deleted_at', null);

    // Filtrar por categoría si se especificó
    if (categoriaId) {
      query = query.eq('categoria_id', categoriaId);
    }

    // Aplicar búsqueda si se especificó
    if (buscar) {
      // Separar las condiciones de búsqueda para evitar problemas de sintaxis
      query = query.or(
        `titulo.ilike.%${buscar}%,contenido.ilike.%${buscar}%`
      );
      
      // Buscar también por nombre de usuario (en una consulta separada)
      try {
        // Primero obtenemos los IDs de autores que coinciden con la búsqueda
        const { data: perfilesCoincidentes } = await supabase
          .from('perfiles')
          .select('id')
          .ilike('username', `%${buscar}%`);
          
        // Si encontramos perfiles coincidentes, añadimos sus IDs a la búsqueda
        if (perfilesCoincidentes && perfilesCoincidentes.length > 0) {
          const autorIds = perfilesCoincidentes.map(p => p.id);
          query = query.or(`autor_id.in.(${autorIds.join(',')})`);
        }
      } catch (error) {
        console.error('Error al buscar perfiles por username:', error);
        // Continuamos con la búsqueda principal aunque falle esta parte
      }
    }

    let items: any[] = [];
    let hasNextPage = false;

    // Configurar la consulta según el tipo/tab
    // Mapear parámetros legacy a los tabs correctos
    let activeTab: string;
    if (tab === 'recientes' || tab === 'populares' || tab === 'sin_respuesta') {
      activeTab = tab;
    } else if (tipo === 'destacados') {
      activeTab = 'populares';
    } else if (tipo === 'sin_respuestas') {
      activeTab = 'sin_respuesta';
    } else {
      activeTab = tipo;
    }

    switch (activeTab) {
      case 'recientes':
        // Si se especifica limit, usarlo directamente (para página principal)
        // Si no, usar paginación (para página del foro)
        if (limit && limit !== 10) {
          query = query.order('created_at', { ascending: false }).limit(limit);
        } else {
          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          query = query.order('created_at', { ascending: false }).range(from, to);
        }
        break;

      case 'populares':
        const fromIso = getDateFromRange(timeRange);
        query = query
          .gte("ultimo_post_at", fromIso)
          .order("updated_at", { ascending: false })
          .limit(limit || 50);
        break;

      case 'mas_votados':
        query = query.order('votos_conteo', { ascending: false }).limit(limit);
        break;

      case 'mas_vistos':
        query = query.order('vistas', { ascending: false }).limit(limit);
        break;

      case 'sin_respuesta':
        query = query.order("created_at", { ascending: false }).limit(limit || 50);
        break;

      default:
        // Por defecto, mostrar los más recientes
        if (limit && limit !== 10) {
          query = query.order('created_at', { ascending: false }).limit(limit);
        } else {
          const defaultFrom = (page - 1) * pageSize;
          const defaultTo = defaultFrom + pageSize - 1;
          query = query.order('created_at', { ascending: false }).range(defaultFrom, defaultTo);
        }
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error al obtener hilos del foro:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener hilos del foro',
        errorDetails: error.message
      }, { status: 500 });
    }

    items = data || [];
    console.log(`[API Hilos] tab=${activeTab}, page=${page}, items=${items.length}, error=${error?.message}`);

    // Procesamiento especial según el tipo de consulta
    if (activeTab === 'populares') {
      // Ordenar por "popularidad" local y paginar si es necesario
      items = items
        .sort((a, b) => {
          const votosA = Array.isArray(a.votos_conteo) ? (a.votos_conteo[0]?.count ?? 0) : (a.votos_conteo as any)?.count ?? 0;
          const votosB = Array.isArray(b.votos_conteo) ? (b.votos_conteo[0]?.count ?? 0) : (b.votos_conteo as any)?.count ?? 0;
          const respuestasA = Array.isArray(a.respuestas_conteo) ? (a.respuestas_conteo[0]?.count ?? 0) : (a.respuestas_conteo as any)?.count ?? 0;
          const respuestasB = Array.isArray(b.respuestas_conteo) ? (b.respuestas_conteo[0]?.count ?? 0) : (b.respuestas_conteo as any)?.count ?? 0;
          
          const scoreA = respuestasA * 2 + votosA;
          const scoreB = respuestasB * 2 + votosB;
          if (scoreB !== scoreA) return scoreB - scoreA;
          return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
        });
      
      // Si se especificó limit, aplicarlo después del ordenamiento
      if (limit && limit !== 10) {
        items = items.slice(0, limit);
      } else {
        // Para paginación, aplicar slice
        items = items.slice((page - 1) * pageSize, page * pageSize);
        hasNextPage = items.length === pageSize;
      }
    } else if (activeTab === 'sin_respuesta') {
      // Filtrar solo los hilos sin respuestas
      items = items.filter((h) => {
        const respuestas = Array.isArray(h.respuestas_conteo) ? (h.respuestas_conteo[0]?.count ?? 0) : (h.respuestas_conteo as any)?.count ?? 0;
        return respuestas === 0;
      });
      
      // Si se especificó limit, aplicarlo
      if (limit && limit !== 10) {
        items = items.slice(0, limit);
      } else {
        // Para paginación, aplicar slice
        items = items.slice((page - 1) * pageSize, page * pageSize);
        hasNextPage = items.length === pageSize;
      }
    } else if (activeTab === 'mas_votados') {
      // Ya está ordenado por votos en la BD, solo aplicar limit
      if (limit && limit !== 10) {
        items = items.slice(0, limit);
      } else {
        items = items.slice((page - 1) * pageSize, page * pageSize);
        hasNextPage = items.length === pageSize;
      }
    } else if (activeTab === 'mas_vistos') {
      // Ya está ordenado por vistas en la BD, solo aplicar limit
      if (limit && limit !== 10) {
        items = items.slice(0, limit);
      } else {
        items = items.slice((page - 1) * pageSize, page * pageSize);
        hasNextPage = items.length === pageSize;
      }
    } else {
      // Para recientes y otros, usar la paginación de la base de datos si no se usó limit
      if (!(limit && limit !== 10)) {
        hasNextPage = (page * pageSize) < (count || 0);
      }
    }

    // Normalizar los conteos y estructurar los datos para el frontend
    let hilosNormalizados = items?.map((hilo: any) => {
      const votos = Array.isArray(hilo.votos_conteo) 
        ? (hilo.votos_conteo[0]?.count ?? 0) 
        : (hilo.votos_conteo as any)?.count ?? 0;
      
      const respuestas = Array.isArray(hilo.respuestas_conteo) 
        ? (hilo.respuestas_conteo[0]?.count ?? 0) 
        : (hilo.respuestas_conteo as any)?.count ?? 0;
      
      // Asegurar que los datos del autor estén en el formato esperado
      const autor = {
        id: hilo.autor?.id ?? null,
        username: hilo.autor?.username || 'Anónimo',
        public_id: hilo.autor?.public_id || null,
        avatar_url: hilo.autor?.avatar_url || null,
        rol: hilo.autor?.role,
        color: hilo.autor?.color || null,
      };
      
      // Asegurar que los datos de categoría estén en el formato esperado
      const categoria = hilo.categoria ? {
        nombre: hilo.categoria.nombre || 'Sin categoría',
        slug: hilo.categoria.slug || '',
        color: hilo.categoria.color || '#3b82f6'
      } : undefined;
      
      let weaponStatsRecord = null as null | {
        id: string;
        weapon_name: string | null;
        stats: any;
      };

      if (hilo.weapon_stats_record) {
        const statsValue = hilo.weapon_stats_record.stats;
        let parsedStats = null;
        if (typeof statsValue === 'string') {
          try {
            parsedStats = JSON.parse(statsValue);
          } catch (err) {
            console.error('Error al parsear stats de arma en API de hilos:', err);
          }
        } else {
          parsedStats = statsValue;
        }

        if (parsedStats) {
          weaponStatsRecord = {
            id: hilo.weapon_stats_record.id,
            weapon_name: hilo.weapon_stats_record.weapon_name ?? null,
            stats: parsedStats,
          };
        }
      }

      return {
        id: hilo.id,
        slug: hilo.slug,
        titulo: hilo.titulo,
        contenido: hilo.contenido,
        autor_id: hilo.autor_id,
        created_at: hilo.created_at,
        updated_at: hilo.updated_at,
        ultimo_post_at: hilo.ultimo_post_at,
        vistas: hilo.vistas || 0,
        votos_conteo: votos,
        respuestas_conteo: respuestas,
        perfiles: autor,
        foro_categorias: categoria,
        weapon_stats_record: weaponStatsRecord
      };
    });

    return NextResponse.json({
      hilos: hilosNormalizados,
      hasNextPage,
      total: items.length
    });

  } catch (error) {
    console.error('Error en API de hilos del foro:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      hilos: [],
      hasNextPage: false,
      total: 0
    }, { status: 500 });
  }
}
