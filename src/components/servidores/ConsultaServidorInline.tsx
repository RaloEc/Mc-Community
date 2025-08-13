'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ServerIcon, UsersIcon, AlertCircle, CheckCircle, ArrowRightIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'

// Tipos de servidores para seleccionar al guardar
const tiposServidores = ['Supervivencia', 'Creativo', 'SkyBlock', 'PvP', 'Mods', 'Factions']

// Interfaz para la respuesta de la API de Minecraft
interface ServerResponse {
  online: boolean;
  hostname?: string;
  ip?: string;
  port?: number;
  version?: string;
  players?: {
    online?: number;
    max?: number;
  };
  motd?: {
    raw?: string[];
    clean?: string[];
    html?: string[];
  };
  favicon?: string;
  error?: string;
}

export default function ConsultaServidorInline({ onServerAdded }: { onServerAdded: () => void }) {
  // Obtener el contexto de autenticación
  const { user, session } = useAuth()
  
  const [serverIp, setServerIp] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverInfo, setServerInfo] = useState<ServerResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [step, setStep] = useState<'consulta' | 'guardar'>('consulta')
  
  // Estados para el formulario de guardar servidor
  const [serverName, setServerName] = useState('')
  const [serverDescription, setServerDescription] = useState('')
  const [serverTypes, setServerTypes] = useState<string[]>(['Supervivencia'])
  const [serverImage, setServerImage] = useState('')
  const [serverExists, setServerExists] = useState(false)
  
  // Función para consultar el estado de un servidor
  const consultarServidor = async () => {
    if (!serverIp.trim()) {
      setError('Por favor, ingresa una dirección IP o dominio válido')
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setServerInfo(null)
    setServerExists(false)
    
    try {
      // Usamos la API para consultar el estado del servidor
      const response = await fetch(`https://api.mcsrvstat.us/2/${serverIp.trim()}`)
      const data = await response.json()
      
      setServerInfo(data)
      
      if (!data.online) {
        setError('El servidor está offline o no existe')
      } else {
        // Si el servidor está online, verificamos si ya existe en la base de datos
        const exists = await verificarServidorExistente(serverIp.trim())
        setServerExists(exists)
        
        // Preparamos los datos para el formulario de guardar
        if (data.hostname || data.ip) {
          setServerName(data.hostname || data.ip || serverIp)
        }
        // Transición automática al paso de guardar para mostrar el formulario
        setStep('guardar');
      }
    } catch (err) {
      console.error('Error al consultar el servidor:', err)
      setError('Error al consultar el servidor. Intenta de nuevo más tarde.')
    } finally {
      setLoading(false)
    }
  }
  
  // Verificamos si el servidor ya existe en la base de datos
  const verificarServidorExistente = async (ip: string) => {
    try {
      // Verificar en la tabla de servidores
      const { data: servidoresData, error: servidoresError } = await supabase
        .from('servidores')
        .select('ip')
        .eq('ip', ip)
      
      if (servidoresError) {
        console.error('Error al verificar servidor existente en servidores:', servidoresError)
        return false
      }
      
      // Verificar también en la tabla de solicitudes pendientes
      const { data: solicitudesData, error: solicitudesError } = await supabase
        .from('solicitudes_servidores')
        .select('ip_servidor')
        .eq('ip_servidor', ip)
        .eq('estado', 'pendiente')
      
      if (solicitudesError) {
        console.error('Error al verificar servidor existente en solicitudes:', solicitudesError)
        return false
      }
      
      // El servidor existe si está en cualquiera de las dos tablas
      return (servidoresData && servidoresData.length > 0) || 
             (solicitudesData && solicitudesData.length > 0)
    } catch (err) {
      console.error('Error al verificar servidor existente:', err)
      return false
    }
  }
  
  // Función para guardar el servidor en la base de datos como solicitud
  const guardarServidor = async () => {
    try {
      // Verificamos si el usuario está autenticado
      if (!session?.user?.id) {
        setError('Debes iniciar sesión para enviar una solicitud de servidor.')
        return
      }
      
      // Preparamos los datos de la solicitud de servidor
      const nuevaSolicitud = {
        // Guardamos el ID del usuario autenticado
        usuario_id: session.user.id,
        nombre_servidor: serverName.trim(),
        descripcion_solicitud: serverDescription.trim() || 'Sin descripción',
        ip_servidor: serverIp.trim(),
        tipo_juego: serverTypes.join(', '), // Unimos los tipos seleccionados con coma
        version_preferida: serverInfo?.version || 'Desconocida',
        url_discord: null,
        url_web: null,
        url_imagen_logo: serverImage.trim() || null,
        estado: 'pendiente',
        motivo_rechazo: null
      }
      
      // Insertamos la solicitud en la tabla de solicitudes
      const { error: insertError } = await supabase
        .from('solicitudes_servidores')
        .insert(nuevaSolicitud)
        .select()
      
      if (insertError) {
        console.error('Error al guardar la solicitud de servidor:', insertError)
        setError('Error al enviar la solicitud. Por favor, inténtalo de nuevo más tarde.')
        return
      }
      
      // Mostramos mensaje de éxito
      setSuccessMessage('¡Solicitud enviada correctamente! Tu servidor será revisado por un administrador.')
      
      // Notificamos al componente padre que se ha añadido un servidor
      if (onServerAdded) {
        onServerAdded()
      }
      
      // Reseteamos el formulario
      setServerName('')
      setServerDescription('')
      setServerTypes(['Supervivencia'])
      setServerImage('')
      setServerIp('')
      setServerInfo(null)
      setStep('consulta')
    } catch (error) {
      console.error('Error al guardar la solicitud de servidor:', error)
      setError('Error al enviar la solicitud. Por favor, inténtalo de nuevo más tarde.')
    }
  }
  
  // Reiniciar el formulario
  const reiniciarFormulario = () => {
    setServerIp('')
    setServerInfo(null)
    setError(null)
    setStep('consulta')
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Paso 1: Consulta del servidor - En móviles siempre visible, en escritorio se reduce */}
        <div className="flex-1 md:basis-1/3">
          <Card className="dark:bg-amoled-gray/80 border dark:border-border/30">
            <CardContent className="p-4 pt-5 space-y-3">
              <h3 className="text-lg font-bold mb-2">Consultar servidor</h3>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  placeholder="IP o dominio del servidor"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value)}
                  className="dark:bg-amoled-gray/80 dark:border-border/30 w-full"
                  disabled={loading || step === 'guardar'}
                />
                <Button 
                  onClick={consultarServidor}
                  disabled={loading || step === 'guardar'}
                  className="whitespace-nowrap w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Consultando...
                    </>
                  ) : 'Consultar'}
                </Button>
              </div>
              
              {/* Resultado de la consulta */}
              {serverInfo && serverInfo.online && (
                <motion.div 
                  className="mt-4 space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                    <div className="flex items-center max-w-full overflow-hidden">
                      <ServerIcon className="mr-1.5 h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{serverInfo.hostname || serverInfo.ip}</span>
                      {serverInfo.port && serverInfo.port !== 25565 && (
                        <span className="ml-1 text-xs text-muted-foreground">:{serverInfo.port}</span>
                      )}
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">Online</span>
                  </div>

                  {/* Favicon eliminado de aquí para integrarlo con el MOTD */}
                  
                  {/* MOTD (Message of the Day) con favicon integrado */}
                  {(serverInfo.motd?.clean?.length > 0 || serverInfo.favicon) && (
                    <div className="bg-muted/50 dark:bg-amoled-gray/80 p-2 rounded-md border dark:border-border/30 my-2">
                      <div className="flex flex-row gap-2 items-center">
                        {/* Favicon del servidor */}
                        {serverInfo.favicon && (
                          <div className="flex-shrink-0">
                            <img 
                              src={serverInfo.favicon} 
                              alt="Server Favicon" 
                              className="h-10 w-10 rounded-md border dark:border-border/30 shadow-sm" 
                            />
                          </div>
                        )}
                        
                        {/* Texto del MOTD */}
                        {serverInfo.motd?.clean?.length > 0 && (
                          <div className="flex-grow overflow-hidden">
                            {serverInfo.motd.clean.map((line, index) => (
                              <p key={index} className="text-xs leading-tight truncate">{line}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground">Versión:</span>
                      <span className="ml-1 font-medium text-xs overflow-hidden text-ellipsis truncate">{serverInfo.version || 'Desconocida'}</span>
                    </div>
                    <div className="flex items-center justify-end">
                      <UsersIcon className="mr-1 h-3 w-3 text-primary" />
                      <span className="text-xs">
                        {serverInfo.players ? `${serverInfo.players.online}/${serverInfo.players.max}` : '0/0'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Información adicional */}
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground mr-1">IP:</span>
                      <span className="text-xs font-mono bg-muted/40 dark:bg-amoled-gray/80 px-1.5 py-0.5 rounded truncate max-w-full">{serverInfo.ip}</span>
                    </div>
                    {serverInfo.hostname && serverInfo.hostname !== serverInfo.ip && (
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-1">Host:</span>
                        <span className="text-xs font-mono bg-muted/40 dark:bg-amoled-gray/80 px-1.5 py-0.5 rounded truncate max-w-full">{serverInfo.hostname}</span>
                      </div>
                    )}
                  </div>
                  
                  {serverExists && (
                    <Alert variant="default" className="mt-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50">
                      <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-700 dark:text-blue-300">
                        Este servidor ya está en el directorio o pendiente de aprobación.
                      </AlertDescription>
                    </Alert>
                  )}
                </motion.div>
              )}
              
              {/* Mensaje de error */}
              {error && (
                <Alert className="mt-4 bg-destructive/20 text-destructive border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Mensaje de éxito */}
              {successMessage && (
                <Alert className="mt-4 bg-green-500/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
        
      </div>
      
      {/* Paso 2: Guardar servidor - En escritorio aparece al lado, en móvil debajo */}
      {step === 'guardar' && (
        <motion.div 
          className="flex-1 md:basis-2/3 mt-4 md:mt-0"
          initial={{ opacity: 0, y: 20, x: 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          transition={{ duration: 0.3 }}
        >
            <Card className="dark:bg-amoled-gray/80 border dark:border-border/30">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-bold mb-2 md:text-xl md:mb-4">Guardar servidor</h3>
                
                <div className="grid gap-3 md:gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                    <Label htmlFor="server-name" className="md:text-right dark:text-gray-300">
                      Nombre
                    </Label>
                    <Input
                      id="server-name"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      className="md:col-span-3 dark:bg-amoled-gray/80 dark:border-border/30 dark:text-gray-200"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                    <Label htmlFor="server-description" className="md:text-right dark:text-gray-300">
                      Descripción
                    </Label>
                    <Textarea
                      id="server-description"
                      value={serverDescription}
                      onChange={(e) => setServerDescription(e.target.value)}
                      className="md:col-span-3 dark:bg-amoled-gray/80 dark:border-border/30 dark:text-gray-200"
                      placeholder="Describe brevemente este servidor..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                    <Label htmlFor="server-image" className="md:text-right dark:text-gray-300">
                      Imagen URL
                    </Label>
                    <Input
                      id="server-image"
                      value={serverImage}
                      onChange={(e) => setServerImage(e.target.value)}
                      className="md:col-span-3 dark:bg-amoled-gray/80 dark:border-border/30 dark:text-gray-200"
                      placeholder="https://ejemplo.com/imagen.png (opcional)"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('consulta')}
                    className="dark:border-border/30 dark:bg-amoled-gray/80 dark:hover:bg-amoled-gray dark:text-gray-200"
                  >
                    Volver
                  </Button>
                  <Button 
                    onClick={guardarServidor}
                    className="dark:bg-primary dark:hover:bg-primary/90 dark:text-white"
                  >
                    Guardar servidor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      
      {(serverInfo || error) && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="ghost" 
            onClick={reiniciarFormulario}
            className="text-muted-foreground"
          >
            Reiniciar formulario
          </Button>
        </div>
      )}
    </div>
  )
}
