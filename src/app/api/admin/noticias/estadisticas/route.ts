import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { getServiceClient } from '@/utils/supabase-service'

// Configuración para deshabilitar cache de Next.js
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Función para verificar si el usuario es administrador
async function esAdmin(supabase: any, request?: NextRequest) {
  try {
    console.log('Verificando si el usuario es administrador...')
    
    // Verificar si se recibió el parámetro admin=true
    const isAdminParam = request?.nextUrl.searchParams.get('admin') === 'true'
    console.log('¿Parámetro admin=true recibido?', isAdminParam)
    
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Usuario autenticado:', user ? `ID: ${user.id}` : 'No hay usuario autenticado')
    
    if (!user) {
      console.log('No hay usuario autenticado, denegando acceso')
      return false
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('role') // Cambiado de 'rol' a 'role'
      .eq('id', user.id)
      .single()
    
    if (perfilError) {
      console.error('Error al obtener perfil:', perfilError)
      return false
    }
    
    console.log('Rol del usuario:', perfil?.role || 'No tiene rol asignado')
    const isAdmin = perfil?.role === 'admin'
    console.log('¿Es administrador según la base de datos?', isAdmin)
    
    // Solo requerir que el usuario sea administrador
    return isAdmin
  } catch (error) {
    console.error('Error al verificar rol de administrador:', error)
    return false
  }
}

// GET - Obtener estadísticas de noticias (optimizado con función RPC)
export async function GET(request: NextRequest) {
  console.log('GET - Recibida solicitud para obtener estadísticas')
  
  // Usamos el cliente de servicio para saltarnos las restricciones RLS
  const supabase = getServiceClient()
  console.log('Usando cliente de servicio para operación administrativa')

  try {
    // Intentar usar la función RPC optimizada primero
    // Agregar timestamp para evitar cache de Supabase
    const { data: estadisticasRPC, error: errorRPC } = await supabase
      .rpc('obtener_estadisticas_admin_noticias')
      .single()
    
    if (!errorRPC && estadisticasRPC) {
      console.log('✅ Estadísticas obtenidas mediante función RPC optimizada')
      console.log('Total vistas desde RPC:', (estadisticasRPC as any).total_vistas)
      console.log('Vistas últimos 30 días:', (estadisticasRPC as any).vistas_ultimos_30_dias)
      console.log('Vistas 30-60 días atrás:', (estadisticasRPC as any).vistas_30_60_dias_atras)
      
      return NextResponse.json(estadisticasRPC, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      })
    }
    
    console.log('⚠️ Función RPC no disponible, usando consultas individuales:', errorRPC)
    
    // Fallback: Consultas individuales (código anterior)
    // Total de noticias
    const { count: total_noticias, error: errorNoticias } = await supabase
      .from('noticias')
      .select('*', { count: 'exact', head: true })
    
    if (errorNoticias) {
      console.error('Error al obtener total de noticias:', errorNoticias)
      throw errorNoticias
    }

    // Total de vistas (usar agregación para evitar límite de filas)
    let total_vistas = 0
    const { data: sumaVistas, error: errorSuma } = await supabase
      .from('noticias')
      .select('sum:vistas')
      .single()
    if (errorSuma) {
      console.error('Error al sumar vistas con agregación:', errorSuma)
      // Fallback final: intentar reducir, pero puede estar limitado por el rango por defecto
      const { data: vistasData, error: errorVistas } = await supabase
        .from('noticias')
        .select('vistas')
      if (errorVistas) {
        console.error('Error al obtener vistas:', errorVistas)
      } else if (vistasData) {
        total_vistas = vistasData.reduce((sum, item: any) => sum + (item.vistas || 0), 0)
      }
    } else {
      total_vistas = (sumaVistas as any)?.sum || 0
    }

    // Total de categorías
    const { count: total_categorias, error: errorCategorias } = await supabase
      .from('categorias')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', 'noticia')
    
    // Si la tabla no existe, manejar el error
    let categorias_count = 0
    if (errorCategorias) {
      console.error('Error al obtener categorías:', errorCategorias)
      if (errorCategorias.code !== '42P01') { // Si no es error de tabla indefinida
        throw errorCategorias
      }
    } else {
      categorias_count = total_categorias || 0
    }

    // Total de autores únicos
    const { data: autoresData, error: errorAutores } = await supabase
      .from('noticias')
      .select('autor_id')
      .not('autor_id', 'is', null)
    
    let total_autores = 0
    if (errorAutores) {
      console.error('Error al obtener autores:', errorAutores)
    } else if (autoresData) {
      const autoresUnicos = new Set(autoresData.map(item => item.autor_id))
      total_autores = autoresUnicos.size
    }

    // Estadísticas básicas sin usar funciones RPC que pueden no existir
    let noticiasPorMes: any[] = []
    let noticiasPorCategoria: any[] = []
    let noticiasPorAutor: any[] = []
    
    // Intentar obtener estadísticas por RPC, pero manejar errores si las funciones no existen
    try {
      const { data: porMes } = await supabase.rpc('obtener_noticias_por_mes')
      if (porMes) noticiasPorMes = porMes
    } catch (error) {
      console.log('La función RPC obtener_noticias_por_mes no existe o falló:', error)
    }
    
    try {
      const { data: porCategoria } = await supabase.rpc('obtener_noticias_por_categoria')
      if (porCategoria) noticiasPorCategoria = porCategoria
    } catch (error) {
      console.log('La función RPC obtener_noticias_por_categoria no existe o falló:', error)
    }
    
    try {
      const { data: porAutor } = await supabase.rpc('obtener_noticias_por_autor')
      if (porAutor) noticiasPorAutor = porAutor
    } catch (error) {
      console.log('La función RPC obtener_noticias_por_autor no existe o falló:', error)
    }
    
    // Noticias más vistas
    const { data: noticiasVistas, error: errorVistas2 } = await supabase
      .from('noticias')
      .select('id, titulo, vistas, fecha_publicacion')
      .order('vistas', { ascending: false })
      .limit(10)

    if (errorVistas2) {
      console.error('Error al obtener noticias más vistas:', errorVistas2)
    }

    // Noticias recientes (últimos 30 días)
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - 30)
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0]
    
    const { count: noticias_recientes, error: errorRecientes } = await supabase
      .from('noticias')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_publicacion', fechaLimiteStr)
    
    if (errorRecientes) {
      console.error('Error al obtener noticias recientes:', errorRecientes)
    }
    
    // Noticias pendientes (programadas para el futuro)
    const hoy = new Date().toISOString().split('T')[0]
    const { count: noticias_pendientes, error: errorPendientes } = await supabase
      .from('noticias')
      .select('*', { count: 'exact', head: true })
      .gt('fecha_publicacion', hoy)

    if (errorPendientes) {
      console.error('Error al obtener noticias pendientes:', errorPendientes)
    }

    // Noticias destacadas
    const { count: noticias_destacadas, error: errorDestacadas } = await supabase
      .from('noticias')
      .select('*', { count: 'exact', head: true })
      .eq('destacada', true)
    
    if (errorDestacadas) {
      console.error('Error al obtener noticias destacadas:', errorDestacadas)
    }

    // Noticias inactivas
    const { count: noticias_inactivas, error: errorInactivas } = await supabase
      .from('noticias')
      .select('*', { count: 'exact', head: true })
      .eq('es_activa', false)
    
    if (errorInactivas) {
      console.error('Error al obtener noticias inactivas:', errorInactivas)
    }

    // Construir respuesta
    const estadisticas = {
      total_noticias: total_noticias || 0,
      total_vistas,
      promedio_vistas: total_noticias ? Math.round(total_vistas / total_noticias) : 0,
      noticias_destacadas: noticias_destacadas || 0,
      noticias_inactivas: noticias_inactivas || 0,
      total_categorias: categorias_count,
      total_autores,
      noticias_recientes: noticias_recientes || 0,
      noticias_pendientes: noticias_pendientes || 0,
      noticias_por_mes: noticiasPorMes,
      noticias_por_categoria: noticiasPorCategoria,
      noticias_por_autor: noticiasPorAutor,
      noticias_mas_vistas: noticiasVistas || []
    }

    return NextResponse.json(estadisticas)
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
