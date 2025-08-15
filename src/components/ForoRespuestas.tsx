'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/components/theme-provider'
import Link from 'next/link'
import { formatDistanceToNow, format, differenceInHours } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageSquare, Send, Pencil, Trash2, ChevronDown, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { MagicMotion } from 'react-magic-motion'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Database } from '@/lib/database.types'

// Estilos para el scrollbar
const scrollbarStyles = `
  .respuestas-container::-webkit-scrollbar {
    width: 8px;
  }
  
  .respuestas-container::-webkit-scrollbar-track {
    background: hsl(var(--muted));
    border-radius: 4px;
  }
  
  .respuestas-container::-webkit-scrollbar-thumb {
    background-color: hsl(var(--primary) / 0.3);
    border-radius: 4px;
  }
  
  .respuestas-container::-webkit-scrollbar-thumb:hover {
    background-color: hsl(var(--primary) / 0.5);
  }
  
  .scroll-indicator {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: hsl(var(--primary));
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    opacity: 0.8;
    transition: opacity 0.2s;
    z-index: 10;
  }
  
  .scroll-indicator:hover {
    opacity: 1;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-in-out;
  }
`;

type PostRow = Database['public']['Tables']['foro_posts']['Row'];
type PerfilRow = Database['public']['Tables']['perfiles']['Row'];

interface PostConAutor extends PostRow {
  autor: PerfilRow;
  usuario_id?: string; // Añadimos esta propiedad para compatibilidad
}

interface ForoRespuestasProps {
  hiloId: string
  limite?: number
}

// Componente para mostrar el contenido de las respuestas con el color adecuado según el tema
interface RespuestaContenidoProps {
  contenido: string;
}

function RespuestaContenido({ contenido }: RespuestaContenidoProps) {
  const { theme } = useTheme();
  
  // Determinar el color del texto basado en el tema actual
  const textColor = theme === 'light' ? '#000000' : theme === 'amoled' ? '#ffffff' : '#e5e7eb';
  
  // Crear un estilo personalizado para el contenido
  const customStyle = {
    color: textColor,
    // Asegurar que todos los elementos dentro del contenido HTML hereden el color
    '--tw-prose-body': textColor,
    '--tw-prose-headings': textColor,
    '--tw-prose-lead': textColor,
    '--tw-prose-links': textColor,
    '--tw-prose-bold': textColor,
    '--tw-prose-counters': textColor,
    '--tw-prose-bullets': textColor,
    '--tw-prose-hr': textColor,
    '--tw-prose-quotes': textColor,
    '--tw-prose-quote-borders': textColor,
    '--tw-prose-captions': textColor,
    '--tw-prose-code': textColor,
    '--tw-prose-pre-code': textColor,
    '--tw-prose-th-borders': textColor,
    '--tw-prose-td-borders': textColor,
    // FIX: Forzar el ajuste de línea y el salto de palabra para respuestas largas
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  } as React.CSSProperties;
  
  return (
    <div 
      className="prose prose-sm max-w-none"
      style={customStyle}
      dangerouslySetInnerHTML={{ __html: contenido }} 
    />
  );
}

const MAX_CARACTERES_RESPUESTA = 1000;

