'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface YoutubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
  // Nueva prop para forzar la carga del iframe
  forceMount?: boolean;
}

// Generar una key única para cada instancia del componente
const generateUniqueKey = (() => {
  let counter = 0;
  return () => `youtube-embed-${Date.now()}-${counter++}`;
})();

export function YoutubeEmbed({ 
  videoId, 
  title = 'YouTube video player', 
  className = '',
  forceMount = false
}: YoutubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const wasVisibleRef = useRef(false);
  const uniqueKeyRef = useRef(generateUniqueKey());
  const [isTabActive, setIsTabActive] = useState(true);
  
  // Manejar cambios en la visibilidad de la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(document.visibilityState === 'visible');
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Configurar el IntersectionObserver para carga perezosa
  useEffect(() => {
    // Si forceMount es true, cargar el iframe inmediatamente
    if (forceMount) {
      setIsLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInViewport(true);
          setIsLoaded(true);
          wasVisibleRef.current = true;
          // Desconectar el observer después de la primera carga
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      },
      {
        root: null,
        rootMargin: '200px', // Cargar antes de que el elemento entre completamente en la vista
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [forceMount]);

  // Estilos base para el contenedor
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    paddingBottom: '56.25%',
    height: 0,
    overflow: 'hidden',
    maxWidth: '100%',
    margin: '8px 0',
    backgroundColor: '#f0f0f0',
  };

  // Estilos para el iframe con visibilidad controlada
  const iframeStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 0,
    // Ocultar el iframe cuando la pestaña no está activa
    opacity: isTabActive ? 1 : 0,
    visibility: isTabActive ? 'visible' : 'hidden',
    transition: 'opacity 0.3s ease',
  };

  // Estilos para el placeholder
  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    padding: '20px',
    width: '100%',
    boxSizing: 'border-box',
    opacity: isTabActive ? 1 : 0.7,
    transition: 'opacity 0.3s ease',
  };

  // Si el iframe no se ha cargado, mostrar el placeholder
  if (!isLoaded) {
    return (
      <div 
        ref={containerRef}
        className={`youtube-embed-container ${className}`}
        style={containerStyle}
      >
        <div style={placeholderStyle}>
          <div>Haz clic para cargar el video</div>
          <div style={{ fontSize: '0.8em', marginTop: '8px', color: '#666' }}>
            (El video se cargará cuando sea necesario)
          </div>
        </div>
      </div>
    );
  }

  // Renderizar el iframe con una key única para evitar recreaciones innecesarias
  return (
    <div 
      ref={containerRef}
      className={`youtube-embed-container ${className}`}
      style={containerStyle}
    >
      <iframe
        key={uniqueKeyRef.current}
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&autoplay=0`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={iframeStyle}
        loading="lazy"
        // Importante: no usar onLoad aquí ya que puede causar re-renderizados
      />
      
      {/* Overlay que se muestra cuando la pestaña no está activa */}
      {!isTabActive && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <div>El video está en pausa</div>
            <div style={{ fontSize: '0.8em', marginTop: '8px', color: '#666' }}>
              (Vuelve a esta pestaña para continuar viendo)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
