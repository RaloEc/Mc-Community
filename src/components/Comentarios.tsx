'use client'

import React from 'react'
import { CommentSystem } from './comentarios/CommentSystem'

interface ComentariosProps {
  tipoEntidad: string
  entidadId: string
  limite?: number
}

export default function Comentarios({
  tipoEntidad,
  entidadId,
  limite = 10
}: ComentariosProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <CommentSystem 
        contentType={tipoEntidad}
        contentId={entidadId}
        pageSize={limite}
      />
    </div>
  )
}
