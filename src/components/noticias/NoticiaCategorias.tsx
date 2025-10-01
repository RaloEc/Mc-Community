'use client';

import React from 'react';
import Link from 'next/link';
import { CategoriaNoticia } from '@/types';

interface NoticiasCategoriasProps {
  categoria?: CategoriaNoticia | null;
  categorias?: CategoriaNoticia[];
}

const NoticiaCategorias: React.FC<NoticiasCategoriasProps> = ({ 
  categoria, 
  categorias = [] 
}) => {
  // Si no hay categorías, no renderizar nada
  if (!categoria && (!categorias || categorias.length === 0)) {
    return null;
  }

  // Determinar qué categorías mostrar
  const categoriasAMostrar = categorias && categorias.length > 0 
    ? categorias 
    : categoria ? [categoria] : [];

  if (categoriasAMostrar.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mb-10">
      <h2 className="text-xl font-semibold mb-4">Temas relacionados</h2>
      <div className="flex flex-wrap gap-2">
        {categoriasAMostrar.map((cat) => (
          <Link
            href={`/noticias/categoria/${cat.slug || cat.id}`}
            key={cat.id}
            className="block bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ease-in-out"
          >
            {cat.nombre}
          </Link>
        ))}
      </div>
    </div>
  );
};

// Memoizar el componente para evitar re-renderizados innecesarios
export default React.memo(NoticiaCategorias);
