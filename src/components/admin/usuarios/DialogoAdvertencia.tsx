'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdvertirUsuario } from './hooks/useAdminUsuarios'
import { UsuarioCompleto } from '@/types'

interface DialogoAdvertenciaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: UsuarioCompleto | null
}

export function DialogoAdvertencia({ open, onOpenChange, usuario }: DialogoAdvertenciaProps) {
  const [razon, setRazon] = useState('')
  const [severidad, setSeveridad] = useState<1 | 2 | 3>(1)

  const advertirUsuario = useAdvertirUsuario()

  const handleSubmit = async () => {
    if (!usuario || !razon) return

    await advertirUsuario.mutateAsync({
      usuarioId: usuario.id,
      razon,
      severidad
    })

    // Limpiar formulario
    setRazon('')
    setSeveridad(1)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Advertir Usuario</DialogTitle>
          <DialogDescription>
            Enviar advertencia a <strong>{usuario?.perfil?.username}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="severidad">Severidad</Label>
            <Select value={severidad.toString()} onValueChange={(v) => setSeveridad(parseInt(v) as 1 | 2 | 3)}>
              <SelectTrigger id="severidad">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Leve</SelectItem>
                <SelectItem value="2">Moderada</SelectItem>
                <SelectItem value="3">Grave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="razon">Razón *</Label>
            <Textarea
              id="razon"
              placeholder="Describe la razón de la advertencia..."
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <p className="font-medium mb-1">Información:</p>
            <p>El usuario recibirá una notificación con esta advertencia. Si acumula 3 o más advertencias, se recomienda una suspensión.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!razon || advertirUsuario.isPending}
          >
            {advertirUsuario.isPending ? 'Enviando...' : 'Enviar Advertencia'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
