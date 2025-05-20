'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  PlusCircle, 
  MinusCircle, 
  Link as LinkIcon, 
  Youtube as YoutubeIcon,
  Table as TableIcon
} from 'lucide-react'

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

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
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

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
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

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
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
