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
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSuspenderUsuario } from './hooks/useAdminUsuarios'
import { UsuarioCompleto } from '@/types'

interface DialogoSuspensionProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: UsuarioCompleto | null
}

export function DialogoSuspension({ open, onOpenChange, usuario }: DialogoSuspensionProps) {
  const [tipo, setTipo] = useState<'suspension_temporal' | 'suspension_permanente' | 'baneo'>('suspension_temporal')
  const [razon, setRazon] = useState('')
  const [fin, setFin] = useState('')
  const [notasInternas, setNotasInternas] = useState('')

  const suspenderUsuario = useSuspenderUsuario()

  const handleSubmit = async () => {
    if (!usuario || !razon) return

    await suspenderUsuario.mutateAsync({
      usuarioId: usuario.id,
      tipo,
      razon,
      fin: tipo === 'suspension_temporal' ? fin : undefined,
      notasInternas
    })

    // Limpiar formulario
    setTipo('suspension_temporal')
    setRazon('')
    setFin('')
    setNotasInternas('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Suspender Usuario</DialogTitle>
          <DialogDescription>
            Suspender a <strong>{usuario?.perfil?.username}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="tipo">Tipo de Suspensión</Label>
            <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suspension_temporal">Suspensión Temporal</SelectItem>
                <SelectItem value="suspension_permanente">Suspensión Permanente</SelectItem>
                <SelectItem value="baneo">Baneo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipo === 'suspension_temporal' && (
            <div>
              <Label htmlFor="fin">Fecha de Fin</Label>
              <Input
                id="fin"
                type="datetime-local"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="razon">Razón *</Label>
            <Textarea
              id="razon"
              placeholder="Describe la razón de la suspensión..."
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="notas">Notas Internas (Opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Notas privadas para moderadores..."
              value={notasInternas}
              onChange={(e) => setNotasInternas(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!razon || (tipo === 'suspension_temporal' && !fin) || suspenderUsuario.isPending}
            variant="destructive"
          >
            {suspenderUsuario.isPending ? 'Suspendiendo...' : 'Suspender'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
