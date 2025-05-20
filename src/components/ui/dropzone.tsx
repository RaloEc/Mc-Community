'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Clipboard } from 'lucide-react'

interface DropzoneProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
  previewUrl?: string | null
  onFileSelect?: (file: File) => void
  label?: string
  id?: string
  pasteLabel?: string
}

export function Dropzone({
  className,
  previewUrl,
  onFileSelect,
  label = "Arrastra y suelta o haz clic para subir una imagen",
  pasteLabel = "También puedes pegar desde el portapapeles (Ctrl+V)",
  id = "dropzone-file",
  ...props
}: DropzoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [isPasting, setIsPasting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropzoneRef = useRef<HTMLDivElement>(null)
  
  // Manejadores de eventos para arrastrar
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  // Manejar soltar archivo
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (onFileSelect) {
        onFileSelect(e.dataTransfer.files[0])
      }
    }
  }

  // Manejar cambio de archivo por selección
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      if (onFileSelect) {
        onFileSelect(e.target.files[0])
      }
    }
  }

  // Evitar que el evento de clic se propague al input
  const onLabelClick = useCallback((e: React.MouseEvent) => {
    // No hacemos nada aquí, solo evitamos que el evento se propague
    // El input se abrirá automáticamente al hacer clic en el label debido al atributo htmlFor
    e.stopPropagation()
  }, [])
  
  // Manejar pegado desde el portapapeles
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!onFileSelect) return
    
    const items = e.clipboardData?.items
    if (!items) return
    
    setIsPasting(true)
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          onFileSelect(file)
          e.preventDefault()
          break
        }
      }
    }
    
    setTimeout(() => setIsPasting(false), 1000)
  }, [onFileSelect])
  
  // Agregar y eliminar el evento de pegado
  useEffect(() => {
    const element = dropzoneRef.current
    if (element) {
      element.addEventListener('paste', handlePaste)
      // Hacer que el elemento tenga foco cuando se hace clic en él
      element.addEventListener('click', () => element.focus())
    }
    
    return () => {
      if (element) {
        element.removeEventListener('paste', handlePaste)
      }
    }
  }, [handlePaste])

  return (
    <div className="relative my-4" ref={dropzoneRef} tabIndex={0}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          "relative flex cursor-pointer flex-col items-center gap-4 rounded border border-dashed border-slate-300 px-3 py-6 text-center text-sm font-medium transition-colors",
          dragActive ? "border-emerald-500 bg-emerald-50/50" : "",
          previewUrl ? "border-emerald-500" : "",
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onLabelClick}
      >
        {previewUrl ? (
          <div className="relative w-full aspect-video rounded overflow-hidden">
            <img 
              src={previewUrl} 
              alt="Vista previa" 
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <span className="inline-flex h-12 items-center justify-center self-center rounded-full bg-slate-100/70 px-3 text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="Icono de carga de archivo"
                  role="graphics-symbol"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                  />
                </svg>
              </span>
              <span className="text-slate-500">
                {label.split(' o ')[0]} o
                <span className="text-emerald-500"> {label.split(' o ')[1]}</span>
              </span>
              
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                <Clipboard size={14} />
                <span>{pasteLabel}</span>
                {isPasting && (
                  <span className="text-emerald-500 animate-pulse">¡Pegando!</span>
                )}
              </div>
            </div>
          </>
        )}
      </label>
    </div>
  )
}
