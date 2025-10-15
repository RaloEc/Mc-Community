"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageLightbox } from "./ImageLightbox";

interface ImageGalleryProps {
  images: string[];
  className?: string;
}

export function ImageGallery({ images, className = "" }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  
  // No mostrar nada si no hay imágenes
  if (!images || images.length === 0) return null;
  
  // Si solo hay una imagen, mostrarla directamente
  if (images.length === 1) {
    return (
      <div className={`relative overflow-hidden image-gallery ${className}`}>
        <div 
          className="cursor-zoom-in"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLightbox(true); }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <img 
            src={images[0]} 
            alt="Imagen" 
            className="w-full h-auto object-contain mx-auto rounded-lg"
            loading="lazy"
            decoding="async"
            style={{
              maxHeight: "28rem", // ~448px (más grande)
            }}
          />
        </div>
        
        {showLightbox && (
          <ImageLightbox 
            images={images}
            onClose={() => setShowLightbox(false)}
          />
        )}
      </div>
    );
  }
  
  // Función para desplazarse a la siguiente imagen
  const scrollToImage = (index: number) => {
    if (!galleryRef.current) return;
    
    const scrollAmount = galleryRef.current.clientWidth * index;
    galleryRef.current.scrollTo({
      left: scrollAmount,
      behavior: "smooth"
    });
    
    setCurrentIndex(index);
  };
  
  // Navegar a la siguiente imagen
  const next = () => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    scrollToImage(newIndex);
  };
  
  // Navegar a la imagen anterior
  const prev = () => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    scrollToImage(newIndex);
  };
  
  // Mantener sincronizado el índice al deslizar manualmente
  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const idx = Math.round(el.scrollLeft / el.clientWidth);
        if (idx !== currentIndex) setCurrentIndex(idx);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll as EventListener);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentIndex]);

  return (
    <div className={`relative image-gallery ${className}`}>
      {/* Galería deslizable */}
      <div 
        ref={galleryRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ 
          scrollbarWidth: "none", 
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorX: "contain",
        }}
      >
        {images.map((image, index) => (
          <div 
            key={index}
            className="flex-shrink-0 w-full snap-center cursor-zoom-in"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex(index);
              setShowLightbox(true);
            }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <img 
              src={image} 
              alt={`Imagen ${index + 1}`}
              className="w-full h-auto object-contain mx-auto rounded-lg"
              loading="lazy"
              decoding="async"
              style={{ 
                aspectRatio: 'auto',
                maxHeight: "28rem", // ~448px (más grande)
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Botones de navegación */}
      {images.length > 1 && (
        <>
          <button 
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-black/60 rounded-full shadow hover:bg-white dark:hover:bg-black/70 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prev();
            }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-black/60 rounded-full shadow hover:bg-white dark:hover:bg-black/70 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              next();
            }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            aria-label="Siguiente imagen"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          {/* Indicadores de imagen */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 bg-black/20 dark:bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
            {images.map((_, index) => (
              <button
                key={index}
                className={`transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  index === currentIndex
                    ? "w-6 h-2 bg-primary"
                    : "w-2 h-2 bg-gray-300 dark:bg-gray-600"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  scrollToImage(index);
                }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                aria-label={`Ir a la imagen ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
      
      {/* Lightbox */}
      {showLightbox && (
        <ImageLightbox 
          images={images}
          initialIndex={currentIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  );
}
