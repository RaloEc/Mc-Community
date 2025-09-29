'use client';

import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  placeholderColor?: string;
  width?: number;
  height?: number;
}

/**
 * Componente para cargar imágenes de forma progresiva con efecto de desvanecimiento
 */
export function ProgressiveImage({
  src,
  alt,
  className = '',
  style = {},
  placeholderColor = '#f3f4f6',
  width,
  height,
}: ProgressiveImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reiniciar el estado cuando cambia la fuente de la imagen
    setIsLoading(true);
    setError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton 
            className="w-full h-full" 
            style={{ backgroundColor: placeholderColor }}
          />
        </div>
      )}
      
      {error ? (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm"
        >
          Error al cargar la imagen
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          style={{
            ...style,
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : '100%',
          }}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}
