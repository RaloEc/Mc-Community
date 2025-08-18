'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Noticia } from '@/types';

interface SeccionCategoriaProps {
  categoriaId: number;
  categoriaNombre: string;
  limite?: number;
}

export default function SeccionCategoria({ 
  categoriaId, 
  categoriaNombre, 
  limite = 4 
}: SeccionCategoriaProps) {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarNoticias = async () => {
      setCargando(true);
      setError(null);
      
      try {
        // Usar URL absoluta para evitar problemas con Next.js
        const url = new URL('/api/noticias', window.location.origin);
        url.searchParams.append('categoria', categoriaId.toString());
        url.searchParams.append('ordenFecha', 'desc');
        url.searchParams.append('limit', limite.toString());
        
        const respuesta = await fetch(url.toString());
        
        if (!respuesta.ok) {
          throw new Error(`Error al cargar noticias: ${respuesta.status}`);
        }
        
        const datos = await respuesta.json();
        
        if (datos.success && Array.isArray(datos.data)) {
          setNoticias(datos.data);
        } else {
          throw new Error('Formato de respuesta inválido');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error al cargar noticias por categoría:', err);
      } finally {
        setCargando(false);
      }
    };
    
    cargarNoticias();
  }, [categoriaId, limite]);

  // Formatear fecha en español
  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return fechaStr;
    }
  };

  if (cargando) {
    return (
      <div className="w-full p-6 bg-card rounded-lg border border-border/50 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">{categoriaNombre}</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(limite)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-24 h-24 bg-muted rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-destructive/10 rounded-lg border border-destructive/30">
        <h2 className="text-2xl font-bold mb-4">{categoriaNombre}</h2>
        <p className="text-destructive">
          Error al cargar noticias: {error}
        </p>
      </div>
    );
  }

  if (noticias.length === 0) {
    return (
      <div className="w-full p-6 bg-card rounded-lg border border-border/50 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">{categoriaNombre}</h2>
        <p className="text-muted-foreground">
          No hay noticias disponibles en esta categoría.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-card rounded-lg border border-border/50 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{categoriaNombre}</h2>
        <Link href={`/noticias?categoria=${categoriaId}`}>
          <Button variant="outline" size="sm">
            Ver todas
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {noticias.map((noticia) => (
          <Link 
            href={`/noticias/${noticia.id}`} 
            key={noticia.id}
            className="flex gap-3 p-3 bg-background rounded-lg hover:bg-accent/10 transition-colors border border-border/50"
          >
            {noticia.imagen_url && (
              <div className="relative w-24 h-24 flex-shrink-0">
                <Image
                  src={noticia.imagen_url}
                  alt={noticia.titulo}
                  fill
                  className="object-cover rounded-md"
                  sizes="(max-width: 768px) 96px, 96px"
                />
              </div>
            )}
            
            <div className="flex flex-col flex-1">
              <h3 className="font-semibold line-clamp-2">{noticia.titulo}</h3>
              
              <div className="mt-auto flex flex-wrap gap-1 items-center text-xs text-gray-600 dark:text-gray-400">
                <span>{formatearFecha(noticia.fecha_publicacion)}</span>
                <span>•</span>
                <span style={{ color: noticia.autor_color || '#3b82f6' }}>
                  {noticia.autor_nombre || (typeof noticia.autor === 'string' ? noticia.autor : 'Anónimo')}
                </span>
              </div>
              
              {noticia.categorias && noticia.categorias.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {noticia.categorias.map((cat: any, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {cat.nombre}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
