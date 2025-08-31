'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Comentario } from '@/types/comentarios'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ComentariosProps {
  tipoEntidad: string
  entidadId: string
  limite?: number
}

export default function Comentarios({ tipoEntidad, entidadId, limite = 10 }: ComentariosProps) {
  const { session, user: authUser, profile } = useAuth()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [offset, setOffset] = useState(0)
  const [totalComentarios, setTotalComentarios] = useState(0)

  // Función para obtener la URL base
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return process.env.NEXT_PUBLIC_SITE_URL || 
           (process.env.NETLIFY_URL ? `https://${process.env.NETLIFY_URL}` :
           (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
           'http://localhost:3000'))
  }

  // Cargar comentarios
  const cargarComentarios = async (nuevoOffset = offset, reemplazar = false) => {
    try {
      setCargando(true)
      setError(null)
      
      const baseUrl = getBaseUrl()
      const url = `${baseUrl}/api/comentarios?tipo_entidad=${tipoEntidad}&entidad_id=${entidadId}&limite=${limite}&offset=${nuevoOffset}`
      
      const respuesta = await fetch(url)
      const datos = await respuesta.json()
      
      if (!respuesta.ok) {
        throw new Error(datos.error || 'Error al cargar comentarios')
      }
      
      if (reemplazar) {
        setComentarios(datos.data || [])
      } else {
        setComentarios(prevComentarios => [...prevComentarios, ...(datos.data || [])])
      }
      
      setTotalComentarios(datos.total)
      setOffset(nuevoOffset + limite)
    } catch (err) {
      console.error('Error al cargar comentarios:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }

  // Enviar un nuevo comentario
  const enviarComentario = async () => {
    if (!nuevoComentario.trim() || !session || !authUser) return
    
    try {
      setEnviando(true)
      
      const baseUrl = getBaseUrl()
      const respuesta = await fetch(`${baseUrl}/api/comentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contenido: nuevoComentario,
          tipo_entidad: tipoEntidad,
          entidad_id: entidadId,
        }),
      })
      
      const datos = await respuesta.json()
      
      if (!respuesta.ok) {
        throw new Error(datos.error || 'Error al enviar comentario')
      }
      
      // Limpiar el campo y recargar comentarios
      setNuevoComentario('')
      cargarComentarios(0, true)
    } catch (err) {
      console.error('Error al enviar comentario:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setEnviando(false)
    }
  }

  // Formatear fecha relativa
  const formatearFechaRelativa = (fecha: string) => {
    try {
      return formatDistanceToNow(new Date(fecha), { 
        addSuffix: true,
        locale: es 
      })
    } catch (err) {
      return 'fecha desconocida'
    }
  }

  // Cargar comentarios al montar el componente
  useEffect(() => {
    cargarComentarios(0, true)
  }, [tipoEntidad, entidadId])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Comentarios ({totalComentarios})</h2>
      
      {/* Lista de comentarios */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <div className="comentarios-container relative h-[400px] mb-6 bg-background/50 rounded-lg overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/30 hover:scrollbar-thumb-primary/50 before:absolute before:top-0 before:left-0 before:right-0 before:h-8 before:bg-gradient-to-b before:from-background/80 before:to-transparent before:z-10 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-8 after:bg-gradient-to-t after:from-background/80 after:to-transparent after:z-10">
          {comentarios && comentarios.length > 0 ? (
            <ul
              aria-label="Comentarios"
              role="feed"
              className="relative flex flex-col gap-8 py-8 pl-8 before:absolute before:top-0 before:left-8 before:h-full before:-translate-x-1/2 before:border before:border-dashed before:border-slate-200 dark:before:border-slate-700 after:absolute after:top-6 after:left-8 after:bottom-6 after:-translate-x-1/2 after:border after:border-slate-200 dark:after:border-slate-700"
            >
              {comentarios.map((comentario) => (
                <li key={comentario.id} role="article" className="relative pl-8">
                  <div className="flex flex-col flex-1 gap-4">
                    <a
                      href={`/perfil/${comentario.perfiles?.username || comentario.usuario_id}`}
                      className="absolute z-10 inline-flex items-center justify-center w-8 h-8 text-white rounded-full -left-4 ring-2 ring-white dark:ring-gray-900"
                    >
                      {comentario.perfiles?.avatar_url ? (
                        <img
                          src={comentario.perfiles.avatar_url}
                          alt={`Avatar de ${comentario.perfiles.username || 'usuario'}`}
                          width="48"
                          height="48"
                          className="max-w-full rounded-full"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold rounded-full">
                          {comentario.perfiles?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </a>
                    <h4 className="flex flex-col items-start text-lg font-medium leading-8 text-foreground md:flex-row lg:items-center">
                      <span className="flex-1">
                        {comentario.perfiles?.username || 'Usuario'}
                        {comentario.perfiles?.role === 'admin' && (
                          <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {formatearFechaRelativa(comentario.created_at)}
                        {comentario.updated_at !== comentario.created_at && ' (editado)'}
                      </span>
                    </h4>
                    <div className="text-foreground dark:text-slate-300" dangerouslySetInnerHTML={{ __html: comentario.contenido }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : cargando ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay comentarios aún. ¡Sé el primero en comentar!
            </div>
          )}
        </div>
      </div>
      
      {/* Botón para cargar más comentarios */}
      {comentarios && comentarios.length < totalComentarios && (
        <div className="flex justify-center mb-6">
          <Button
            variant="outline"
            onClick={() => cargarComentarios()}
            disabled={cargando}
            size="sm"
          >
            {cargando ? 'Cargando...' : 'Cargar más comentarios'}
          </Button>
        </div>
      )}
      
      {/* Formulario para nuevo comentario */}
      {session && authUser ? (
        <div className="bg-background dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-border">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Tu avatar"
                  width="32"
                  height="32"
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  {profile?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <Textarea
                placeholder="Escribe un comentario..."
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                className="min-h-[80px] mb-2"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={enviarComentario} 
                  disabled={enviando || !nuevoComentario.trim()}
                  size="sm"
                >
                  {enviando ? 'Enviando...' : 'Comentar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-background dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-border">
          <p className="mb-2">Inicia sesión para dejar un comentario</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/login'}
            size="sm"
          >
            Iniciar sesión
          </Button>
        </div>
      )}
    </div>
  )
}
