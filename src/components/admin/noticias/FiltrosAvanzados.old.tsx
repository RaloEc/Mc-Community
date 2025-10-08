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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
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
  const [fechaDesde, setFechaDesde] = React.useState<Date | undefined>(
    filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined
  )
  const [fechaHasta, setFechaHasta] = React.useState<Date | undefined>(
    filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined
  )

  const handleEstadoChange = (value: string) => {
    onFiltrosChange({ ...filtros, estado: value === 'todas' ? undefined : value })
  }

  const handleAutorChange = (value: string) => {
    onFiltrosChange({ ...filtros, autor: value === 'todos' ? undefined : value })
  }

  const handleFechaDesdeChange = (date: Date | undefined) => {
    setFechaDesde(date)
    onFiltrosChange({ 
      ...filtros, 
      fechaDesde: date ? format(date, 'yyyy-MM-dd') : undefined 
    })
  }

  const handleFechaHastaChange = (date: Date | undefined) => {
    setFechaHasta(date)
    onFiltrosChange({ 
      ...filtros, 
      fechaHasta: date ? format(date, 'yyyy-MM-dd') : undefined 
    })
  }

  const handleVistasMinChange = (value: string) => {
    const num = parseInt(value)
    onFiltrosChange({ 
      ...filtros, 
      vistasMin: isNaN(num) ? undefined : num 
    })
  }

  const handleVistasMaxChange = (value: string) => {
    const num = parseInt(value)
    onFiltrosChange({ 
      ...filtros, 
      vistasMax: isNaN(num) ? undefined : num 
    })
  }

  const limpiarFiltros = () => {
    setFechaDesde(undefined)
    setFechaHasta(undefined)
    onFiltrosChange({})
  }

  const hayFiltrosActivos = Object.keys(filtros).some(key => filtros[key as keyof typeof filtros] !== undefined)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {hayFiltrosActivos && (
            <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {Object.keys(filtros).filter(key => filtros[key as keyof typeof filtros] !== undefined).length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filtros Avanzados</SheetTitle>
          <SheetDescription>
            Aplica filtros para encontrar noticias específicas
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          {hayFiltrosActivos && (
            <Button
              variant="ghost"
              size="sm"
              onClick={limpiarFiltros}
              className="w-full"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar todos los filtros
            </Button>
          )}

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={filtros.estado || 'todas'} onValueChange={handleEstadoChange}>
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
              <Select value={filtros.autor || 'todos'} onValueChange={handleAutorChange}>
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
            <Popover>
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

          <div className="space-y-2">
            <Label>Fecha hasta</Label>
            <Popover>
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
                value={filtros.vistasMin || ''}
                onChange={(e) => handleVistasMinChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Vistas máx.</Label>
              <Input
                type="number"
                placeholder="999999"
                value={filtros.vistasMax || ''}
                onChange={(e) => handleVistasMaxChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
