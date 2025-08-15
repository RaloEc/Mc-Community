'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { Comentario } from '@/types/comentarios'
import { formatDistanceToNow, format, differenceInHours } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageSquare, Send, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './comentarios-nuevo.css'

interface ComentariosProps {
  tipoEntidad: string
  entidadId: string
  limite?: number
}

export default function Comentarios({ tipoEntidad, entidadId, limite = 10 }: ComentariosProps) {
  const comentariosListaRef = useRef<HTMLDivElement>(null)
  const [mostrarIndicador, setMostrarIndicador] = useState(false)
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
  const [orden, setOrden] = useState('desc') // 'desc' para más recientes, 'asc' para más antiguos

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
  const cargarComentarios = async (reemplazar = false) => {
    try {
      setCargando(true)
      setError(null)
      
      const baseUrl = getBaseUrl()
      const url = `${baseUrl}/api/comentarios?tipo_entidad=${tipoEntidad}&entidad_id=${entidadId}&limite=${limite}&offset=${reemplazar ? 0 : offset}&orden=${orden}`
      
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
      setOffset(prevOffset => (reemplazar ? 0 : prevOffset) + (datos.data?.length || 0))
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
          usuario_id: authUser.id || session.user.id
        }),
      })
      
      const datos = await respuesta.json()
      
      if (!respuesta.ok) {
        throw new Error(datos.error || 'Error al enviar comentario')
      }
      
      // Añadir el nuevo comentario al principio de la lista
      setComentarios(prevComentarios => [datos.data, ...prevComentarios])
      setTotalComentarios(prevTotal => prevTotal + 1)
      setNuevoComentario('')
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
      
      // Añadir la nueva respuesta al principio de la lista para visibilidad inmediata
      setComentarios(prevComentarios => [datos.data, ...prevComentarios])
      setTotalComentarios(prevTotal => prevTotal + 1)
      setRespuesta('')
      setRespondiendo(null)
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
      
      // Actualizar el comentario en la lista
      setComentarios(prevComentarios => 
        prevComentarios.map(c => c.id === id ? { ...c, ...datos.data } : c)
      )
      setComentarioEditando(null)
      setContenidoEditado('')
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
      
      // Eliminar el comentario de la lista
      setComentarios(prevComentarios => prevComentarios.filter(c => c.id !== id))
      setTotalComentarios(prevTotal => prevTotal - 1)
    } catch (err) {
      console.error('Error al eliminar comentario:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setEliminando(false)
    }
  }

  // Cargar comentarios al montar el componente o al cambiar el orden
  useEffect(() => {
    setOffset(0)
    cargarComentarios(true)
  }, [tipoEntidad, entidadId, session, orden])
  
  // Comprobar si hay suficientes comentarios para mostrar el indicador
  useEffect(() => {
    const comprobarScroll = () => {
      if (comentariosListaRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = comentariosListaRef.current
        
        // Calcular si estamos cerca del final del scroll (con un margen de 5px)
        const estaAlFinal = Math.abs((scrollTop + clientHeight) - scrollHeight) < 5
        
        // Solo mostrar el indicador si hay más contenido por ver Y no estamos al final
        const hayMasContenido = scrollHeight > clientHeight
        
        setMostrarIndicador(hayMasContenido && !estaAlFinal)
      }
    }
    
    // Comprobar después de que los comentarios se hayan cargado
    setTimeout(comprobarScroll, 100) // Pequeño retraso para asegurar que el DOM está actualizado
    
    // Volver a comprobar cuando se hace scroll
    const elemento = comentariosListaRef.current
    if (elemento) {
      elemento.addEventListener('scroll', comprobarScroll)
    }
    
    // Volver a comprobar si cambia el tamaño de la ventana
    window.addEventListener('resize', comprobarScroll)
    
    // Comprobar periódicamente (por si acaso)
    const intervalo = setInterval(comprobarScroll, 500)
    
    return () => {
      window.removeEventListener('resize', comprobarScroll)
      if (elemento) {
        elemento.removeEventListener('scroll', comprobarScroll)
      }
      clearInterval(intervalo)
    }
  }, [comentarios])
  
  // Función para desplazarse hacia abajo
  const scrollHaciaAbajo = () => {
    if (comentariosListaRef.current) {
      comentariosListaRef.current.scrollBy({
        top: 200,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto comentarios-container">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Comentarios ({totalComentarios})</h2>
        <Button variant="outline" size="sm" onClick={() => setOrden(orden === 'desc' ? 'asc' : 'desc')}>
          {orden === 'desc' ? 'Más recientes primero' : 'Más antiguos primero'}
        </Button>
      </div>
      
      {/* Mensajes de error */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {/* Formulario para nuevo comentario */}
      {session && authUser ? (
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 self-start mt-3">
              {authUser?.avatar_url ? (
                <div className="w-8 h-8 overflow-hidden rounded-full">
                  <img
                    src={authUser.avatar_url}
                    alt="Tu avatar"
                    className="w-full h-full object-cover object-center"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-blue-400 dark:border-blue-600">
                  {authUser?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="rounded-lg">
                <textarea
                  placeholder="Escribe un comentario..."
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  className="w-full min-h-[80px] bg-transparent resize-none outline-none text-foreground dark:text-gray-200 border-2 border-blue-400 dark:border-blue-600 rounded-md p-3 focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    onClick={enviarComentario} 
                    disabled={enviando || !nuevoComentario.trim()}
                    size="sm"
                    className="px-4 flex items-center gap-1"
                  >
                    {enviando ? 'Enviando...' : (
                      <>
                        <Send size={16} className="mr-1" />
                        Comentar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-background dark:bg-gray-800 rounded-lg p-4 text-center shadow-md border border-border mb-6">
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
      
      {/* Lista de comentarios con altura máxima */}
      <div className="relative">
        <div ref={comentariosListaRef} className="comentarios-lista space-y-6">
          {cargando && comentarios.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : comentarios.length > 0 ? (
            comentarios.map((comentario) => (
            <div key={comentario.id} className="comentario-item">
              {/* Comentario principal */}
              <div className="flex items-start space-x-3">
                <div className="relative">
                  {comentario.perfiles?.avatar_url ? (
                    <div className="w-10 h-10 overflow-hidden rounded-full">
                      <img
                        src={comentario.perfiles.avatar_url}
                        alt={`Avatar de ${comentario.perfiles.username || 'usuario'}`}
                        className="w-full h-full object-cover object-center"
                        crossOrigin="anonymous"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                      {comentario.perfiles?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <Link href={`/perfil/${comentario.perfiles?.username}`} className="font-semibold text-sm text-foreground hover:underline [.amoled_&]:!text-white">
                          {comentario.perfiles?.username || 'Usuario desconocido'}
                        </Link>
                        {comentario.perfiles?.role === 'admin' && (
                          <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground dark:text-gray-400 text-xs">
                        {formatearFecha(comentario.created_at)}
                        {comentario.updated_at !== comentario.created_at && (
                          <span className="ml-1 italic">(editado)</span>
                        )}
                      </span>
                    </div>
                    
                    {comentarioEditando === comentario.id ? (
                      <div className="mt-2">
                        <textarea
                          value={contenidoEditado}
                          onChange={(e) => setContenidoEditado(e.target.value)}
                          className="w-full min-h-[80px] bg-gray-50 dark:bg-gray-700 rounded p-2 resize-none outline-none text-foreground dark:text-gray-200 mb-2"
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
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert amoled:prose-invert amoled:[--tw-prose-body:theme(colors.white)] amoled:[--tw-prose-headings:theme(colors.white)] amoled:[--tw-prose-quotes:theme(colors.white)] amoled:[--tw-prose-bullets:theme(colors.slate.300)] amoled:[--tw-prose-links:theme(colors.sky.400)]"
                        dangerouslySetInnerHTML={{ __html: comentario.contenido }} 
                      />
                    )}
                  </div>
                  
                  {/* Botones de acciones */}
                  <div className="flex items-center mt-1 ml-2 text-muted-foreground dark:text-gray-400">
                    {/* Botón de responder */}
                    {authUser && !comentarioEditando && (
                      <button 
                        onClick={() => {
                          setRespondiendo(respondiendo === comentario.id ? null : comentario.id)
                          setRespuesta('')
                        }}
                        className="flex items-center text-xs hover:text-foreground dark:hover:text-gray-200 mr-3"
                      >
                        <MessageSquare size={14} className="mr-1" />
                        {respondiendo === comentario.id ? 'Cancelar' : 'Responder'}
                      </button>
                    )}
                    
                    {/* Botones de editar y eliminar */}
                    {authUser && (authUser.id === comentario.usuario_id || authUser.role === 'admin') && !comentarioEditando && (
                      <>
                        <button 
                          onClick={() => {
                            setComentarioEditando(comentario.id)
                            setContenidoEditado(comentario.contenido)
                          }}
                          className="flex items-center text-xs hover:text-foreground dark:hover:text-gray-200 mr-3"
                        >
                          <Pencil size={14} className="mr-1" />
                          Editar
                        </button>
                        <button 
                          onClick={() => eliminarComentario(comentario.id)}
                          disabled={eliminando}
                          className="flex items-center text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400"
                        >
                          {eliminando ? (
                            <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Trash2 size={14} className="mr-1" />
                          )}
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Formulario de respuesta */}
              {respondiendo === comentario.id && (
                <div className="mt-3 ml-10 animate-fadeIn">
                  <div className="rounded-lg p-3 shadow-sm">
                    <textarea
                      placeholder="Escribe tu respuesta..."
                      value={respuesta}
                      onChange={(e) => setRespuesta(e.target.value)}
                      className="w-full bg-transparent min-h-[40px] outline-none text-sm resize-none text-foreground dark:text-gray-200 mb-2"
                      autoFocus
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={() => setRespondiendo(null)}
                        className="text-xs mr-2 text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={enviarRespuesta}
                        disabled={enviando || !respuesta.trim()}
                        className={`flex items-center text-xs px-3 py-1 rounded ${respuesta.trim() ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
                      >
                        <Send size={14} className="mr-1" />
                        {enviando ? 'Enviando...' : 'Responder'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Respuestas a este comentario */}
              {comentario.respuestas && comentario.respuestas.length > 0 && (
                <div className="mt-3 space-y-3">
                  {comentario.respuestas.map((respuestaItem) => (
                    <div key={respuestaItem.id} className="ml-10 relative">
                      <div className="rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                            <div className="mr-2">
                              {respuestaItem.perfiles?.avatar_url ? (
                                <div className="w-6 h-6 overflow-hidden rounded-full">
                                  <img
                                    src={respuestaItem.perfiles.avatar_url}
                                    alt={`Avatar de ${respuestaItem.perfiles.username || 'usuario'}`}
                                    className="w-full h-full object-cover object-center"
                                    crossOrigin="anonymous"
                                  />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
                                  {respuestaItem.perfiles?.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              )}
                            </div>
                            <span className="font-medium text-foreground dark:text-gray-200 [.amoled_&]:!text-white">
                              {respuestaItem.perfiles?.username || 'Usuario'}
                              {respuestaItem.perfiles?.role === 'admin' && (
                                <span className="ml-2 text-xs bg-primary text-white px-1.5 py-0.5 rounded-full">
                                  Admin
                                </span>
                              )}
                            </span>
                          </div>
                          <span className="text-muted-foreground dark:text-gray-400 text-xs">
                            {formatearFecha(respuestaItem.created_at)}
                          </span>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none mt-1 [.amoled_&]:[&_*]:!text-white" 
                          dangerouslySetInnerHTML={{ __html: respuestaItem.contenido }} 
                        />
                      </div>
                      
                      {/* Botones de acciones para respuestas */}
                      {authUser && (authUser.id === respuestaItem.usuario_id || authUser.role === 'admin') && (
                        <div className="flex items-center mt-1 ml-2 text-muted-foreground dark:text-gray-400">
                          <button 
                            onClick={() => eliminarComentario(respuestaItem.id)}
                            disabled={eliminando}
                            className="flex items-center text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400"
                          >
                            {eliminando ? (
                              <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Trash2 size={14} className="mr-1" />
                            )}
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground dark:text-gray-400">
            <p className="mb-2">No hay comentarios aún.</p>
            <p className="text-sm">¡Sé el primero en comentar!</p>
          </div>
        )}
        </div>
        
        {/* Indicador de desplazamiento */}
        {mostrarIndicador && (
          <button 
            className="scroll-indicator" 
            onClick={scrollHaciaAbajo}
            aria-label="Desplazar hacia abajo"
          >
            <ChevronDown size={20} />
          </button>
        )}
      </div>
      
      {/* Botón para cargar más comentarios */}
      {comentarios.length < totalComentarios && (
        <div className="text-center mt-6">
          <Button
            onClick={() => cargarComentarios(false)}
            disabled={cargando}
            variant="outline"
          >
            {cargando ? 'Cargando...' : 'Cargar más comentarios'}
          </Button>
        </div>
      )}
    </div>
  );
}
