"use client";

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface YoutubePlayerProps {
  videoId: string;
  title?: string;
  className?: string;
  onError?: (error: Error) => void;
}

export function YoutubePlayer({ 
  videoId, 
  title = 'YouTube video player',
  className = '',
  onError 
}: YoutubePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Configuración de parámetros para el iframe
  const getIframeUrl = () => {
    const params = new URLSearchParams({
      rel: '0',
      showinfo: '0',
      autoplay: '0',
      modestbranding: '1',
      fs: '0', // Ocultar botón de pantalla completa
      playsinline: '1', // Mejor soporte para móviles
      enablejsapi: '0', // Deshabilitar la API de JavaScript
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      widget_referrer: typeof window !== 'undefined' ? window.location.href : '',
    });
    
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (error: any) => {
    console.error('Error al cargar el reproductor de YouTube:', error);
    setHasError(true);
    setIsLoading(false);
    
    if (onError) {
      onError(new Error('No se pudo cargar el reproductor de YouTube'));
    }
  };

  // Limpiar el iframe cuando se desmonte el componente
  useEffect(() => {
    return () => {
      // Limpiar el iframe para liberar recursos
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank';
      }
    };
  }, []);

  if (hasError) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center ${className}`} 
           style={{ aspectRatio: '16/9' }}>
        <div className="text-center p-4">
          <p className="text-red-500">No se pudo cargar el video</p>
          <a 
            href={`https://www.youtube.com/watch?v=${videoId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline mt-2 inline-block"
          >
            Ver en YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black ${className}`} style={{ aspectRatio: '16/9' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        className={`w-full h-full ${isLoading ? 'invisible' : 'visible'}`}
        src={getIframeUrl()}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}
