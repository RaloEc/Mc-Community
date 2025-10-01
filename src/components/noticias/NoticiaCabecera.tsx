'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, Pencil } from 'lucide-react';

interface NoticiaCabeceraProps {
  titulo: string;
  esAdmin?: boolean;
  noticiaId: string;
}

const NoticiaCabecera: React.FC<NoticiaCabeceraProps> = ({ 
  titulo, 
  esAdmin = false,
  noticiaId
}) => {
  return (
    <>
      {/* Botón de volver */}
      <div className="mb-8">
        <Button variant="outline" asChild>
          <Link href="/noticias">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a noticias
          </Link>
        </Button>
      </div>

      {/* Cabecera de la noticia */}
      <div className="mb-8 bg-background dark:bg-background">
        {/* Título grande */}
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 line-clamp-3 md:line-clamp-none">
          {titulo}
        </h1>

        {/* Espacio entre título e información del autor */}
        <div className="mb-6"></div>

        {/* Botón de edición (solo visible para administradores) */}
        {esAdmin && (
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30"
              asChild
            >
              <Link href={`/admin/noticias/editar/${noticiaId}`}>
                <Pencil className="h-3 w-3" />
                Editar
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

// Memoizar el componente para evitar re-renderizados innecesarios
export default React.memo(NoticiaCabecera);
