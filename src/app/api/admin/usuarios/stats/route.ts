import { NextResponse } from 'next/server'
import { getServiceClient } from '@/utils/supabase-service'

export async function GET() {
  try {
    const supabase = getServiceClient()

    const ahora = new Date()
    const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)
    const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000)

    const queries = [
      supabase.from('perfiles').select('*', { count: 'exact', head: true }), // Total
      supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('activo', true), // Activos
      supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'), // Admins
      supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('role', 'moderator'), // Moderadores
      supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('role', 'usuario'), // Usuarios
      supabase.from('perfiles').select('*', { count: 'exact', head: true }).gte('created_at', hace7Dias.toISOString()), // Nuevos (semana)
      supabase.from('perfiles').select('*', { count: 'exact', head: true }).gte('created_at', hace30Dias.toISOString()) // Nuevos (mes)
    ]

    const results = await Promise.all(queries)

    const [ 
      { count: total },
      { count: activos },
      { count: admins },
      { count: moderators },
      { count: usuarios },
      { count: nuevos_semana },
      { count: nuevos_mes }
    ] = results.map(r => ({ count: r.count ?? 0, error: r.error }))

    // Manejo de errores individual
    for (const result of results) {
      if (result.error) {
        console.error('Error en una de las consultas de estadísticas:', result.error)
        return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
      }
    }

    const stats = {
      total,
      activos,
      inactivos: total - activos,
      admins,
      moderators,
      usuarios,
      nuevos_semana,
      nuevos_mes
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error en API de estadísticas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
