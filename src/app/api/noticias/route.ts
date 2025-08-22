import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { Noticia } from '@/types';

export const dynamic = 'force-dynamic'; // Forzar modo dinámico, sin caché
export const revalidate = 0; // No usar caché

// Función para limpiar etiquetas HTML
const limpiarHTML = (html: string): string => {
  if (!html) return '';
  // Eliminar todas las etiquetas HTML
  return html.replace(/<\/?[^>]+(>|$)/g, '');
};

// Función para generar un resumen del contenido
const generarResumen = (contenido: string, longitud: number = 120): string => {
  if (!contenido) return '';
  
  // Limpiar HTML y recortar
  const textoLimpio = limpiarHTML(contenido);
  return textoLimpio.length > longitud 
    ? `${textoLimpio.substring(0, longitud)}...` 
    : textoLimpio;
};

// Función para configurar los encabezados CORS
function configurarCORS(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Manejar solicitudes OPTIONS (preflight)
export async function OPTIONS(request: Request) {
  const response = NextResponse.json({}, { status: 200 });
  return configurarCORS(response);
}

export async function GET(request: Request) {
  try {
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';
    
    // Parámetros de búsqueda y filtrado
    const busqueda = searchParams.get('busqueda') || '';
    const autor = searchParams.get('autor') || '';
    const ordenFecha = searchParams.get('ordenFecha') || 'desc';
    const categoria = searchParams.get('categoria') || '';
    
    // Obtener el cliente de servicio para saltarse las restricciones RLS
    const serviceClient = getServiceClient();

    // Construir la consulta base
    let query = serviceClient
      .from('noticias')
      .select('*');
      
    // Aplicar filtros de búsqueda si existen
    if (busqueda) {
      // Buscar en título o autor
      query = query.or(`titulo.ilike.%${busqueda}%,autor.ilike.%${busqueda}%`);
    }
    
    if (autor) {
      query = query.ilike('autor', `%${autor}%`);
    }
    
    // Aplicar orden por fecha
    query = query.order('fecha_publicacion', { ascending: ordenFecha === 'asc' });
      
    // Si no es admin, limitar a 9 noticias
    if (!isAdmin) {
      query = query.limit(9);
    }
    
    // Ejecutar la consulta inicial para obtener noticias
    let { data: noticias, error } = await query;
    
    // Si tenemos un filtro de categoría, necesitamos filtrarlo después de obtener las relaciones
    const filtrarPorCategoria = categoria ? true : false;
      
    if (error) {
      // En lugar de mostrar un error, devolver un array vacío
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    // Procesar las noticias
    let noticiasData: any[] = [];
    let categoriasPorNoticia: Record<string, any[]> = {};
    let perfilesAutores: Record<string, any> = {};
    
    if (noticias && noticias.length > 0) {
      // Obtener las categorías para todas las noticias
      try {
        const { data: relaciones, error: errorRelaciones } = await serviceClient
          .from('noticias_categorias')
          .select('noticia_id, categoria_id')
          .in('noticia_id', noticias.map(n => n.id));
          
        if (!errorRelaciones && relaciones && relaciones.length > 0) {
          // Obtener todas las categorías involucradas
          const categoriaIds = Array.from(new Set(relaciones.map(r => r.categoria_id)));
          
          try {
            const { data: categoriasData, error: errorCategorias } = await serviceClient
              .from('categorias')
              .select('id, nombre, parent_id, slug, color, icono, orden')
              .in('id', categoriaIds);
              
            if (!errorCategorias && categoriasData) {
              // Crear un mapa de categorías completo para acceso fácil
              const categoriasMap = categoriasData.reduce((map: Record<string, any>, cat) => {
                map[cat.id] = {
                  id: cat.id,
                  nombre: cat.nombre,
                  parent_id: cat.parent_id,
                  slug: cat.slug,
                  color: cat.color,
                  icono: cat.icono,
                  orden: cat.orden
                };
                return map;
              }, {});
              
              // Agrupar categorías por noticia
              relaciones.forEach(rel => {
                if (!categoriasPorNoticia[rel.noticia_id]) {
                  categoriasPorNoticia[rel.noticia_id] = [];
                }
                if (categoriasMap[rel.categoria_id]) {
                  categoriasPorNoticia[rel.noticia_id].push(categoriasMap[rel.categoria_id]);
                }
              });
            }
          } catch (error) {
            // Manejar silenciosamente el error de categorías
            console.log('No se pudieron cargar las categorías, continuando sin ellas');
          }
        }
      } catch (error) {
        // Manejar silenciosamente el error de relaciones
        console.log('No se pudieron cargar las relaciones de categorías, continuando sin ellas');
      }
      
      // Intentar obtener información de los autores
      try {
        // Recopilar IDs de autores (pueden estar en autor_id o en autor si es UUID)
        const autorIds = noticias
          .map(noticia => {
            if (noticia.autor_id) return noticia.autor_id;
            if (noticia.autor && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(noticia.autor)) {
              return noticia.autor;
            }
            return null;
          })
          .filter(id => id !== null);
        
        // Si tenemos IDs de autores, intentar obtener sus perfiles
        if (autorIds.length > 0) {
          const { data: perfiles, error: errorPerfiles } = await serviceClient
            .from('perfiles')
            .select('id, username, role, color')
            .in('id', autorIds);
          
          if (!errorPerfiles && perfiles && perfiles.length > 0) {
            perfilesAutores = perfiles.reduce((map: Record<string, any>, perfil) => {
              // Usar el color personalizado si existe, o asignar color según el rol
              let color = perfil.color || '#3b82f6'; // Usar color personalizado o azul por defecto
              
              // Si no hay color personalizado, asignar según el rol
              if (!perfil.color) {
                if (perfil.role === 'admin') {
                  color = '#ef4444'; // Rojo para administradores
                } else if (perfil.role === 'moderator') {
                  color = '#f59e0b'; // Ámbar para moderadores
                }
              }
              
              map[perfil.id] = {
                username: perfil.username || 'Usuario',
                color: color
              };
              return map;
            }, {});
          }
        }
      } catch (error) {
        // Manejar silenciosamente el error de perfiles
        console.log('No se pudieron cargar los perfiles de autores, continuando sin ellos');
      }
      
      // Obtener todas las categorías para construir un mapa de jerarquía
      let categoriasHijas: Record<string, string[]> = {};
      
      if (filtrarPorCategoria && noticias.length > 0) {
        try {
          // Obtener todas las categorías para construir el árbol jerárquico
          const { data: todasCategorias, error: errorTodasCategorias } = await serviceClient
            .from('categorias')
            .select('id, parent_id');
            
          if (!errorTodasCategorias && todasCategorias) {
            // Construir mapa de categorías padre -> hijas
            todasCategorias.forEach(cat => {
              if (cat.parent_id) {
                if (!categoriasHijas[cat.parent_id]) {
                  categoriasHijas[cat.parent_id] = [];
                }
                categoriasHijas[cat.parent_id].push(cat.id);
              }
            });
            
            // Función recursiva para obtener todas las subcategorías
            const obtenerTodasLasSubcategorias = (categoriaId: string): string[] => {
              const resultado = [categoriaId];
              const hijas = categoriasHijas[categoriaId] || [];
              
              hijas.forEach(hijaId => {
                resultado.push(...obtenerTodasLasSubcategorias(hijaId));
              });
              
              return resultado;
            };
            
            // Encontrar la categoría por ID o nombre
            let categoriaId = categoria;
            if (!todasCategorias.some(cat => cat.id === categoria)) {
              // Si no es un ID, buscar por nombre o slug
              const { data: catPorNombre } = await serviceClient
                .from('categorias')
                .select('id')
                .or(`nombre.ilike.${categoria},slug.ilike.${categoria}`)
                .limit(1);
                
              if (catPorNombre && catPorNombre.length > 0) {
                categoriaId = catPorNombre[0].id;
              }
            }
            
            // Obtener todas las categorías y subcategorías que coinciden
            const categoriasAFiltrar = obtenerTodasLasSubcategorias(categoriaId);
            
            // Filtrar noticias que tienen alguna de estas categorías
            noticias = noticias.filter(noticia => {
              const categoriasDeLaNoticia = categoriasPorNoticia[noticia.id] || [];
              return categoriasDeLaNoticia.some(cat => 
                categoriasAFiltrar.includes(cat.id)
              );
            });
          }
        } catch (error) {
          console.log('Error al procesar la jerarquía de categorías:', error);
          
          // Fallback al filtrado simple si hay error
          noticias = noticias.filter(noticia => {
            const categoriasDeLaNoticia = categoriasPorNoticia[noticia.id] || [];
            return categoriasDeLaNoticia.some(cat => 
              cat.id.toString() === categoria || 
              cat.nombre.toLowerCase() === categoria.toLowerCase()
            );
          });
        }
      }
      
      // Mapear las noticias con sus categorías y datos de autor
      noticiasData = noticias.map(noticia => {
        // Determinar el ID del autor (puede estar en autor_id o en autor si es UUID)
        let autorId = null;
        let perfilEncontrado = false;
        
        if (noticia.autor_id) {
          autorId = noticia.autor_id;
        } else if (noticia.autor && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(noticia.autor)) {
          autorId = noticia.autor;
        }
        
        // Valores predeterminados
        let autorNombre = noticia.autor || 'Anónimo';
        let autorColor = '#3b82f6'; // Color por defecto
        
        // Si tenemos un ID válido y encontramos un perfil, usar su username
        if (autorId && perfilesAutores[autorId]) {
          const perfil = perfilesAutores[autorId];
          
          // Solo usar el username si existe y no está vacío
          if (perfil.username) {
            autorNombre = perfil.username;
            autorColor = perfil.color;
            perfilEncontrado = true;
          }
        }
        
        // Si es un correo electrónico y no encontramos perfil, mostrar solo la parte antes del @
        if (!perfilEncontrado && noticia.autor && noticia.autor.includes('@')) {
          autorNombre = noticia.autor.split('@')[0];
        }
        
        // Si aún no tenemos un nombre de autor válido, usar un valor predeterminado
        if (!autorNombre || autorNombre === 'null' || autorNombre === 'undefined') {
          autorNombre = 'Usuario';
        }
        
        return {
          ...noticia,
          categorias: categoriasPorNoticia[noticia.id] || [],
          // Generar un resumen limpio del contenido
          resumen: generarResumen(noticia.contenido, 150),
          // Añadir información del autor
          autor_nombre: autorNombre,
          autor_color: autorColor,
          // Asegurar que imagen_url siempre esté presente, usando imagen_portada como fallback
          imagen_url: noticia.imagen_url || noticia.imagen_portada || null
        };
      });
    }

    const respuestaExitosa = NextResponse.json({ 
      success: true, 
      data: noticiasData 
    });
    return configurarCORS(respuestaExitosa);
  } catch (error) {
    // Manejar silenciosamente cualquier error y devolver un array vacío
    const respuestaError = NextResponse.json({
      success: true,
      data: []
    });
    return configurarCORS(respuestaError);
  }
}
