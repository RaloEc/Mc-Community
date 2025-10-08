import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface FiltrosAvanzadosProps {
  filtros: {
    estado?: string
    autor?: string
    fechaDesde?: string
    fechaHasta?: string
    vistasMin?: number
    vistasMax?: number
  }
  onFiltrosChange: (filtros: any) => void
  autores?: { id: string; username: string }[]
}

export function FiltrosAvanzados({ filtros, onFiltrosChange, autores = [] }: FiltrosAvanzadosProps) {
  const [open, setOpen] = React.useState(false)
  const [filtrosTemp, setFiltrosTemp] = React.useState(filtros)
  const [fechaDesde, setFechaDesde] = React.useState<Date | undefined>(
    filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined
  )
  const [fechaHasta, setFechaHasta] = React.useState<Date | undefined>(
    filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined
  )

  // Sincronizar filtros temporales cuando se abra el dialog
  React.useEffect(() => {
    if (open) {
      setFiltrosTemp(filtros)
      setFechaDesde(filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined)
      setFechaHasta(filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined)
    }
  }, [open, filtros])

  const handleEstadoChange = (value: string) => {
    setFiltrosTemp({ ...filtrosTemp, estado: value === 'todas' ? undefined : value })
  }

  const handleAutorChange = (value: string) => {
    setFiltrosTemp({ ...filtrosTemp, autor: value === 'todos' ? undefined : value })
  }

  const handleFechaDesdeChange = (date: Date | undefined) => {
    setFechaDesde(date)
    setFiltrosTemp({ 
      ...filtrosTemp, 
      fechaDesde: date ? format(date, 'yyyy-MM-dd') : undefined 
    })
  }

  const handleFechaHastaChange = (date: Date | undefined) => {
    setFechaHasta(date)
    setFiltrosTemp({ 
      ...filtrosTemp, 
      fechaHasta: date ? format(date, 'yyyy-MM-dd') : undefined 
    })
  }

  const handleVistasMinChange = (value: string) => {
    const num = parseInt(value)
    setFiltrosTemp({ 
      ...filtrosTemp, 
      vistasMin: isNaN(num) ? undefined : num 
    })
  }

  const handleVistasMaxChange = (value: string) => {
    const num = parseInt(value)
    setFiltrosTemp({ 
      ...filtrosTemp, 
      vistasMax: isNaN(num) ? undefined : num 
    })
  }

  const limpiarFiltros = () => {
    setFechaDesde(undefined)
    setFechaHasta(undefined)
    setFiltrosTemp({})
  }

  const aplicarFiltros = () => {
    onFiltrosChange(filtrosTemp)
    setOpen(false)
  }

  const cancelar = () => {
    setOpen(false)
  }

  const hayFiltrosActivos = Object.keys(filtros).some(key => filtros[key as keyof typeof filtros] !== undefined)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filtros Avanzados
          {hayFiltrosActivos && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-600 rounded-full" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent 
        open={open}
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Permitir que los Popovers (calendarios) funcionen correctamente
          const target = e.target as HTMLElement
          if (target.closest('[role="dialog"]') || target.closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Filtros Avanzados</DialogTitle>
          <DialogDescription>
            Filtra las noticias por diferentes criterios para encontrar lo que buscas
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filtrosTemp.estado || 'todas'} onValueChange={handleEstadoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="activas">Activas</SelectItem>
                  <SelectItem value="inactivas">Inactivas</SelectItem>
                  <SelectItem value="destacadas">Destacadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {autores.length > 0 && (
              <div className="space-y-2">
                <Label>Autor</Label>
                <Select value={filtrosTemp.autor || 'todos'} onValueChange={handleAutorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar autor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los autores</SelectItem>
                    {autores.map((autor) => (
                      <SelectItem key={autor.id} value={autor.id}>
                        {autor.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Fecha desde</Label>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !fechaDesde && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaDesde ? format(fechaDesde, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaDesde}
                    onSelect={handleFechaDesdeChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha hasta</Label>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !fechaHasta && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaHasta ? format(fechaHasta, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaHasta}
                    onSelect={handleFechaHastaChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Vistas mín.</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filtrosTemp.vistasMin || ''}
                  onChange={(e) => handleVistasMinChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Vistas máx.</Label>
                <Input
                  type="number"
                  placeholder="999999"
                  value={filtrosTemp.vistasMax || ''}
                  onChange={(e) => handleVistasMaxChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
          <div className="flex gap-2">
            {Object.keys(filtrosTemp).some(key => filtrosTemp[key as keyof typeof filtrosTemp] !== undefined) && (
              <Button
                variant="ghost"
                onClick={limpiarFiltros}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={cancelar}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={aplicarFiltros}
              className="flex-1 sm:flex-none"
            >
              <Filter className="h-4 w-4 mr-2" />
              Aplicar filtros
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
