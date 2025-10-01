'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function NoticiaDetalleSkeleton({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(true);
  const [noticia, setNoticia] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Efecto para cargar la noticia
  useEffect(() => {
    const cargarNoticia = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Obtener la noticia desde la API
        const response = await fetch(`/api/noticias/${params.id}`, {
          cache: "no-store",
        });
        
        if (!response.ok) {
          throw new Error(`Error al cargar la noticia: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || "Error al cargar la noticia");
        }
        
        setNoticia(data.data);
      } catch (error) {
        console.error("Error:", error);
        setError(error instanceof Error ? error.message : "Error al cargar la noticia");
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarNoticia();
  }, [params.id]);

  // Mostrar estado de carga
  if (isLoading) {
    return <NoticiaSkeletonUI />;
  }

  // Mostrar error si lo hay
  if (error || !noticia) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-card border border-border rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-destructive">Error</h2>
          <p className="mb-6">{error || "No se pudo cargar la noticia"}</p>
          <Button asChild>
            <Link href="/noticias">Volver a noticias</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-4 px-1">
        {/* Botón de volver */}
        <div className="mb-8">
          <Button variant="outline" asChild>
            <Link href="/noticias">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Volver a noticias
            </Link>
          </Button>
        </div>

        {/* Título de la noticia */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            {noticia.titulo}
          </h1>
          
          {/* Información del autor y fecha */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative h-10 w-10 rounded-full overflow-hidden">
              {noticia.autor_avatar ? (
                <Image
                  src={noticia.autor_avatar}
                  alt={noticia.autor_nombre || "Autor"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-medium">
                    {(noticia.autor_nombre || "A").charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="font-medium">{noticia.autor_nombre || "Autor desconocido"}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Imagen de portada */}
        {(noticia.imagen_url || noticia.imagen_portada) && (
          <div className="relative w-full md:w-3/4 lg:w-2/3 aspect-video mb-8 rounded-lg overflow-hidden mx-auto">
            <Image
              src={noticia.imagen_url || noticia.imagen_portada}
              alt={noticia.titulo}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 66vw"
            />
          </div>
        )}

        {/* Contenido de la noticia */}
        <div className="max-w-4xl mx-auto mb-10 prose dark:prose-invert prose-img:rounded-lg prose-headings:font-bold prose-a:text-primary">
          <div 
            dangerouslySetInnerHTML={{ 
              __html: noticia.contenido 
            }} 
          />
        </div>

        {/* Separador */}
        <div className="max-w-4xl mx-auto mb-8">
          <Separator className="my-4" />
        </div>

        {/* Comentarios */}
        <div className="max-w-4xl mx-auto mb-10">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Comentarios</h2>
              <p className="text-center text-muted-foreground py-8">
                Cargando sistema de comentarios...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// Componente de esqueleto para la carga
function NoticiaSkeletonUI() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-4 px-1">
        {/* Botón de volver */}
        <div className="mb-8">
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Título de la noticia */}
        <div className="mb-8">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-8 w-1/2 mb-6" />
          
          {/* Información del autor y fecha */}
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>

        {/* Imagen de portada */}
        <Skeleton className="w-full md:w-3/4 lg:w-2/3 aspect-video mb-8 rounded-lg mx-auto" />

        {/* Contenido de la noticia */}
        <div className="max-w-4xl mx-auto mb-10 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Separador */}
        <div className="max-w-4xl mx-auto mb-8">
          <Separator className="my-4" />
        </div>

        {/* Comentarios */}
        <div className="max-w-4xl mx-auto mb-10">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-40 mb-6" />
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
