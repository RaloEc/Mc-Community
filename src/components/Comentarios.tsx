'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Comentario } from '@/types/comentarios'
import { formatDistanceToNow, format, differenceInHours } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserInitials } from '@/lib/utils/avatar-utils';

// Añadir estilos de animación
import './comentarios.css'

interface ComentariosProps {
  tipoEntidad: string
  entidadId: string
  limite?: number
}

export default function Comentarios({ tipoEntidad, entidadId, limite = 10 }: ComentariosProps) {
  const { session, user: authUser } = useAuth()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [offset, setOffset] = useState(0)
  const [totalComentarios, setTotalComentarios] = useState(0)
  const [comentarioEditando, setComentarioEditando] = useState<string | null>(null)
  const [contenidoEditado, setContenidoEditado] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [respondiendo, setRespondiendo] = useState<string | null>(null)
  const [respuesta, setRespuesta] = useState('')

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
      console.log('Enviando comentario con usuario:', authUser)
      
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
          usuario_id: authUser.id || session.user.id
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
  
  // Enviar una respuesta a un comentario
  const enviarRespuesta = async () => {
    if (!respuesta.trim() || !session || !authUser || !respondiendo) return
    
    try {
      setEnviando(true)
      console.log('Enviando respuesta al comentario:', respondiendo)
      
      const baseUrl = getBaseUrl()
      const respuestaApi = await fetch(`${baseUrl}/api/comentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contenido: respuesta,
          tipo_entidad: tipoEntidad,
          entidad_id: entidadId,
          usuario_id: authUser.id || session.user.id,
          comentario_padre_id: respondiendo
        }),
      })
      
      const datos = await respuestaApi.json()
      
      if (!respuestaApi.ok) {
        throw new Error(datos.error || 'Error al enviar respuesta')
      }
      
      // Limpiar el campo y recargar comentarios
      setRespuesta('')
      setRespondiendo(null)
      cargarComentarios(0, true)
    } catch (err) {
      console.error('Error al enviar respuesta:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setEnviando(false)
    }
  }

  // Formatear fecha relativa o exacta según el tiempo transcurrido
  const formatearFecha = (fecha: string) => {
    try {
      const fechaObj = new Date(fecha)
      const horasTranscurridas = differenceInHours(new Date(), fechaObj)
      
      // Si han pasado más de 2 horas, mostrar la hora exacta
      if (horasTranscurridas > 2) {
        return format(fechaObj, 'dd/MM/yyyy HH:mm', { locale: es })
      } else {
        // Si no, mostrar tiempo relativo
        return formatDistanceToNow(fechaObj, { 
          addSuffix: true,
          locale: es 
        })
      }
    } catch (err) {
      return 'fecha desconocida'
    }
  }

  // Editar un comentario existente
  const editarComentario = async (id: string) => {
    if (!contenidoEditado.trim() || !session || !authUser) return
    
    try {
      setEnviando(true)
      
      const baseUrl = getBaseUrl()
      const respuesta = await fetch(`${baseUrl}/api/comentarios`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          contenido: contenidoEditado,
          usuario_id: authUser.id || session.user.id
        }),
      })
      
      const datos = await respuesta.json()
      
      if (!respuesta.ok) {
        throw new Error(datos.error || 'Error al editar comentario')
      }
      
      // Actualizar la lista de comentarios
      setComentarioEditando(null)
      setContenidoEditado('')
      cargarComentarios(0, true)
    } catch (err) {
      console.error('Error al editar comentario:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setEnviando(false)
    }
  }

  // Eliminar un comentario
  const eliminarComentario = async (id: string) => {
    if (!session || !authUser) return
    
    try {
      setEliminando(true)
      
      const baseUrl = getBaseUrl()
      const userId = authUser.id || session.user.id
      const respuesta = await fetch(`${baseUrl}/api/comentarios?id=${id}&usuario_id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const datos = await respuesta.json()
      
      if (!respuesta.ok) {
        throw new Error(datos.error || 'Error al eliminar comentario')
      }
      
      // Actualizar la lista de comentarios
      cargarComentarios(0, true)
    } catch (err) {
      console.error('Error al eliminar comentario:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setEliminando(false)
    }
  }

  // Cargar comentarios al montar el componente
  useEffect(() => {
    cargarComentarios(0, true)
    console.log('Estado de autenticación:', { session, authUser })
  }, [tipoEntidad, entidadId, session])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Comentarios ({totalComentarios})</h2>
      
      {/* Lista de comentarios */}
      {error && (
        <div className="bg-destructive/15 border border-destructive text-destructive p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <div className={`comentarios-container relative ${comentarios.length === 0 ? 'h-[150px]' : comentarios.length < 3 ? 'h-[250px]' : 'h-[400px]'} mb-6 bg-muted/50 rounded-lg overflow-hidden border border-border transition-all duration-300`}>
        <div className="absolute inset-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/30 hover:scrollbar-thumb-primary/50">
          {comentarios && comentarios.length > 0 ? (
            <ul
              aria-label="Comentarios"
              role="feed"
              className="relative flex flex-col gap-2 py-4 px-4"
            >
              {comentarios.map((comentario) => (
                <li key={comentario.id} role="article" className="relative mb-4">
                  <div className="hover:bg-accent/50 rounded-md p-2 transition-colors duration-150">
                    {/* Contenido principal del comentario */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comentario.perfiles?.avatar_url || undefined} alt={comentario.perfiles?.username || 'Usuario'} />
                          <AvatarFallback>{getUserInitials(comentario.perfiles?.username, 1, 'U')}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-foreground">
                            {comentario.perfiles?.username || 'Usuario'}
                            {comentario.perfiles?.role === 'admin' && (
                              <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                Admin
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatearFecha(comentario.created_at)}
                          </span>
                          {comentario.updated_at !== comentario.created_at && (
                            <span className="text-xs italic text-muted-foreground">
                              (editado)
                            </span>
                          )}
                        </div>
                        {comentarioEditando === comentario.id ? (
                          <div className="mt-2">
                            <Textarea
                              value={contenidoEditado}
                              onChange={(e) => setContenidoEditado(e.target.value)}
                              className="min-h-[80px] mb-2"
                            />
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setComentarioEditando(null)
                                  setContenidoEditado('')
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => editarComentario(comentario.id)}
                                disabled={enviando || !contenidoEditado.trim()}
                              >
                                {enviando ? 'Guardando...' : 'Guardar'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-foreground mt-1" dangerouslySetInnerHTML={{ __html: comentario.contenido }} />
                        )}
                      
                        {/* Botones de acciones */}
                        <div className="flex gap-2 mt-1">
                          {/* Botón de responder (visible para todos los usuarios autenticados) */}
                          {authUser && !comentarioEditando && respondiendo !== comentario.id && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-xs h-7 px-2 text-primary hover:text-primary/90"
                              onClick={() => {
                                setRespondiendo(comentario.id)
                                setRespuesta('')
                              }}
                            >
                              Responder
                            </Button>
                          )}
                          
                          {/* Botones de editar y eliminar (solo visibles para el autor) */}
                          {authUser && (authUser.id === comentario.usuario_id || authUser.role === 'admin') && !comentarioEditando && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-xs h-7 px-2"
                                title="Editar comentario"
                                onClick={() => {
                                  setComentarioEditando(comentario.id)
                                  setContenidoEditado(comentario.contenido)
                                }}
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-xs h-7 px-2 text-destructive hover:text-destructive/90"
                                title="Eliminar comentario"
                                onClick={() => eliminarComentario(comentario.id)}
                                disabled={eliminando}
                              >
                                {eliminando ? (
                                  <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <Trash2 className="h-3 w-3 mr-1" />
                                )}
                                Eliminar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Formulario para responder a un comentario - AHORA DEBAJO */}
                    {respondiendo === comentario.id && (
                      <div className="mt-3 ml-10 animate-fadeIn comentario-respuesta-form relative">
                        {/* Línea conectora en forma de L */}
                        <div className="linea-conectora"></div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={authUser?.avatar_url || undefined} alt={authUser?.username || 'Usuario'} />
                                <AvatarFallback>{getUserInitials(authUser?.username, 1, 'U')}</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1">
                              <Textarea
                                placeholder="Escribe tu respuesta..."
                                value={respuesta}
                                onChange={(e) => setRespuesta(e.target.value)}
                                className="min-h-[60px] mb-2 text-sm bg-white dark:bg-gray-700/50 focus:bg-white dark:focus:bg-gray-700 transition-colors"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setRespondiendo(null)}
                                >
                                  Cancelar
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={enviarRespuesta}
                                  disabled={enviando || !respuesta.trim()}
                                >
                                  {enviando ? 'Enviando...' : 'Responder'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                                      {/* Mostrar respuestas a este comentario */}
                  {comentario.respuestas && comentario.respuestas.length > 0 && (
                    <div className="mt-3 ml-10 relative comentario-respuestas-container">
                      <ul className="space-y-4 pl-0 ml-6">
                        {comentario.respuestas.map((respuesta) => (
                          <li key={respuesta.id} className="relative pl-4 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded p-2.5 transition-colors duration-150 bg-gray-50/50 dark:bg-gray-800/30 shadow-sm comentario-respuesta">
                            {/* Línea conectora en forma de L */}
                            <div className="linea-conectora"></div>
                            <div className="flex items-start gap-2">
                                <div className="flex-shrink-0">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={respuesta.perfiles?.avatar_url || undefined} alt={respuesta.perfiles?.username || 'Usuario'} />
                                    <AvatarFallback>{getUserInitials(respuesta.perfiles?.username, 1, 'U')}</AvatarFallback>
                                  </Avatar>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm">
                                      {respuesta.perfiles?.username || 'Usuario'}
                                      {respuesta.perfiles?.role === 'admin' && (
                                        <span className="ml-1 text-xs bg-primary text-white px-1 py-0.5 rounded-full">
                                          Admin
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatearFecha(respuesta.created_at)}
                                    </span>
                                  </div>
                                  <div className="text-sm mt-0.5" dangerouslySetInnerHTML={{ __html: respuesta.contenido }} />
                                  
                                  {/* Botones de acciones para respuestas */}
                                  {authUser && (authUser.id === respuesta.usuario_id || authUser.role === 'admin') && (
                                    <div className="flex gap-2 mt-0.5">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="h-6 px-2 text-xs text-destructive hover:text-destructive/90"
                                        onClick={() => eliminarComentario(respuesta.id)}
                                        disabled={eliminando}
                                      >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        {eliminando ? 'Eliminando...' : 'Eliminar'}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </li>
              ))}
            </ul>
          ) : cargando ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-4 text-muted-foreground">
              <p className="mb-2">No hay comentarios aún.</p>
              <p className="text-sm">¡Sé el primero en comentar!</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Botón para cargar más comentarios */}
      {comentarios.length < totalComentarios && (
        <div className="flex justify-center mb-6">
          <Button
            onClick={() => cargarComentarios()}
            disabled={cargando}
            className="w-full"
          >
            {cargando ? 'Cargando...' : 'Cargar más comentarios'}
          </Button>
        </div>
      )}
      
      {/* Formulario para nuevo comentario */}
      {session && authUser ? (
        <div className="bg-background dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-border">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <Avatar className="w-8 h-8">
                <AvatarImage src={authUser?.avatar_url || undefined} alt={authUser?.username || 'Usuario'} />
                <AvatarFallback>{getUserInitials(authUser?.username, 1, 'U')}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <Textarea
                placeholder="Escribe un comentario..."
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                className="min-h-[80px] mb-2 bg-gray-100 dark:bg-gray-700/50 focus:bg-background dark:focus:bg-gray-800 transition-colors"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={enviarComentario} 
                  disabled={enviando || !nuevoComentario.trim()}
                  size="sm"
                  className="px-4"
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
