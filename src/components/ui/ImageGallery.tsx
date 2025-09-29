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
  
  // No mostrar nada si no hay imágenes
  if (!images || images.length === 0) return null;
  
  // Si solo hay una imagen, mostrarla directamente
  if (images.length === 1) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div 
          className="cursor-zoom-in"
          onClick={() => setShowLightbox(true)}
        >
          <img 
            src={images[0]} 
            alt="Imagen" 
            className="w-full max-h-80 h-auto object-contain mx-auto"
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
  
  return (
    <div className={`relative ${className}`}>
      {/* Galería deslizable */}
      <div 
        ref={galleryRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {images.map((image, index) => (
          <div 
            key={index}
            className="flex-shrink-0 w-full snap-center cursor-zoom-in"
            onClick={() => {
              setCurrentIndex(index);
              setShowLightbox(true);
            }}
          >
            <img 
              src={image} 
              alt={`Imagen ${index + 1}`}
              className="w-full max-h-80 h-auto object-contain mx-auto rounded-lg"
              style={{ aspectRatio: 'auto' }}
            />
          </div>
        ))}
      </div>
      
      {/* Botones de navegación */}
      {images.length > 1 && (
        <>
          <button 
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-white/80 dark:bg-black/50 rounded-full hover:bg-white dark:hover:bg-black/70 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button 
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white/80 dark:bg-black/50 rounded-full hover:bg-white dark:hover:bg-black/70 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          {/* Indicadores de imagen */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex 
                    ? "bg-primary" 
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToImage(index);
                }}
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
