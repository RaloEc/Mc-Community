'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  PlusCircle, 
  MinusCircle, 
  Link as LinkIcon, 
  Youtube as YoutubeIcon,
  Table as TableIcon,
  Palette,
  Highlighter,
  Check
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Interfaz para el menú desplegable de enlaces
interface LinkPopoverProps {
  open: boolean
  url: string
  text: string
  target: string
  onOpenChange: (open: boolean) => void
  onUrlChange: (value: string) => void
  onTextChange: (value: string) => void
  onTargetChange: (value: string) => void
  onSave: () => void
  triggerButton: React.ReactNode
}

export const LinkPopover: React.FC<LinkPopoverProps> = ({
  open,
  url,
  text,
  target,
  onOpenChange,
  onUrlChange,
  onTextChange,
  onTargetChange,
  onSave,
  triggerButton
}) => {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="p-3 w-72 bg-black text-white border border-gray-700 rounded-md shadow-lg" 
        sideOffset={5}
      >
        <div className="mb-2 flex items-center">
          <LinkIcon className="h-4 w-4 mr-2" />
          <h3 className="text-sm font-medium">Insertar enlace</h3>
        </div>
        
        <DropdownMenuGroup>
          <div className="space-y-3">
            {/* Campo URL */}
            <div>
              <label htmlFor="link-url" className="text-xs text-gray-400 mb-1 block">URL:</label>
              <input
                id="link-url"
                type="text"
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="https://ejemplo.com"
                className="w-full h-8 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm"
                autoFocus
              />
            </div>
            
            {/* Campo Texto */}
            <div>
              <label htmlFor="link-text" className="text-xs text-gray-400 mb-1 block">Texto:</label>
              <input
                id="link-text"
                type="text"
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Texto del enlace"
                className="w-full h-8 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm"
              />
            </div>
            
            {/* Campo Abrir en */}
            <div>
              <label htmlFor="link-target" className="text-xs text-gray-400 mb-1 block">Abrir en:</label>
              <select
                id="link-target"
                value={target}
                onChange={(e) => onTargetChange(e.target.value)}
                className="w-full h-8 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm appearance-none"
              >
                <option value="_blank">Nueva pestaña</option>
                <option value="_self">Misma pestaña</option>
              </select>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-gray-700">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onOpenChange(false)} 
              className="text-xs h-8"
            >
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={onSave} 
              className="text-xs h-8"
            >
              Insertar
            </Button>
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Mantenemos el diálogo modal para compatibilidad con código existente
interface LinkDialogProps {
  open: boolean
  url: string
  text: string
  target: string
  onClose: () => void
  onUrlChange: (value: string) => void
  onTextChange: (value: string) => void
  onTargetChange: (value: string) => void
  onSave: () => void
}

export const LinkDialog: React.FC<LinkDialogProps> = ({
  open,
  url,
  text,
  target,
  onClose,
  onUrlChange,
  onTextChange,
  onTargetChange,
  onSave
}) => {
  if (!open) return null
  
  // Prevenir que el clic en el overlay cierre el diálogo
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  // Manejar la tecla Escape para cerrar el diálogo
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (open && e.key === 'Escape') {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  return (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <h3 className="dialog-title">
          <LinkIcon className="h-4 w-4 mr-2" />
          Insertar enlace
        </h3>
        <div className="dialog-form">
          <div className="dialog-field">
            <label htmlFor="link-url">URL:</label>
            <input
              id="link-url"
              type="text"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://ejemplo.com"
              className="dialog-input"
              autoFocus
            />
          </div>
          <div className="dialog-field">
            <label htmlFor="link-text">Texto:</label>
            <input
              id="link-text"
              type="text"
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Texto del enlace"
              className="dialog-input"
            />
          </div>
          <div className="dialog-field">
            <label htmlFor="link-target">Abrir en:</label>
            <select
              id="link-target"
              value={target}
              onChange={(e) => onTargetChange(e.target.value)}
              className="dialog-select"
            >
              <option value="_blank">Nueva pestaña</option>
              <option value="_self">Misma pestaña</option>
            </select>
          </div>
        </div>
        <div className="dialog-actions">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave}>Guardar</Button>
        </div>
      </div>
    </div>
  )
}

// Menú desplegable para selección de color
interface ColorPopoverProps {
  open: boolean
  title: string
  color: string
  onOpenChange: (open: boolean) => void
  onChange: (value: string) => void
  onSave: () => void
  onClear?: () => void
  triggerButton: React.ReactNode
}

export const ColorPopover: React.FC<ColorPopoverProps> = ({
  open,
  title,
  color,
  onOpenChange,
  onChange,
  onSave,
  onClear,
  triggerButton
}) => {
  // Lista de colores predeterminados
  const presetColors: string[] = [
    '#000000', '#ffffff', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6',
    '#10b981', '#06b6d4', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f97316', '#84cc16'
  ];

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="p-3 w-72 bg-black text-white border border-gray-700 rounded-md shadow-lg" 
        sideOffset={5}
      >
        <div className="mb-2 flex items-center">
          {/* Elegimos icono según el título */}
          {title.toLowerCase().includes('resalt') ? (
            <Highlighter className="h-4 w-4 mr-2" />
          ) : (
            <Palette className="h-4 w-4 mr-2" />
          )}
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        
        <DropdownMenuGroup>
          {/* Paleta de colores predeterminados */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 mb-1 block">Colores predeterminados:</label>
            <div className="grid grid-cols-8 gap-2 mt-1">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => onChange(c)}
                  className={cn(
                    "relative h-7 w-7 rounded-full border transition-all duration-150 shadow-sm",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
                    "focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
                    color.toLowerCase() === c.toLowerCase() 
                      ? "ring-2 ring-white border-black" 
                      : "border-gray-300 hover:ring-1 hover:ring-white/70"
                  )}
                  style={{ backgroundColor: c }}
                  aria-pressed={color.toLowerCase() === c.toLowerCase()}
                >
                  {color.toLowerCase() === c.toLowerCase() && (
                    <span className="absolute -right-1 -bottom-1 bg-black/70 text-white rounded-full p-0.5">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Opción de color personalizado */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 mb-1 block">Color personalizado:</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="h-8 w-10 p-0 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 h-8 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm"
              />
              <div className="h-6 w-6 rounded border border-gray-600" style={{ backgroundColor: color }} />
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700">
            <div className="flex-1">
              {onClear && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onClear} 
                  title={title.toLowerCase().includes('resalt') ? 'Sin resaltado' : 'Color predeterminado'}
                  className="text-xs h-8"
                >
                  {title.toLowerCase().includes('resalt') ? 'Sin resaltado' : 'Predeterminado'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onOpenChange(false)} 
                className="text-xs h-8"
              >
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={onSave} 
                className="text-xs h-8"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Mantenemos el diálogo modal para compatibilidad con código existente
interface ColorDialogProps {
  open: boolean
  title: string
  color: string
  onClose: () => void
  onChange: (value: string) => void
  onSave: () => void
  onClear?: () => void
}

export const ColorDialog: React.FC<ColorDialogProps> = ({
  open,
  title,
  color,
  onClose,
  onChange,
  onSave,
  onClear
}) => {
  if (!open) return null

  // Cierre por Escape siempre
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (open && e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  // Handler overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <h3 className="dialog-title">
          {/* Elegimos icono según el título */}
          {title.toLowerCase().includes('resalt') ? (
            <Highlighter className="h-4 w-4 mr-2" />
          ) : (
            <Palette className="h-4 w-4 mr-2" />
          )}
          {title}
        </h3>
        <div className="dialog-form">
          {/* Paleta de colores predeterminados */}
          <div className="dialog-field">
            <label>Colores predeterminados:</label>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {(() => {
                const presetColors: string[] = [
                  '#000000', '#ffffff', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6',
                  '#10b981', '#06b6d4', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f97316', '#84cc16'
                ];
                return presetColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => onChange(c)}
                    className={`relative h-8 w-8 rounded-full border transition-all duration-150 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 ${color.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-white border-black' : 'border-gray-300 hover:ring-1 hover:ring-white/70'}`}
                    style={{ backgroundColor: c }}
                    aria-pressed={color.toLowerCase() === c.toLowerCase()}
                  >
                    {color.toLowerCase() === c.toLowerCase() && (
                      <span className="absolute -right-1 -bottom-1 bg-black/70 text-white rounded-full p-0.5">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                ));
              })()}
            </div>
          </div>

          {/* Opción de color personalizado */}
          <div className="dialog-field mt-4">
            <label className="mb-2">Color personalizado:</label>
            <div className="flex items-center gap-3">
              <input
                id="color-input"
                type="color"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 w-12 p-0 border rounded"
                autoFocus
              />
              <input
                id="hex-input"
                type="text"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="dialog-input"
              />
              <div className="h-6 w-6 rounded border border-gray-300" style={{ backgroundColor: color }} />
            </div>
          </div>
        </div>
        <div className="dialog-actions flex items-center justify-between">
          <div className="flex-1">
            {onClear && (
              <Button variant="ghost" onClick={onClear} title={title.toLowerCase().includes('resalt') ? 'Sin resaltado' : 'Color predeterminado'}>
                {title.toLowerCase().includes('resalt') ? 'Sin resaltado' : 'Color predeterminado'}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={onSave}>Aplicar</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface YoutubeDialogProps {
  open: boolean
  url: string
  onClose: () => void
  onUrlChange: (value: string) => void
  onSave: () => void
}

export const YoutubeDialog: React.FC<YoutubeDialogProps> = ({
  open,
  url,
  onClose,
  onUrlChange,
  onSave
}) => {
  if (!open) return null
  
  // Prevenir que el clic en el overlay cierre el diálogo
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  // Manejar la tecla Escape para cerrar el diálogo
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (open && e.key === 'Escape') {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  return (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <h3 className="dialog-title">
          <YoutubeIcon className="h-4 w-4 mr-2" />
          Insertar video de YouTube
        </h3>
        <div className="dialog-form">
          <div className="dialog-field">
            <label htmlFor="youtube-url">URL de YouTube:</label>
            <input
              id="youtube-url"
              type="text"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="dialog-input"
              autoFocus
            />
          </div>
          <p className="dialog-help">
            Formatos aceptados:
            <br />- https://www.youtube.com/watch?v=dQw4w9WgXcQ
            <br />- https://youtu.be/dQw4w9WgXcQ
          </p>
        </div>
        <div className="dialog-actions">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave}>Insertar</Button>
        </div>
      </div>
    </div>
  )
}

interface TableDialogProps {
  open: boolean
  rows: number
  cols: number
  onClose: () => void
  onRowsChange: (value: number) => void
  onColsChange: (value: number) => void
  onSave: () => void
}

export const TableDialog: React.FC<TableDialogProps> = ({
  open,
  rows,
  cols,
  onClose,
  onRowsChange,
  onColsChange,
  onSave
}) => {
  if (!open) return null
  
  // Prevenir que el clic en el overlay cierre el diálogo
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  // Manejar la tecla Escape para cerrar el diálogo
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (open && e.key === 'Escape') {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  return (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <h3 className="dialog-title">
          <TableIcon className="h-4 w-4 mr-2" />
          Insertar tabla
        </h3>
        <div className="dialog-form">
          <div className="dialog-field">
            <label htmlFor="table-rows">Filas:</label>
            <div className="number-input-wrapper">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRowsChange(Math.max(2, rows - 1))}
                disabled={rows <= 2}
                className="number-control"
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
              <input
                id="table-rows"
                type="number"
                min="2"
                max="10"
                value={rows}
                onChange={(e) => onRowsChange(parseInt(e.target.value) || 2)}
                className="number-input"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRowsChange(Math.min(10, rows + 1))}
                disabled={rows >= 10}
                className="number-control"
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="dialog-field">
            <label htmlFor="table-cols">Columnas:</label>
            <div className="number-input-wrapper">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onColsChange(Math.max(2, cols - 1))}
                disabled={cols <= 2}
                className="number-control"
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
              <input
                id="table-cols"
                type="number"
                min="2"
                max="10"
                value={cols}
                onChange={(e) => onColsChange(parseInt(e.target.value) || 2)}
                className="number-input"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onColsChange(Math.min(10, cols + 1))}
                disabled={cols >= 10}
                className="number-control"
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="table-preview">
            <div 
              className="table-grid" 
              style={{ 
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`
              }}
            >
              {Array.from({ length: rows * cols }).map((_, i) => (
                <div key={i} className="table-cell" />
              ))}
            </div>
          </div>
        </div>
        <div className="dialog-actions">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave}>Insertar</Button>
        </div>
      </div>
    </div>
  )
}
