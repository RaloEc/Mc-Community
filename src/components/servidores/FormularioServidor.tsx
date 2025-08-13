'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

const tiposServidores = ['Supervivencia', 'Creativo', 'SkyBlock', 'PvP', 'Mods', 'Factions']

interface FormularioServidorProps {
  serverIpForForm: string | null; // IP del servidor consultado, para guardar
  initialName?: string;
  initialDescription?: string;
  initialType?: string;
  initialImageUrl?: string;
  onServerSaved: () => void; // Callback cuando el servidor se guarda
  className?: string;
}

export default function FormularioServidor({
  serverIpForForm,
  initialName = '',
  initialDescription = '',
  initialType = 'Supervivencia',
  initialImageUrl = '',
  onServerSaved,
  className
}: FormularioServidorProps) {
  const [serverName, setServerName] = useState(initialName)
  const [serverDescription, setServerDescription] = useState(initialDescription)
  const [serverType, setServerType] = useState(initialType)
  const [serverImage, setServerImage] = useState(initialImageUrl)
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    setServerName(initialName || (serverIpForForm || ''))
    setServerDescription(initialDescription)
    setServerType(initialType)
    setServerImage(initialImageUrl)
  }, [initialName, initialDescription, initialType, initialImageUrl, serverIpForForm])

  const checkServerExists = async (ip: string): Promise<boolean> => {
    if (!ip) return false;
    const { data, error } = await supabase
      .from('servidores')
      .select('id')
      .eq('ip', ip.trim())
      .maybeSingle();

    if (error) {
      console.error('Error al verificar servidor existente:', error)
      // No bloqueamos el guardado por error de verificación, pero sí alertamos
      setFormError('Error al verificar si el servidor ya existe. Procede con cautela.')
      return false; // Asumimos que no existe para permitir el intento de guardado
    }
    return !!data;
  }

  const handleGuardarServidor = async () => {
    if (!serverIpForForm) {
      setFormError('No hay una IP de servidor especificada para guardar.')
      return
    }
    if (!serverName.trim()) {
      setFormError('El nombre del servidor es obligatorio.')
      return
    }

    setFormLoading(true)
    setFormError(null)

    const serverExists = await checkServerExists(serverIpForForm);
    if (serverExists) {
      setFormError('Este servidor (IP) ya existe en el directorio.')
      setFormLoading(false)
      return;
    }

    try {
      const nuevoServidor = {
        nombre: serverName.trim(),
        descripcion: serverDescription.trim() || 'Sin descripción',
        ip: serverIpForForm.trim(),
        version: '', // La versión se podría obtener de serverInfo si se pasa como prop
        jugadores: '', // Igual para jugadores
        tipo: serverType,
        imagen: serverImage.trim() || null,
        destacado: false, // Por defecto no destacado
        // Asegúrate de que 'solicitado_por' y 'estado_solicitud' no sean necesarios aquí
        // o que tengan valores por defecto en la DB si este es un guardado directo.
      }

      const { error: insertError } = await supabase
        .from('servidores')
        .insert([nuevoServidor])

      if (insertError) {
        console.error('Error al guardar el servidor:', insertError)
        setFormError(`Error al guardar: ${insertError.message}`)
      } else {
        alert('¡Servidor guardado con éxito!')
        onServerSaved() // Llama al callback
        // Limpiar formulario o redirigir según sea necesario
        setServerName(serverIpForForm || '')
        setServerDescription('')
        setServerType('Supervivencia')
        setServerImage('')
      }
    } catch (err) {
      console.error('Error inesperado al guardar el servidor:', err)
      setFormError('Error inesperado al guardar el servidor.')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Guardar Servidor en Directorio</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 py-4">
        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="server-name-form" className="text-right">
            Nombre
          </Label>
          <Input
            id="server-name-form"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            className="col-span-3"
            required
            disabled={!serverIpForForm}
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="server-ip-form" className="text-right">
            IP Servidor
          </Label>
          <Input
            id="server-ip-form"
            value={serverIpForForm || ''}
            className="col-span-3 bg-muted"
            readOnly
            disabled
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="server-description-form" className="text-right">
            Descripción
          </Label>
          <Textarea
            id="server-description-form"
            value={serverDescription}
            onChange={(e) => setServerDescription(e.target.value)}
            className="col-span-3"
            placeholder="Describe brevemente este servidor..."
            disabled={!serverIpForForm}
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="server-type-form" className="text-right">
            Tipo
          </Label>
          <Select value={serverType} onValueChange={setServerType} disabled={!serverIpForForm}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              {tiposServidores.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="server-image-form" className="text-right">
            Imagen URL
          </Label>
          <Input
            id="server-image-form"
            value={serverImage}
            onChange={(e) => setServerImage(e.target.value)}
            className="col-span-3"
            placeholder="https://ejemplo.com/imagen.png (opcional)"
            disabled={!serverIpForForm}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleGuardarServidor} 
          className="w-full" 
          disabled={formLoading || !serverIpForForm}
        >
          {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Guardar Servidor
        </Button>
      </CardFooter>
    </Card>
  )
}
