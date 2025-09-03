'use client'

import React, { useEffect, useState } from 'react'
import { CommentSystem } from './comentarios/CommentSystem'

interface ComentariosNuevoProps {
  contentType: string
  contentId: string
  limit?: number
}

export default function ComentariosNuevo({
  contentType,
  contentId,
  limit = 10
}: ComentariosNuevoProps) {
  // Log inmediato al recibir los props
  console.log('ComentariosNuevo recibió props:', { 
    contentType: contentType, 
    contentTypeType: typeof contentType,
    contentId: contentId, 
    contentIdType: typeof contentId,
    limit 
  });
  const [validProps, setValidProps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Validar que los props sean correctos
    if (!contentType) {
      console.error('ComentariosNuevo: contentType es requerido');
      setError('Tipo de contenido no válido');
      setValidProps(false);
      return;
    }
    
    if (!contentId) {
      console.error('ComentariosNuevo: contentId es requerido');
      setError('ID de contenido no válido');
      setValidProps(false);
      return;
    }
    
    console.log('ComentariosNuevo props válidos:', { contentType, contentId, limit });
    setValidProps(true);
    setError(null);
  }, [contentType, contentId, limit]);
  
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }
  
  if (!validProps) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-gray-600">Cargando sistema de comentarios...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <h3 className="text-xl font-semibold mb-4">Comentarios</h3>
      <CommentSystem 
        contentType={contentType}
        contentId={contentId}
        pageSize={limit}
      />
    </div>
  )
}
