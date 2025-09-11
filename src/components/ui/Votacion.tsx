'use client';

import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type VotacionProps = {
  id: string;
  tipo: 'hilo' | 'comentario' | 'noticia';
  votosIniciales?: number;
  vertical?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

export function Votacion({ 
  id, 
  tipo, 
  votosIniciales = 0, 
  vertical = true,
  size = 'md'
}: VotacionProps) {
  const { user } = useAuth();
  const [votos, setVotos] = useState(votosIniciales);
  const [miVoto, setMiVoto] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Tamaños para los iconos
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Cargar el voto del usuario al montar el componente
  useEffect(() => {
    const cargarMiVoto = async () => {
      if (!user?.id) return;
      
      try {
        const res = await fetch(`/api/foro/${tipo}/${id}/votar`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (res.ok) {
          const data = await res.json();
          setMiVoto(data.userVote);
          setVotos(data.total);
        }
      } catch (error) {
        console.error('Error al cargar el voto:', error);
      }
    };

    cargarMiVoto();
  }, [id, tipo, user?.id]);

  const manejarVoto = async (valor: number) => {
    if (!user) {
      alert('Debes iniciar sesión para votar');
      return;
    }

    setIsLoading(true);
    const valorNuevo = miVoto === valor ? 0 : valor;
    
    // Actualización optimista
    const votoAnterior = miVoto || 0;
    const nuevoTotal = votos - votoAnterior + (votoAnterior === valor ? 0 : valor);
    setMiVoto(votoAnterior === valor ? null : valor);
    setVotos(nuevoTotal);

    try {
      const res = await fetch(`/api/foro/${tipo}/${id}/votar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: valorNuevo })
      });
      
      if (!res.ok) {
        throw new Error('Error al registrar el voto');
      }
      
      const data = await res.json();
      setVotos(data.total);
      setMiVoto(data.userVote);
    } catch (error) {
      console.error('Error al votar:', error);
      // Revertir en caso de error
      setVotos(votos);
      setMiVoto(votoAnterior === 0 ? null : votoAnterior);
      alert('No se pudo registrar tu voto. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const Container = vertical ? 'div' : 'span';
  const containerClasses = vertical 
    ? 'flex flex-col items-center' 
    : 'inline-flex items-center gap-1';

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size];

  return (
    <Container className={`${containerClasses} ${!vertical ? 'ml-2' : ''}`}>
      <button
        onClick={() => manejarVoto(1)}
        disabled={isLoading}
        className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${
          miVoto === 1 
            ? 'text-green-500' 
            : 'text-gray-400 hover:text-green-500 dark:text-gray-500 dark:hover:text-green-400'
        }`}
        aria-label="Votar positivo"
      >
        <ArrowUp className={iconSizes[size]} />
      </button>
      
      <span className={`${textClasses} font-medium mx-1 min-w-[20px] text-center ${
        votos > 0 
          ? 'text-green-500' 
          : votos < 0 
            ? 'text-red-500' 
            : 'text-gray-500'
      }`}>
        {votos}
      </span>
      
      <button
        onClick={() => manejarVoto(-1)}
        disabled={isLoading}
        className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${
          miVoto === -1 
            ? 'text-red-500' 
            : 'text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400'
        }`}
        aria-label="Votar negativo"
      >
        <ArrowDown className={iconSizes[size]} />
      </button>
    </Container>
  );
}
