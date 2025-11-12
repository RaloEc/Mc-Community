import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const supabase = await createClient()
  const publicId = params.username

  try {
    // 1. Obtener el perfil del usuario por public_id o username como fallback
    let { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('id, username, public_id, created_at, avatar_url, banner_url, bio, color, role, followers_count, following_count, friends_count')
      .eq('public_id', publicId)
      .single()

    // Si no encontramos por public_id, intentar por username
    if (perfilError || !perfil) {
      console.log(`[Perfil API] public_id "${publicId}" no encontrado, intentando por username...`)
      const { data: perfilPorUsername, error: errorUsername } = await supabase
        .from('perfiles')
        .select('id, username, public_id, created_at, avatar_url, banner_url, bio, color, role, followers_count, following_count, friends_count')
        .eq('username', publicId)
        .single()

      if (errorUsername || !perfilPorUsername) {
        console.error('Error fetching profile by public_id or username:', perfilError, errorUsername)
        return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
      }

      perfil = perfilPorUsername
    }

    // 2. Obtener estadísticas de actividad (solo contenido no eliminado)
    const { count: hilosCount, error: hilosCountError } = await supabase
      .from('foro_hilos')
      .select('*', { count: 'exact', head: true })
      .eq('autor_id', perfil.id)
      .is('deleted_at', null)

    const { count: postsCount, error: postsCountError } = await supabase
      .from('foro_posts')
      .select('*', { count: 'exact', head: true })
      .eq('autor_id', perfil.id)
      .is('deleted_at', null)

    if (hilosCountError || postsCountError) {
      console.error('Error fetching stats:', hilosCountError, postsCountError)
      // No es un error fatal, podemos continuar
    }

    // 3. Obtener últimos hilos creados
    const { data: ultimosHilos, error: hilosError } = await supabase
      .from('foro_hilos')
      .select('id, slug, titulo, contenido, created_at, vistas, foro_categorias!inner(nombre), respuestas_conteo:foro_posts(count), weapon_stats_record:weapon_stats_records!weapon_stats_id(id)')
      .eq('autor_id', perfil.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5)

    if (hilosError) {
      console.error('Error fetching threads:', hilosError)
    }

    // Transformar ultimosHilos para extraer categoria_titulo y contar respuestas
    let hilosTransformados: any[] = []
    if (ultimosHilos) {
      hilosTransformados = (ultimosHilos as any[]).map((hilo: any) => {
        const respuestas = Array.isArray(hilo.respuestas_conteo) 
          ? hilo.respuestas_conteo[0]?.count ?? 0 
          : hilo.respuestas_conteo?.count ?? 0
        
        const weaponStatsRelation = Array.isArray(hilo.weapon_stats_record)
          ? hilo.weapon_stats_record[0]
          : hilo.weapon_stats_record

        return {
          id: hilo.id,
          slug: hilo.slug,
          titulo: hilo.titulo,
          contenido: hilo.contenido,
          created_at: hilo.created_at,
          vistas: hilo.vistas ?? 0,
          respuestas: respuestas,
          hasWeaponStats: Boolean(weaponStatsRelation?.id),
          categoria_titulo: Array.isArray(hilo.foro_categorias) 
            ? hilo.foro_categorias[0]?.nombre ?? 'Sin categoría'
            : hilo.foro_categorias?.nombre ?? 'Sin categoría'
        }
      })
    }

    // 4. Obtener últimos posts (respuestas) - solo posts no eliminados de hilos no eliminados
    const { data: ultimosPosts, error: postsError } = await supabase
      .from('foro_posts')
      .select('id, contenido, created_at, hilo_id, foro_hilos!inner(titulo, deleted_at)')
      .eq('autor_id', perfil.id)
      .is('deleted_at', null)
      .is('foro_hilos.deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5)

    const limpiarHTML = (html: string) => {
      if (!html) return ''
      return html.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
    }

    let postsLimpios: any[] = []
    if (postsError) {
      console.error('Error fetching posts:', postsError)
    } else if (ultimosPosts) {
      postsLimpios = ultimosPosts.map(post => {
        const hilo = Array.isArray(post.foro_hilos) ? post.foro_hilos[0] : post.foro_hilos;
        return {
          id: post.id,
          contenido: limpiarHTML(post.contenido),
          created_at: post.created_at,
          hilo_id: post.hilo_id,
          hilo_titulo: hilo?.titulo ?? 'Hilo desconocido',
        }
      })
    }

    // 5. Obtener hilos con estadísticas de armas asociadas (únicamente los que tienen vínculo y no están borrados)
    const { data: weaponStatsRecords, error: weaponStatsError } = await supabase
      .from('weapon_stats_records')
      .select(`
        id,
        weapon_name,
        created_at,
        stats,
        foro_hilos!inner(
          id,
          slug,
          titulo,
          created_at,
          vistas,
          deleted_at,
          foro_categorias!inner(nombre)
        )
      `)
      .eq('user_id', perfil.id)
      .is('foro_hilos.deleted_at', null)
      .order('created_at', { ascending: false })

    if (weaponStatsError) {
      console.error('Error fetching weapon stats records:', weaponStatsError)
    }

    console.log('[Perfil API] Weapon stats raw data:', {
      user_id: perfil.id,
      records_count: weaponStatsRecords?.length ?? 0,
      records: weaponStatsRecords,
      error: weaponStatsError
    })

    const weaponStatsTransformadasMap = new Map<string, any>()
    for (const record of weaponStatsRecords || []) {
      console.log('[Perfil API] Processing weapon stats record:', {
        id: record.id,
        weapon_name: record.weapon_name,
        foro_hilos: record.foro_hilos,
        stats_type: typeof record.stats,
        stats_value: record.stats
      })

      const hiloRelacion = Array.isArray(record.foro_hilos)
        ? record.foro_hilos[0]
        : record.foro_hilos

      if (!hiloRelacion) {
        console.warn('[Perfil API] No hilo relation found for weapon stats record:', record.id)
        continue
      }

      const categoriaRelacion = Array.isArray(hiloRelacion.foro_categorias)
        ? hiloRelacion.foro_categorias[0]
        : hiloRelacion.foro_categorias

      let statsNormalizadas = record.stats
      if (typeof statsNormalizadas === 'string') {
        try {
          statsNormalizadas = JSON.parse(statsNormalizadas)
        } catch (error) {
          console.warn('[Perfil API] No se pudieron parsear las stats de arma', error)
          statsNormalizadas = null
        }
      }

      const clave = `${hiloRelacion.id}`
      if (!weaponStatsTransformadasMap.has(clave)) {
        console.log('[Perfil API] Adding weapon stats to map:', {
          key: clave,
          weapon_name: record.weapon_name,
          hilo_titulo: hiloRelacion.titulo,
          stats_keys: statsNormalizadas ? Object.keys(statsNormalizadas) : []
        })

        weaponStatsTransformadasMap.set(clave, {
          id: record.id,
          weapon_name: record.weapon_name,
          created_at: record.created_at,
          stats: statsNormalizadas,
          hilo: {
            id: hiloRelacion.id,
            slug: hiloRelacion.slug,
            titulo: hiloRelacion.titulo,
            created_at: hiloRelacion.created_at,
            vistas: hiloRelacion.vistas ?? 0,
            categoria_titulo: categoriaRelacion?.nombre ?? 'Sin categoría',
          },
        })
      }
    }

    const weaponStatsTransformadas = Array.from(weaponStatsTransformadasMap.values())
    console.log('[Perfil API] Final weapon stats transformed:', {
      total_count: weaponStatsTransformadas.length,
      records: weaponStatsTransformadas.map(r => ({
        id: r.id,
        weapon_name: r.weapon_name,
        hilo_titulo: r.hilo.titulo
      }))
    })

    const publicProfile = {
      ...perfil,
      stats: {
        hilos: hilosCount ?? 0,
        posts: postsCount ?? 0,
      },
      ultimosHilos: hilosTransformados,
      ultimosPosts: postsLimpios,
      weaponStatsRecords: weaponStatsTransformadas,
    }

    return NextResponse.json(publicProfile)

  } catch (error) {
    console.error('Unexpected error fetching profile:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
