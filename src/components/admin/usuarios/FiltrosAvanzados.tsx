'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface FiltrosAvanzadosProps {
  fechaDesde: string
  fechaHasta: string
  inactivoDias: string
  emailVerificado: string
  onFechaDesdeChange: (value: string) => void
  onFechaHastaChange: (value: string) => void
  onInactivoDiasChange: (value: string) => void
  onEmailVerificadoChange: (value: string) => void
  onLimpiar: () => void
}

export function FiltrosAvanzados({
  fechaDesde,
  fechaHasta,
  inactivoDias,
  emailVerificado,
  onFechaDesdeChange,
  onFechaHastaChange,
  onInactivoDiasChange,
  onEmailVerificadoChange,
  onLimpiar
}: FiltrosAvanzadosProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filtros Avanzados</h3>
        <Button variant="ghost" size="sm" onClick={onLimpiar}>
          <X className="w-4 h-4 mr-1" />
          Limpiar filtros
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="fechaDesde" className="text-xs">Registrado desde</Label>
          <Input
            id="fechaDesde"
            type="date"
            value={fechaDesde}
            onChange={(e) => onFechaDesdeChange(e.target.value)}
            className="h-9"
          />
        </div>
        
        <div>
          <Label htmlFor="fechaHasta" className="text-xs">Registrado hasta</Label>
          <Input
            id="fechaHasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => onFechaHastaChange(e.target.value)}
            className="h-9"
          />
        </div>
        
        <div>
          <Label htmlFor="inactivoDias" className="text-xs">Inactivo por (días)</Label>
          <Input
            id="inactivoDias"
            type="number"
            placeholder="Ej: 30"
            value={inactivoDias}
            onChange={(e) => onInactivoDiasChange(e.target.value)}
            className="h-9"
            min="0"
          />
        </div>
        
        <div>
          <Label htmlFor="emailVerificado" className="text-xs">Email Verificado</Label>
          <Select value={emailVerificado} onValueChange={onEmailVerificadoChange}>
            <SelectTrigger id="emailVerificado" className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Verificado</SelectItem>
              <SelectItem value="false">No Verificado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
