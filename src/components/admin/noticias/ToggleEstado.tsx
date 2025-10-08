import React from 'react'
import { Switch } from '@/components/ui/switch'
import { useActualizarEstadoNoticia } from '@/components/noticias/hooks/useAdminNoticias'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface ToggleEstadoProps {
  noticiaId: string
  campo: 'destacada' | 'es_activa'
  valorActual: boolean
  etiqueta?: string
}

export function ToggleEstado({ noticiaId, campo, valorActual, etiqueta }: ToggleEstadoProps) {
  const { mutate: actualizarEstado, isPending } = useActualizarEstadoNoticia()
  const { toast } = useToast()

  const handleChange = (checked: boolean) => {
    actualizarEstado(
      { id: noticiaId, campo, valor: checked },
      {
        onError: (error: Error) => {
          toast({
            title: 'Error',
            description: error.message || 'Error al actualizar el estado',
            variant: 'destructive',
          })
        },
      }
    )
  }

  return (
    <div className="flex items-center gap-2">
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Switch
          checked={valorActual}
          onCheckedChange={handleChange}
          disabled={isPending}
        />
      )}
      {etiqueta && <span className="text-sm text-muted-foreground">{etiqueta}</span>}
    </div>
  )
}
