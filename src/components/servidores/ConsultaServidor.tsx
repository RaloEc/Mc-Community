'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ServerIcon, UsersIcon, AlertCircle, CheckCircle } from 'lucide-react'

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

interface ConsultaServidorProps {
  onServerDataFetched: (data: { ip: string; name?: string; description?: string; version?: string; type?: string; imageUrl?: string }) => void;
  className?: string;
}

export default function ConsultaServidor({ onServerDataFetched, className }: ConsultaServidorProps) {
  const [serverIp, setServerIp] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverInfo, setServerInfo] = useState<ServerResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  
  // Función para consultar el estado de un servidor
  const consultarServidor = async () => {
    if (!serverIp.trim()) {
      setError('Por favor, ingresa una dirección IP o dominio válido')
      return
    }
    
    setLoading(true)
    setError(null)
    setServerInfo(null)
    
    try {
      // Usamos la API de mc-api.net para consultar el estado del servidor
      const response = await fetch(`https://api.mcsrvstat.us/2/${serverIp.trim()}`)
      const data = await response.json()
      
      setServerInfo(data)
      
      if (!data.online) {
        setError('El servidor está offline o no existe')
      } else {
        // Servidor online, pasar datos a través del callback
        onServerDataFetched({
          ip: serverIp.trim(),
          name: data.hostname || data.ip || serverIp.trim(),
          // Aquí podrías intentar extraer una descripción del MOTD si es relevante
          // description: data.motd?.clean?.[0] || '', 
          version: data.version,
          // El tipo y la URL de la imagen no vienen directamente de esta API,
          // se manejarán en el formulario.
        });
      }
    } catch (err) {
      console.error('Error al consultar el servidor:', err)
      setError('Error al consultar el servidor. Intenta de nuevo más tarde.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <Card className="dark:bg-amoled-gray dark:border-border/30">
        <CardHeader className="dark:bg-amoled-gray">
          <CardTitle className="dark:text-gray-200">Consultar estado de servidor</CardTitle>
        </CardHeader>
        <CardContent className="dark:bg-amoled-gray">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="IP o dominio del servidor (ej: play.hypixel.net)"
                value={serverIp}
                onChange={(e) => setServerIp(e.target.value)}
                className="w-full dark:bg-amoled-gray/80 dark:border-border/30 dark:text-gray-200 dark:placeholder:text-gray-500"
              />
            </div>
            <Button 
              onClick={consultarServidor} 
              disabled={loading || !serverIp.trim()}
              className="dark:bg-primary dark:hover:bg-primary/90 dark:text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Consultando...
                </>
              ) : (
                'Consultar'
              )}
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300">
              <AlertCircle className="h-4 w-4 dark:text-red-400" />
              <AlertDescription className="dark:text-red-300">{error}</AlertDescription>
            </Alert>
          )}
          
          {serverInfo && serverInfo.online && (
            <div className="mt-6 space-y-4">
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-400">
                  ¡Servidor online!
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-md bg-accent/50 dark:bg-amoled-gray/80 dark:border dark:border-border/30">
                  <ServerIcon className="h-5 w-5 text-muted-foreground dark:text-gray-400" />
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Versión</p>
                    <p className="text-sm font-medium dark:text-gray-200">{serverInfo.version || 'Desconocida'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-md bg-accent/50 dark:bg-amoled-gray/80 dark:border dark:border-border/30">
                  <UsersIcon className="h-5 w-5 text-muted-foreground dark:text-gray-400" />
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Jugadores</p>
                    <p className="text-sm font-medium dark:text-gray-200">
                      {serverInfo.players ? `${serverInfo.players.online}/${serverInfo.players.max}` : '0/0'}
                    </p>
                  </div>
                </div>
              </div>
              
              {serverInfo.motd && serverInfo.motd.clean && (
                <div className="p-3 rounded-md bg-accent/50 dark:bg-amoled-gray/80 dark:border dark:border-border/30">
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mb-1">Mensaje del día (MOTD)</p>
                  {serverInfo.motd.clean.map((line, index) => (
                    <p key={index} className="text-sm dark:text-gray-200">{line}</p>
                  ))}
                </div>
              )}

            </div>
          )}
          
          {serverInfo && !serverInfo.online && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                El servidor está offline o no existe
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* El diálogo para guardar servidor ha sido movido a FormularioServidor.tsx */}
    </div>
  )
}