export default function ForoRespuestas({ hiloId, limite = 6 }: ForoRespuestasProps) {
  const respuestasListaRef = useRef<HTMLDivElement>(null)
  const [mostrarIndicador, setMostrarIndicador] = useState(false)
  const { session, user: authUser } = useAuth()
  const [respuestas, setRespuestas] = useState<PostConAutor[]>([])
  const [cargando, setCargando] = useState(true)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nuevaRespuesta, setNuevaRespuesta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalRespuestas, setTotalRespuestas] = useState(0)
  const [lotesCargados, setLotesCargados] = useState(1)
  const [scrollInfinitoActivo, setScrollInfinitoActivo] = useState(false)
  const [todasCargadas, setTodasCargadas] = useState(false)
  const [respuestaEditando, setRespuestaEditando] = useState<string | null>(null)
  const [contenidoEditado, setContenidoEditado] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [respondiendo, setRespondiendo] = useState<string | null>(null)
  const [respuesta, setRespuesta] = useState('')
  const [orden, setOrden] = useState('desc') // 'desc' para más recientes, 'asc' para más antiguos
  const [respuestaParaEliminar, setRespuestaParaEliminar] = useState<string | null>(null)

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

  // Cargar respuestas
  const cargarRespuestas = useCallback(async (incremental = false) => {
    try {
      if (incremental) {
        setCargandoMas(true)
      } else {
        setCargando(true)
      }
      setError(null)

      const currentOffset = (paginaActual - 1) * limite;
      const baseUrl = getBaseUrl()
      const url = `${baseUrl}/api/foro/hilo/${hiloId}/posts?limite=${limite}&offset=${currentOffset}&orden=${orden}`
      
      const respuesta = await fetch(url)
      const datos = await respuesta.json()
      
      if (!respuesta.ok) {
        throw new Error(datos.error || 'Error al cargar respuestas')
      }

      // Si es incremental, añadimos las nuevas respuestas a las existentes
      if (incremental && paginaActual > 1) {
        setRespuestas(prevRespuestas => [...prevRespuestas, ...(datos.data || [])])
      } else {
        setRespuestas(datos.data || [])
      }
      
      setTotalRespuestas(datos.total || 0)
      
      // Verificar si hemos cargado todas las respuestas disponibles
      const nuevasCargadas = datos.data?.length || 0
      if (nuevasCargadas < limite || currentOffset + nuevasCargadas >= (datos.total || 0)) {
        setTodasCargadas(true)
      } else {
        setTodasCargadas(false)
      }

    } catch (err) {
      console.error('Error al cargar respuestas:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setCargando(false)
      setCargandoMas(false)
    }
  }, [hiloId, limite, orden, paginaActual])

  // Enviar una nueva respuesta con animación
  const enviarRespuesta = async () => {
    if (!nuevaRespuesta.trim() || !session || !authUser) return
    
    try {
      setEnviando(true)
      
      const baseUrl = getBaseUrl()
      const respuesta = await fetch(`${baseUrl}/api/foro/hilo/${hiloId}/responder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contenido: nuevaRespuesta,
          usuario_id: authUser.id || session.user.id
        }),
      })
      
      const datos = await respuesta.json()
      
      if (!respuesta.ok) {
        throw new Error(datos.error || 'Error al enviar respuesta')
      }
      
      // En lugar de añadir localmente, recargamos todo para asegurar consistencia
      setNuevaRespuesta('');
      if (paginaActual === 1) {
        await cargarRespuestas(); // Refrescar la página actual si ya es la primera
      } else {
        setPaginaActual(1); // Ir a la primera página para ver la nueva respuesta
      }

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

  // Editar una respuesta existente
  const editarRespuesta = async (id: string) => {
    if (!contenidoEditado.trim() || !session || !authUser) return
    
    try {
      setEnviando(true)
      
      const baseUrl = getBaseUrl()
      const respuesta = await fetch(`${baseUrl}/api/foro/hilo/${hiloId}/post/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contenido: contenidoEditado,
          usuario_id: authUser.id || session.user.id
        }),
      })
      
      const datos = await respuesta.json()
      
      if (!respuesta.ok) {
        throw new Error(datos.error || 'Error al editar respuesta')
      }
      
      // Actualizar la respuesta en la lista
      setRespuestas(prevRespuestas => 
        prevRespuestas.map(r => r.id === id ? { ...r, ...datos.data } : r)
      )
      setRespuestaEditando(null)
      setContenidoEditado('')
    } catch (err) {
      console.error('Error al editar respuesta:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setEnviando(false)
    }
  }

  // Eliminar una respuesta con animación
  const eliminarRespuesta = async (id: string) => {
    if (!session || !authUser) return
    
    try {
      setEliminando(true)
      
      const baseUrl = getBaseUrl()
      const userId = authUser.id || session.user.id
      const respuesta = await fetch(`${baseUrl}/api/foro/hilo/${hiloId}/post/${id}?usuario_id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const datos = await respuesta.json()
      
      if (!respuesta.ok) {
        throw new Error(datos.error || 'Error al eliminar respuesta')
      }
      
      // Eliminar la respuesta de la lista
      setRespuestas(prevRespuestas => prevRespuestas.filter(r => r.id !== id))
      setTotalRespuestas(prevTotal => prevTotal - 1)
    } catch (err) {
      console.error('Error al eliminar respuesta:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setEliminando(false)
    }
  }

  // Cargar más respuestas
  const cargarMasRespuestas = () => {
    if (cargandoMas || todasCargadas) return;
    
    setLotesCargados(prev => prev + 1);
    setPaginaActual(prev => prev + 1);
    
    // Activar scroll infinito después de cargar 2 lotes manualmente
    if (lotesCargados >= 2 && !scrollInfinitoActivo) {
      setScrollInfinitoActivo(true);
    }
  };
  
  // Detectar cuando el usuario llega al final para cargar más (scroll infinito)
  const detectarFinalScroll = useCallback(() => {
    if (!scrollInfinitoActivo || cargandoMas || todasCargadas) return;
    
    const elemento = respuestasListaRef.current;
    if (!elemento) return;
    
    const { scrollTop, scrollHeight, clientHeight } = elemento;
    // Si estamos a 200px o menos del final, cargar más
    if (scrollHeight - scrollTop - clientHeight <= 200) {
      cargarMasRespuestas();
    }
  }, [scrollInfinitoActivo, cargandoMas, todasCargadas]);
  
  // Efecto inicial para cargar respuestas
  useEffect(() => {
    // Solo llamamos a cargarRespuestas directamente cuando cambia el orden o es la primera carga
    if (paginaActual === 1) {
      cargarRespuestas(false);
    } else {
      // Para páginas posteriores, cargamos de forma incremental
      cargarRespuestas(true);
    }
  }, [orden, cargarRespuestas]);
  
  // Efecto para detectar scroll cuando está activo el scroll infinito
  useEffect(() => {
    const elemento = respuestasListaRef.current;
    if (elemento && scrollInfinitoActivo) {
      elemento.addEventListener('scroll', detectarFinalScroll);
      return () => elemento.removeEventListener('scroll', detectarFinalScroll);
    }
  }, [scrollInfinitoActivo, detectarFinalScroll]);
  
  // Comprobar si hay suficientes respuestas para mostrar el indicador
  useEffect(() => {
    const comprobarScroll = () => {
      if (respuestasListaRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = respuestasListaRef.current
        
        // Calcular si estamos cerca del final del scroll (con un margen de 5px)
        const estaAlFinal = Math.abs((scrollTop + clientHeight) - scrollHeight) < 5
        
        // Solo mostrar el indicador si hay más contenido por ver Y no estamos al final
        const hayMasContenido = scrollHeight > clientHeight
        
        setMostrarIndicador(hayMasContenido && !estaAlFinal)
      }
    }
    
    // Comprobar después de que las respuestas se hayan cargado
    setTimeout(comprobarScroll, 100) // Pequeño retraso para asegurar que el DOM está actualizado
    
    // Volver a comprobar cuando se hace scroll
    const elemento = respuestasListaRef.current
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
  }, [respuestas])
  
  // Función para desplazarse hacia abajo
  const scrollHaciaAbajo = () => {
    if (respuestasListaRef.current) {
      respuestasListaRef.current.scrollBy({
        top: 200,
        behavior: 'smooth'
      })
    }
  }

  const totalPaginas = Math.ceil(totalRespuestas / limite);
  
  // Reiniciar la paginación cuando cambia el orden
  const cambiarOrden = () => {
    // Reiniciar estados de paginación
    setRespuestas([]);
    setPaginaActual(1);
    setLotesCargados(1);
    setScrollInfinitoActivo(false);
    setTodasCargadas(false);
    setOrden(orden === 'desc' ? 'asc' : 'desc');
  };

  const handleEliminar = async () => {
    if (!respuestaParaEliminar) return

    try {
      const baseUrl = getBaseUrl()
      const userId = authUser.id || session.user.id
      const respuesta = await fetch(`${baseUrl}/api/foro/hilo/${hiloId}/post/${respuestaParaEliminar}?usuario_id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const datos = await respuesta.json()
      
      if (!respuesta.ok) {
        throw new Error(datos.error || 'Error al eliminar respuesta')
      }
      
      // Recargar la página actual para reflejar la eliminación
      if (respuestas.length === 1 && paginaActual > 1) {
        setPaginaActual(paginaActual - 1); // Ir a la página anterior si era el último item
      } else {
        cargarRespuestas();
      }
    } catch (err) {
      console.error('Error al eliminar respuesta:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setRespuestaParaEliminar(null)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto respuestas-container">
      <style jsx global>{scrollbarStyles}</style>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Respuestas ({totalRespuestas})</h2>
        <Button variant="outline" size="sm" onClick={cambiarOrden}>
          {orden === 'desc' ? 'Más recientes primero' : 'Más antiguos primero'}
        </Button>
      </div>
      
      {/* Mensajes de error */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {/* Formulario para nueva respuesta */}
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
                  placeholder="Escribe una respuesta..."
                  value={nuevaRespuesta}
                  onChange={(e) => setNuevaRespuesta(e.target.value)}
                  maxLength={MAX_CARACTERES_RESPUESTA}
                  className="w-full min-h-[80px] bg-transparent resize-none outline-none text-foreground dark:text-gray-200 border-2 border-blue-400 dark:border-blue-600 rounded-md p-3 focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${nuevaRespuesta.length > MAX_CARACTERES_RESPUESTA ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {MAX_CARACTERES_RESPUESTA - nuevaRespuesta.length} caracteres restantes
                  </span>
                  <Button 
                    onClick={enviarRespuesta} 
                    disabled={enviando || !nuevaRespuesta.trim() || nuevaRespuesta.length > MAX_CARACTERES_RESPUESTA}
                    size="sm"
                    className="px-4 flex items-center gap-1"
                  >
                    {enviando ? 'Enviando...' : (
                      <>
                        <Send size={16} className="mr-1" />
                        Responder
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
          <p className="mb-2">Inicia sesión para dejar una respuesta</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = `/login?redirect=/foro/hilo/${hiloId}`}
            size="sm"
          >
            Iniciar sesión
          </Button>
        </div>
      )}

      {/* Lista de respuestas con altura máxima */}
      <div className="relative">
        <div ref={respuestasListaRef} className="respuestas-lista space-y-6 max-h-[600px] overflow-y-auto pr-2">
          {cargando && respuestas.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : respuestas.length > 0 ? (
            <MagicMotion 
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="space-y-6">
                {respuestas.map((respuestaItem) => {
                  // FIX: Comprobar si el autor existe antes de renderizar
                  if (!respuestaItem.autor) {
                    return (
                      <motion.div
                        key={`loading-${respuestaItem.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="respuesta-item bg-card/50 p-4 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-gray-700 rounded-full animate-pulse"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse"></div>
                            <div className="h-8 bg-gray-700 rounded w-full animate-pulse"></div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <div key={respuestaItem.id} className="respuesta-item bg-card/50 p-4 rounded-lg hover:bg-card/80 transition-all">
                  <div className="flex items-start space-x-3">
                    <Avatar>
                      <AvatarImage src={respuestaItem.autor.avatar_url ?? undefined} alt={`Avatar de ${respuestaItem.autor.username}`} crossOrigin="anonymous" />
                      <AvatarFallback>{respuestaItem.autor.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                            <Link href={`/perfil/${respuestaItem.autor.username}`} className="font-semibold text-sm text-foreground hover:underline [.amoled_&]:!text-white">
                              {respuestaItem.autor.username || 'Usuario desconocido'}
                            </Link>
                            {respuestaItem.autor.role === 'admin' && (
                              <Badge variant="default" className="ml-2 scale-75">Admin</Badge>
                            )}
                          </div>
                          <span className="text-muted-foreground dark:text-gray-400 text-xs">
                            {formatearFecha(respuestaItem.created_at)}
                            {respuestaItem.updated_at !== respuestaItem.created_at && (
                              <span className="ml-1 italic">(editado)</span>
                            )}
                          </span>
                        </div>
                        {respuestaEditando === respuestaItem.id ? (
                          <div className="mt-2">
                            <Textarea
                              value={contenidoEditado}
                              onChange={(e) => setContenidoEditado(e.target.value)}
                              maxLength={MAX_CARACTERES_RESPUESTA}
                              className="w-full min-h-[80px] bg-gray-50 dark:bg-gray-700 rounded p-2 resize-none outline-none text-foreground dark:text-gray-200 mb-2"
                            />
                            <div className="flex justify-between items-center gap-2">
                               <span className={`text-xs ${contenidoEditado.length > MAX_CARACTERES_RESPUESTA ? 'text-red-500' : 'text-muted-foreground'}`}>
                                {MAX_CARACTERES_RESPUESTA - contenidoEditado.length} caracteres restantes
                              </span>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => { setRespuestaEditando(null); setContenidoEditado(''); }}>
                                  Cancelar
                                </Button>
                                <Button size="sm" onClick={() => editarRespuesta(respuestaItem.id)} disabled={enviando || !contenidoEditado.trim() || contenidoEditado.length > MAX_CARACTERES_RESPUESTA}>
                                  {enviando ? 'Guardando...' : 'Guardar'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <RespuestaContenido contenido={respuestaItem.contenido} />
                        )}
                      </div>
                      {authUser && (authUser.id === respuestaItem.autor_id || authUser.role === 'admin') && !respuestaEditando && (
                        <div className="flex items-center mt-1 ml-2 text-muted-foreground dark:text-gray-400">
                          <button onClick={() => { setRespuestaEditando(respuestaItem.id); setContenidoEditado(respuestaItem.contenido); }} className="flex items-center text-xs hover:text-foreground dark:hover:text-gray-200 mr-3">
                            <Pencil size={14} className="mr-1" />
                            Editar
                          </button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-400" onClick={() => setRespuestaParaEliminar(respuestaItem.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
                })}
              </div>
            </MagicMotion>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground dark:text-gray-400">
              <p className="mb-2">No hay respuestas aún.</p>
              <p className="text-sm">¡Sé el primero en responder!</p>
            </div>
          )}
        </div>
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
      
      {/* Botón Cargar Más */}
      {!todasCargadas && respuestas.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button 
            onClick={cargarMasRespuestas} 
            disabled={cargandoMas}
            variant="outline"
            className="relative min-w-[180px]"
          >
            {cargandoMas ? (
              <>
                <span className="opacity-0">Cargando más respuestas</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              </>
            ) : (
              <>
                Cargar más respuestas 
                {scrollInfinitoActivo && <span className="ml-1 text-xs opacity-70">(Scroll infinito activado)</span>}
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* Mensaje cuando todas las respuestas están cargadas */}
      {todasCargadas && respuestas.length > limite && (
        <div className="text-center text-sm text-muted-foreground mt-6">
          <p>Has llegado al final - Todas las respuestas están cargadas</p>
        </div>
      )}

      <MagicMotion transition={{ type: "spring", stiffness: 350, damping: 25 }}>
        <Dialog open={!!respuestaParaEliminar} onOpenChange={(open) => !open && setRespuestaParaEliminar(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2 text-yellow-400" />
                Confirmar eliminación
              </DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar esta respuesta? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setRespuestaParaEliminar(null)}>Cancelar</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleEliminar}>
                Confirmar Borrado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </MagicMotion>
    </div>
  )
}
