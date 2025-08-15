'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Noticia } from '@/types';
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';

interface NoticiasMiniaturasProps {
  limit?: number;
  featured?: boolean;
}

export default function NoticiasMiniatura({ 
  limit = 5,
  featured = false 
}: NoticiasMiniaturasProps) {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Configuración del carrusel - Mover al principio para mantener el orden de los hooks
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      dragFree: true,
      containScroll: 'trimSnaps',
      breakpoints: {
        '(min-width: 768px)': { active: false } // Desactivar en pantallas md y superiores
      }
    },
    [WheelGesturesPlugin()]
  );
  
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const fetchNoticias = async () => {
      try {
        setLoading(true);
        
        // Establecer un tiempo límite de 10 segundos para la carga
        const timeoutPromise = new Promise<Response>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Tiempo de espera agotado al cargar las noticias'));
          }, 10000); // 10 segundos
        });
        
        // Intentar obtener las noticias con un tiempo límite
        const response = await Promise.race([
          fetch('/api/noticias'),
          timeoutPromise
        ]) as Response;
        
        // Limpiar el timeout ya que la respuesta llegó
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('No se pudieron cargar las noticias');
        }
        
        const data = await response.json();
        
        // Solo actualizar el estado si el componente sigue montado
        if (isMounted) {
          if (data.success && data.data) {
            setNoticias(data.data.slice(0, limit));
          } else {
            setNoticias([]);
          }
        }
      } catch (err) {
        console.error('Error en NoticiasMiniatura:', err);
        // Solo actualizar el estado si el componente sigue montado
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar las noticias');
          setNoticias([]);
        }
      } finally {
        // Solo actualizar el estado si el componente sigue montado
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNoticias();
    
    // Limpiar al desmontar
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [limit]);

  // Estado de carga
  if (loading) {
    return (
      <div className={`relative w-full`}>
        {/* Título de la sección */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {featured ? 'Noticias Destacadas' : 'Últimas Noticias'}
          </h2>
          <Link 
            href="/noticias" 
            className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Ver todas <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {/* Contenedor del carrusel */}
        <div className="relative">
          {/* Controles de navegación */}
          <div className="absolute -top-12 right-0 flex space-x-2 md:hidden">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-full border-border hover:bg-accent/50"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
              <span className="sr-only">Anterior</span>
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-full border-border hover:bg-accent/50"
              onClick={scrollNext}
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
              <span className="sr-only">Siguiente</span>
            </Button>
          </div>

          {/* Carrusel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4">
              {Array.from({ length: featured ? 3 : limit }).map((_, i) => (
                <div key={i} className="flex-none w-full px-4 sm:w-1/2 md:w-1/3 lg:w-1/4">
                  <div className="h-64 rounded-lg bg-muted animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Manejo de errores
  if (error) {
    return (
      <div className="relative w-full">
        {/* Título de la sección */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {featured ? 'Noticias Destacadas' : 'Últimas Noticias'}
          </h2>
          <Link 
            href="/noticias" 
            className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Ver todas <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {/* Contenedor del carrusel */}
        <div className="relative">
          <div className="w-full px-4">
            <div className="p-4 text-center rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-destructive">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sin noticias
  if (noticias.length === 0) {
    return (
      <div className="relative w-full">
        {/* Título de la sección */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {featured ? 'Noticias Destacadas' : 'Últimas Noticias'}
          </h2>
          <Link 
            href="/noticias" 
            className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Ver todas <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {/* Contenedor del carrusel */}
        <div className="relative">
          <div className="w-full px-4">
            <div className="p-4 text-center rounded-lg bg-muted border border-border">
              <p className="text-muted-foreground">No se encontraron noticias</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista principal
  if (featured) {
    return (
      <div className="relative w-full">
        {/* Título de la sección */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {featured ? 'Noticias Destacadas' : 'Últimas Noticias'}
          </h2>
          <Link 
            href="/noticias" 
            className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Ver todas <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {/* Contenedor del carrusel */}
        <div className="relative">
          {/* Controles de navegación */}
          <div className="absolute -top-12 right-0 flex space-x-2 md:hidden">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-full border-border hover:bg-accent/50"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
              <span className="sr-only">Anterior</span>
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-full border-border hover:bg-accent/50"
              onClick={scrollNext}
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
              <span className="sr-only">Siguiente</span>
            </Button>
          </div>

          {/* Carrusel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4">
              {noticias.map((noticia) => (
                <div key={noticia.id} className="flex-none w-full px-4 sm:w-1/2 md:w-1/3 lg:w-1/4">
                  <article className="h-full overflow-hidden transition-all duration-300 bg-card rounded-lg border border-border shadow-sm hover:shadow-md group">
                    {/* Imagen de la noticia */}
                    <div className="relative h-40 overflow-hidden bg-card/50 dark:bg-muted/30">
                      <img
                        src={noticia.imagen_url || '/placeholder-noticia.jpg'}
                        alt={noticia.titulo}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-noticia.jpg';
                        }}
                      />
                      {/* Badge de categoría */}
                      {noticia.categoria && (
                        <div className="absolute bottom-2 left-2">
                          <span className="px-2 py-1 text-xs font-medium text-white bg-primary rounded-full">
                            {noticia.categoria.nombre}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Contenido de la noticia */}
                    <div className="p-4 bg-card">
                      <h3 className="mb-2 text-lg font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors dark:group-hover:text-primary-foreground">
                        {noticia.titulo}
                      </h3>
                      
                      <div className="flex items-center mt-2 text-sm text-muted-foreground dark:text-muted-foreground/80">
                        <CalendarIcon className="w-4 h-4 mr-1.5" />
                        <span>
                          {new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      
                      <Link 
                        href={`/noticias/${noticia.id}`}
                        className="inline-flex items-center mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors group/readmore"
                      >
                        Leer más 
                        <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover/readmore:translate-x-0.5" />
                      </Link>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista en carrusel para móvil y fila horizontal para escritorio
  const noticiasAMostrar = noticias.slice(0, limit);

  // Componente de tarjeta de noticia reutilizable
  const NoticiaCard = ({ noticia, className = '' }: { noticia: Noticia; className?: string }) => {
    // Función para manejar el clic en la tarjeta
    const handleCardClick = (e: React.MouseEvent) => {
      // Si el clic fue en un botón o enlace, no hacemos nada para permitir la navegación normal
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button, a')) {
        return;
      }
      // Navegar a la noticia
      window.location.href = `/noticias/${noticia.id}`;
    };

    return (
      <div 
        className={`${className} h-full cursor-pointer`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e as any)}
      >
        <article className="h-full flex flex-col rounded-lg border border-border/50 overflow-hidden hover:shadow-md transition-shadow duration-300">
          {/* Imagen con tamaño fijo */}
          <div className="w-full h-48 bg-muted/50 overflow-hidden relative">
            {noticia.imagen_url ? (
              <>
                <img
                  src={noticia.imagen_url}
                  alt={noticia.titulo}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-foreground/10 hover:bg-foreground/20 transition-colors duration-300" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground">Sin imagen</span>
              </div>
            )}
          </div>
          
          {/* Contenido */}
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
              {noticia.fecha_publicacion && new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <h3 className="font-medium text-base hover:text-primary transition-colors line-clamp-2 mb-2">
              {noticia.titulo}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {noticia.contenido?.replace(/<[^>]*>?/gm, '').substring(0, 150) || ''}
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center text-sm font-medium text-primary">
                Leer más
                <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            </div>
          </div>
        </article>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Versión móvil - Carrusel */}
      <div className="md:hidden relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {noticiasAMostrar.map((noticia) => (
              <div key={noticia.id} className="flex-[0_0_85%] min-w-0 pl-4">
                <NoticiaCard noticia={noticia} />
              </div>
            ))}
          </div>
        </div>
        <button 
          onClick={scrollPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-md -ml-2"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button 
          onClick={scrollNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-md -mr-2"
          aria-label="Siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      
      {/* Versión escritorio - Grid */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {noticiasAMostrar.map((noticia) => (
          <NoticiaCard key={noticia.id} noticia={noticia} />
        ))}
      </div>

      {/* Botón para ver más noticias */}
      <div className="flex justify-end pt-2">
        <Button variant="ghost" asChild>
          <Link href="/noticias" className="text-sm">
            Ver todas las noticias
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
