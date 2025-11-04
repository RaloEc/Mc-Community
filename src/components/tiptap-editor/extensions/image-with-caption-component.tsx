  'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { NodeViewWrapper, ReactNodeViewProps } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Edit3, Check, X, Move, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

interface ImageWithCaptionComponentProps extends ReactNodeViewProps {
  // Las props ya están definidas en ReactNodeViewProps
}

const ImageWithCaptionComponent: React.FC<ImageWithCaptionComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const { src, alt, title, caption, width, height, textAlign } = node.attrs
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [captionText, setCaptionText] = useState(caption || '')
  const [isResizing, setIsResizing] = useState(false)
  const [dimensions, setDimensions] = useState({
    width: width || 'auto',
    height: height || 'auto',
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (isEditingCaption && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingCaption])

  const handleSaveCaption = () => {
    updateAttributes({ caption: captionText.trim() || null })
    setIsEditingCaption(false)
  }

  const handleCancelCaption = () => {
    setCaptionText(caption || '')
    setIsEditingCaption(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveCaption()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelCaption()
    }
  }

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!imageRef.current) return
    
    setIsResizing(true)
    const startX = e.clientX
    const startWidth = imageRef.current.offsetWidth
    const aspectRatio = imageRef.current.offsetHeight / imageRef.current.offsetWidth

    const handleMouseMove = (e: MouseEvent) => {
      if (!imageRef.current) return
      
      const deltaX = e.clientX - startX
      const newWidth = Math.max(100, Math.min(800, startWidth + deltaX))
      const newHeight = newWidth * aspectRatio
      
      setDimensions({ width: `${newWidth}px`, height: `${newHeight}px` })
      imageRef.current.style.width = `${newWidth}px`
      imageRef.current.style.height = `${newHeight}px`
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      if (imageRef.current) {
        updateAttributes({
          width: imageRef.current.style.width,
          height: imageRef.current.style.height
        })
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [updateAttributes])

  const handleAlignChange = useCallback((align: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    console.log('[ImageWithCaption] Cambiando alineación a:', align)
    updateAttributes({ textAlign: align })
  }, [updateAttributes])

  return (
    <NodeViewWrapper
      className="image-with-caption-wrapper"
      style={{ textAlign: textAlign || 'left' }}
    >
      <figure 
        className={`image-with-caption-figure relative group ${selected ? 'selected' : ''} ${isResizing ? 'resizing' : ''}`}
        data-type="image-with-caption"
        style={{
          textAlign: textAlign || 'left',
          width: 'fit-content',
          display: 'block',
          marginLeft: textAlign === 'center' ? 'auto' : '0',
          marginRight: textAlign === 'center' ? 'auto' : textAlign === 'right' ? '0' : 'auto',
        }}
      >
        {/* Imagen con redimensionado */}
        <div className="relative inline-block">
          <img
            ref={imageRef}
            src={src}
            alt={alt || ''}
            title={title || ''}
            className={`editor-image max-w-full h-auto rounded-md cursor-pointer ${isResizing ? 'cursor-nw-resize' : ''}`}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: dimensions.width,
              height: dimensions.height,
              maxWidth: '100%',
            }}
          />
          
          {/* Indicador de redimensionado */}
          {selected && (
            <div 
              className="absolute bottom-1 right-1 w-4 h-4 bg-blue-500 rounded-full opacity-70 cursor-nw-resize flex items-center justify-center hover:opacity-100 transition-opacity"
              onMouseDown={handleResizeMouseDown}
              title="Arrastrar para redimensionar"
            >
              <Move className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* Toolbar flotante que aparece al seleccionar */}
        {selected && (
          <div className="absolute top-2 right-2 flex gap-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Botones de alineación */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => handleAlignChange('left', e)}
              title="Alinear a la izquierda"
              className={`h-8 w-8 p-0 ${textAlign === 'left' ? 'bg-blue-100 dark:bg-blue-900/20' : ''}`}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => handleAlignChange('center', e)}
              title="Centrar"
              className={`h-8 w-8 p-0 ${textAlign === 'center' ? 'bg-blue-100 dark:bg-blue-900/20' : ''}`}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => handleAlignChange('right', e)}
              title="Alinear a la derecha"
              className={`h-8 w-8 p-0 ${textAlign === 'right' ? 'bg-blue-100 dark:bg-blue-900/20' : ''}`}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            
            {/* Separador */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
            
            {/* Botones de acción */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingCaption(true)}
              title="Editar descripción"
              className="h-8 w-8 p-0"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deleteNode}
              title="Eliminar imagen"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Descripción */}
        {isEditingCaption ? (
          <div className="mt-2 flex items-center gap-2">
            <Input
              ref={inputRef}
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe una descripción para la imagen..."
              className="text-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveCaption}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelCaption}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : caption ? (
          <figcaption 
            className="image-caption mt-2 text-sm text-gray-600 dark:text-gray-400 italic text-center cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            onClick={() => setIsEditingCaption(true)}
            title="Clic para editar descripción"
          >
            {caption}
          </figcaption>
        ) : selected ? (
          <div 
            className="mt-2 text-sm text-gray-400 dark:text-gray-500 italic text-center cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-2"
            onClick={() => setIsEditingCaption(true)}
          >
            Clic para agregar una descripción...
          </div>
        ) : null}
      </figure>
    </NodeViewWrapper>
  )
}

export default ImageWithCaptionComponent
