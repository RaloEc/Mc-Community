import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { getServiceClient } from '@/lib/supabase'

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

// GET - Obtener estadísticas de noticias
export async function GET(request: NextRequest) {
  console.log('GET - Recibida solicitud para obtener estadísticas')
  
  // Usamos el cliente de servicio para saltarnos las restricciones RLS
  const supabase = getServiceClient()
  console.log('Usando cliente de servicio para operación administrativa')

  try {
    // Total de noticias
    const { count: total_noticias, error: errorNoticias } = await supabase
      .from('noticias')
      .select('*', { count: 'exact', head: true })
    
    if (errorNoticias) {
      console.error('Error al obtener total de noticias:', errorNoticias)
      throw errorNoticias
    }

    // Total de vistas
    const { data: vistasData, error: errorVistas } = await supabase
      .from('noticias')
      .select('vistas')
    
    let total_vistas = 0
    if (errorVistas) {
      console.error('Error al obtener vistas:', errorVistas)
    } else if (vistasData) {
      total_vistas = vistasData.reduce((sum, item: any) => sum + (item.vistas || 0), 0)
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

    // Construir respuesta
    const estadisticas = {
      total_noticias: total_noticias || 0,
      total_vistas,
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
