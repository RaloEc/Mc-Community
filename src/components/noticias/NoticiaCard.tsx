'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarIcon, ArrowRightIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Noticia } from '@/types';

interface NoticiaCardProps {
  noticia: Noticia;
  mostrarResumen?: boolean;
}

// Componente de tarjeta de noticia optimizado con React.memo
const NoticiaCard: React.FC<NoticiaCardProps> = ({ noticia, mostrarResumen = true }) => {
  // Función para renderizar la categoría principal
  const renderCategoria = () => {
    if (noticia.categorias && noticia.categorias.length > 0) {
      // Buscar categorías padres (sin parent_id)
      const categoriasPadre = noticia.categorias.filter(c => !c.parent_id);
      
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
          noticia.categorias.find(c => c.id === primerSubcategoria.parent_id) : null;
        
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

  return (
    <div className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-border/50 relative dark:data-[theme=amoled]:bg-black">
      <div className="relative h-48 overflow-hidden">
        {/* Categorías en la esquina superior izquierda */}
        <div className="flex flex-wrap gap-1 mb-2">
          {renderCategoria()}
        </div>
        
        {(noticia.imagen_url || noticia.imagen_portada) ? (
          <Image 
            src={noticia.imagen_url || noticia.imagen_portada || '/placeholder.jpg'} 
            alt={noticia.titulo} 
            fill
            loading="lazy"
            className="object-cover"
            onError={(e) => {
              console.error('Error al cargar imagen de noticia en lista');
              // Ocultar la imagen y mostrar el fallback
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-primary/20', 'to-primary/40');
              const fallback = document.createElement('span');
              fallback.className = 'text-primary-foreground text-lg font-medium absolute inset-0 flex items-center justify-center';
              fallback.textContent = 'MC Community';
              e.currentTarget.parentElement?.appendChild(fallback);
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <span className="text-primary-foreground text-lg font-medium">MC Community</span>
          </div>
        )}
      </div>
      <div className="p-4 pb-8">
        <div className="flex items-center mb-2 text-xs text-muted-foreground">
          <CalendarIcon className="h-3 w-3 mr-1" />
          <span>{new Date(noticia.fecha_publicacion || '').toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}</span>
        </div>
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
          <Link href={`/noticias/${noticia.id}`} className="hover:text-primary transition-colors">
            {noticia.titulo}
          </Link>
        </h3>
        {mostrarResumen && noticia.contenido && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {noticia.resumen || noticia.contenido.replace(/<[^>]*>/g, '').substring(0, 120) + '...'}
          </p>
        )}
        <div className="flex justify-end">
          <Link href={`/noticias/${noticia.id}`} className="text-primary hover:text-primary/80 font-medium inline-flex items-center">
              <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
      {/* Autor posicionado en el borde inferior de toda la tarjeta */}
      {(noticia.autor_nombre || noticia.autor?.username) && (
        <span 
          className="absolute bottom-2 left-4 text-xs text-muted-foreground"
        >
          <Link 
            href={`/perfil/${noticia.autor?.username || noticia.autor_nombre}`} 
            className="text-sm hover:underline" 
            style={{ color: noticia.autor?.color || noticia.autor_color || 'inherit' }}
          >
            {noticia.autor?.username || noticia.autor_nombre}
          </Link>
        </span>
      )}
    </div>
  );
};

// Función de comparación personalizada para React.memo
const areEqual = (prevProps: NoticiaCardProps, nextProps: NoticiaCardProps) => {
  // Comparar solo los campos relevantes para evitar re-renderizados innecesarios
  return (
    prevProps.noticia.id === nextProps.noticia.id &&
    prevProps.noticia.titulo === nextProps.noticia.titulo &&
    prevProps.noticia.contenido === nextProps.noticia.contenido &&
    prevProps.noticia.imagen_url === nextProps.noticia.imagen_url &&
    prevProps.noticia.imagen_portada === nextProps.noticia.imagen_portada &&
    prevProps.noticia.fecha_publicacion === nextProps.noticia.fecha_publicacion &&
    prevProps.mostrarResumen === nextProps.mostrarResumen &&
    JSON.stringify(prevProps.noticia.categorias) === JSON.stringify(nextProps.noticia.categorias)
  );
};

// Exportar el componente memoizado
export default React.memo(NoticiaCard, areEqual);
