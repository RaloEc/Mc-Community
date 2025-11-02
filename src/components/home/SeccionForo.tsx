'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Eye, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/hooks/useResponsive';
import HiloItem, { HiloDTO } from '@/components/foro/HiloItem';
import { useRealtimeVotosHilos } from '@/hooks/useRealtimeVotosHilos';

interface HiloForo {
  id: string;
  titulo: string;
  contenido?: string;
  created_at: string;
  ultimo_post_at: string;
  autor?: {
    id?: string;
    username: string;
    avatar_url?: string;
    rol?: string;
    public_id?: string;
    color?: string;
  };
  categoria?: {
    nombre: string;
    slug: string;
    color?: string;
  };
  votos_conteo: number;
  respuestas_conteo: number;
  vistas: number;
  weapon_stats_record?: {
    id: string;
    weapon_name: string | null;
    stats: any;
  } | null;
}

interface SeccionForoProps {
  className?: string;
}

export default function SeccionForo({ className = '' }: SeccionForoProps) {
  const [hilos, setHilos] = useState<{
    masVotados: HiloForo[];
    masVistos: HiloForo[];
    sinRespuestas: HiloForo[];
    recientes: HiloForo[];
  }>({
    masVotados: [],
    masVistos: [],
    sinRespuestas: [],
    recientes: []
  });
  const [loading, setLoading] = useState(true);
  const { isMobile, isLoaded } = useResponsive();

  // Activar sincronización en tiempo real de votos de hilos
  useRealtimeVotosHilos();

  useEffect(() => {
    const fetchHilos = async () => {
      try {
        const [votadosRes, vistosRes, sinRespuestasRes, recientesRes] = await Promise.all([
          fetch('/api/foro/hilos?tipo=mas_votados&limit=6'),
          fetch('/api/foro/hilos?tipo=mas_vistos&limit=6'),
          fetch('/api/foro/hilos?tipo=sin_respuestas&limit=6'),
          fetch('/api/foro/hilos?tipo=recientes&limit=6')
        ]);

        const [votadosData, vistosData, sinRespuestasData, recientesData] = await Promise.all([
          votadosRes.ok ? votadosRes.json() : { hilos: [] },
          vistosRes.ok ? vistosRes.json() : { hilos: [] },
          sinRespuestasRes.ok ? sinRespuestasRes.json() : { hilos: [] },
          recientesRes.ok ? recientesRes.json() : { hilos: [] }
        ]);

        setHilos({
          masVotados: votadosData.hilos || [],
          masVistos: vistosData.hilos || [],
          sinRespuestas: sinRespuestasData.hilos || [],
          recientes: recientesData.hilos || []
        });
      } catch (error) {
        console.error('Error al cargar hilos del foro:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHilos();
  }, []);

    // Función para convertir HiloForo a HiloDTO para el componente HiloItem
  const convertirAHiloDTO = (hilo: HiloForo): HiloDTO => {
    return {
      id: hilo.id,
      titulo: hilo.titulo,
      created_at: hilo.created_at,
      vistas: hilo.vistas,
      respuestas_count: hilo.respuestas_conteo,
      destacado: false,
      contenido: hilo.contenido,
      subcategoria: hilo.categoria ? {
        id: hilo.categoria.slug,
        nombre: hilo.categoria.nombre,
        slug: hilo.categoria.slug,
        color: hilo.categoria.color
      } : null,
      autor: hilo.autor ? {
        id: hilo.autor.id || hilo.autor.username || '',
        username: hilo.autor.username,
        avatar_url: hilo.autor.avatar_url,
        public_id: hilo.autor.public_id ?? null,
        color: hilo.autor.color ?? undefined
      } : null,
      votos: hilo.votos_conteo,
      weapon_stats_record: hilo.weapon_stats_record ?? null
    };
  };

  if (loading || !isLoaded) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Foro de Discusión
          </h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-16 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Foro de Discusión
        </h2>
        <Link href="/foro">
          <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            Ver todo el foro
          </Button>
        </Link>
      </div>

      <div className="space-y-12">
          {/* Sección Más Votados */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Más Votados</h3>
            </div>
            <div className="space-y-4">
              {hilos.masVotados.map((hilo) => (
                <HiloItem key={hilo.id} hilo={convertirAHiloDTO(hilo)} />
              ))}
            </div>
          </div>

          {/* Sección Más Vistos */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Eye className="h-5 w-5 text-indigo-500" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Más Vistos</h3>
            </div>
            <div className="space-y-4">
              {hilos.masVistos.map((hilo) => (
                <HiloItem key={hilo.id} hilo={convertirAHiloDTO(hilo)} />
              ))}
            </div>
          </div>

          {/* Sección Sin Respuestas */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Sin Respuesta</h3>
            </div>
            <div className="space-y-4">
              {hilos.sinRespuestas.map((hilo) => (
                <HiloItem key={hilo.id} hilo={convertirAHiloDTO(hilo)} />
              ))}
            </div>
          </div>

          {/* Sección Recientes */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-blue-500" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recientes</h3>
            </div>
            <div className="space-y-4">
              {hilos.recientes.map((hilo) => (
                <HiloItem key={hilo.id} hilo={convertirAHiloDTO(hilo)} />
              ))}
            </div>
          </div>
      </div>
    </div>
  );
}
