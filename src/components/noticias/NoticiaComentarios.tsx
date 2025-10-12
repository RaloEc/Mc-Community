'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Importar CommentSystem de forma dinámica para carga diferida
const CommentSystem = dynamic(
  () => import('@/components/comentarios/CommentSystem').then(mod => ({ default: mod.CommentSystem })),
  { 
    loading: () => (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-3"></div>
          <span className="text-gray-600 dark:text-gray-400">Cargando comentarios...</span>
        </div>
      </div>
    ),
    ssr: false // Deshabilitar SSR para este componente
  }
);

interface NoticiaComentariosProps {
  noticiaId: string;
}

const NoticiaComentarios: React.FC<NoticiaComentariosProps> = ({ noticiaId }) => {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-3"></div>
          <span className="text-gray-600 dark:text-gray-400">Cargando comentarios...</span>
        </div>
      </div>
    }>
      <CommentSystem
        contentType="noticia"
        contentId={noticiaId}
        pageSize={10}
        order="desc"
      />
    </Suspense>
  );
};

export default React.memo(NoticiaComentarios);
