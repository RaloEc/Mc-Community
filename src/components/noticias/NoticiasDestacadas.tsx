'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarIcon, ArrowRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

interface NoticiasDestacadasProps {
  limit?: number;
}

const NoticiasDestacadas: React.FC<NoticiasDestacadasProps> = ({ limit = 5 }) => {
  // Usar React Query para obtener las noticias destacadas
  const { data: noticias, isLoading, isError, error } = useQuery({
    queryKey: ['noticias', 'destacadas', limit],
    queryFn: async () => {
      try {
        // Usar URL absoluta para evitar problemas con Next.js
        let baseUrl;
        if (typeof window !== 'undefined') {
          baseUrl = window.location.origin;
        } else {
          baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                  'http://localhost:3000');
        }
        
        const response = await fetch(`${baseUrl}/api/noticias?ordenFecha=desc&limit=${limit}`);
        
        if (!response.ok) {
          throw new Error(`Error al obtener noticias: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          return data.data;
        } else {
          throw new Error(data.error || 'Error desconocido al obtener noticias');
        }
      } catch (err) {
        console.error('Error al cargar noticias destacadas:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Función para renderizar la categoría principal
  const renderCategoria = (noticia: any) => {
    if (noticia.categorias && noticia.categorias.length > 0) {
      // Buscar categorías padres (sin parent_id)
      const categoriasPadre = noticia.categorias.filter((c: any) => !c.parent_id);
      
      // Si hay categorías padre, mostrar la primera
      if (categoriasPadre.length > 0) {
        const cat = categoriasPadre[0];
        return (
          <Badge 
            key={cat.id} 
            className={`text-xs ${cat.color ? `border-${cat.color}-500 ` : ''}`}
            variant="outline"
          >
            {cat.icono && <span className="mr-1">{cat.icono}</span>}
            {cat.nombre}
          </Badge>
        );
      } 
      // Si no hay categorías padre, buscar la primera subcategoría y su padre
      else {
        const primerSubcategoria = noticia.categorias[0];
        const categoriaPadre = primerSubcategoria.parent_id ? 
          noticia.categorias.find((c: any) => c.id === primerSubcategoria.parent_id) : null;
        
        if (categoriaPadre) {
          return (
            <Badge 
              key={categoriaPadre.id} 
              className={`text-xs ${categoriaPadre.color ? `border-${categoriaPadre.color}-500 ` : ''}`}
              variant="outline"
            >
              {categoriaPadre.icono && <span className="mr-1">{categoriaPadre.icono}</span>}
              {categoriaPadre.nombre}
            </Badge>
          );
        } else {
          return (
            <Badge 
              key={primerSubcategoria.id} 
              className={`text-xs ${primerSubcategoria.color ? `border-${primerSubcategoria.color}-500 ` : ''}`}
              variant="outline"
            >
              {primerSubcategoria.icono && <span className="mr-1">{primerSubcategoria.icono}</span>}
              {primerSubcategoria.nombre}
            </Badge>
          );
        }
      }
    } else if (noticia.categoria) {
      return (
        <Badge 
          className={`text-xs ${noticia.categoria.color ? `border-${noticia.categoria.color}-500 ` : ''}`}
          variant="outline"
        >
          {noticia.categoria.icono && <span className="mr-1">{noticia.categoria.icono}</span>}
          {noticia.categoria.nombre}
        </Badge>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="w-full bg-card rounded-lg border border-border/50 shadow-sm p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="h-[400px] bg-muted rounded-xl"></div>
            </div>
            <div className="md:col-span-1 space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full p-6 bg-destructive/10 rounded-lg border border-destructive/30">
        <h2 className="text-xl font-bold mb-2">Error al cargar noticias destacadas</h2>
        <p className="text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  // Si no hay noticias, no mostramos nada
  if (!noticias || noticias.length === 0) {
    return (
      <div className="w-full p-6 bg-card rounded-lg border border-border/50 shadow-sm">
        <p className="text-muted-foreground text-center">No hay noticias destacadas disponibles.</p>
      </div>
    );
  }

  // Separamos las dos primeras noticias como principales y el resto como secundarias
  const [noticiaPrincipal1, noticiaPrincipal2, ...noticiasSecundarias] = noticias;
  
  // Si solo hay una noticia, mostrarla como principal y no mostrar la segunda
  const mostrarSegundaPrincipal = noticias.length >= 2;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-6">
        {/* Primera noticia principal */}
        <div className={`w-full ${!mostrarSegundaPrincipal ? 'md:col-span-2' : ''}`}>
          <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 w-full h-full">
            <div className="relative h-[350px] w-full">
              <Image 
                src={noticiaPrincipal1.imagen_portada || noticiaPrincipal1.imagen_url || '/placeholder.jpg'} 
                alt={noticiaPrincipal1.titulo}
                fill
                loading="eager"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              <div className="absolute top-0 left-0 p-3">
                <div className="flex flex-wrap gap-1 mb-2">
                  {renderCategoria(noticiaPrincipal1)}
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent hover:from-black/80 hover:via-black/40 transition-all duration-300 flex flex-col justify-end p-6">
                <div className="mt-auto">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2 drop-shadow-md">
                    {noticiaPrincipal1.titulo}
                  </h2>
                  <p className="text-white/90 line-clamp-2 mb-3 text-sm max-w-[90%] drop-shadow-md">
                    {noticiaPrincipal1.resumen || noticiaPrincipal1.contenido.substring(0, 100) + '...'}
                  </p>
                  <div className="flex justify-between items-center text-sm text-white/90">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="text-xs">
                        {new Date(noticiaPrincipal1.fecha_publicacion || Date.now()).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <Button 
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 hover:bg-white/40 text-white shadow-md transition-all"
                    >
                      <Link href={`/noticias/${noticiaPrincipal1.id}`}>
                        Leer más
                        <ArrowRightIcon className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Segunda noticia principal - solo se muestra si hay al menos 2 noticias */}
        {mostrarSegundaPrincipal && (
          <div className="w-full">
            <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 w-full h-full">
              <div className="relative h-[350px] w-full">
                <Image 
                  src={noticiaPrincipal2.imagen_portada || noticiaPrincipal2.imagen_url || '/placeholder.jpg'} 
                  alt={noticiaPrincipal2.titulo}
                  fill
                  loading="eager"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute top-0 left-0 p-3">
                  <div className="flex flex-wrap gap-2">
                    {renderCategoria(noticiaPrincipal2)}
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent hover:from-black/80 hover:via-black/40 transition-all duration-300 flex flex-col justify-end p-6">
                  <div className="mt-auto">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-2 drop-shadow-md">
                      {noticiaPrincipal2.titulo}
                    </h2>
                    <p className="text-white/90 line-clamp-2 mb-3 text-sm max-w-[90%] drop-shadow-md">
                      {noticiaPrincipal2.resumen || noticiaPrincipal2.contenido.substring(0, 100) + '...'}
                    </p>
                    <div className="flex justify-between items-center text-sm text-white/90">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span className="text-xs">
                          {new Date(noticiaPrincipal2.fecha_publicacion || Date.now()).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <Button 
                        variant="secondary"
                        size="sm"
                        className="bg-white/20 hover:bg-white/40 text-white shadow-md transition-all"
                      >
                        <Link href={`/noticias/${noticiaPrincipal2.id}`}>
                          Leer más
                          <ArrowRightIcon className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Noticias secundarias */}
      {noticiasSecundarias.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {noticiasSecundarias.slice(0, 3).map(noticia => (
            <div key={noticia.id} className="bg-background rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow border border-border/50 hover:bg-accent/10">
              <div className="relative h-32">
                <Image 
                  src={noticia.imagen_portada || noticia.imagen_url || '/placeholder.jpg'} 
                  alt={noticia.titulo}
                  fill
                  loading="lazy"
                  className="object-cover"
                />
                <div className="absolute top-2 left-2">
                  {renderCategoria(noticia)}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold line-clamp-2 mb-2">
                  <Link href={`/noticias/${noticia.id}`} className="hover:text-primary transition-colors">
                    {noticia.titulo}
                  </Link>
                </h3>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>
                    {new Date(noticia.fecha_publicacion || Date.now()).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short'
                    })}
                  </span>
                  <span style={{ color: noticia.autor?.color || 'inherit' }}>
                    {noticia.autor?.username || noticia.autor_nombre || (typeof noticia.autor === 'string' ? noticia.autor : 'Anónimo')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(NoticiasDestacadas);
