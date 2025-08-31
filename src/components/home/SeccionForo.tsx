'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, TrendingUp, Eye, Clock, ArrowUp, ArrowDown, AlertCircle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface HiloForo {
  id: string;
  titulo: string;
  contenido?: string;
  created_at: string;
  ultimo_post_at: string;
  autor?: {
    username: string;
    avatar_url?: string;
    rol?: string;
  };
  categoria?: {
    nombre: string;
    slug: string;
    color?: string;
  };
  votos_conteo: number;
  respuestas_conteo: number;
  vistas: number;
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
  const [activeTab, setActiveTab] = useState('mas-votados');

  useEffect(() => {
    const fetchHilos = async () => {
      try {
        const [votadosRes, vistosRes, sinRespuestasRes, recientesRes] = await Promise.all([
          fetch('/api/foro/hilos?tipo=mas-votados&limit=6'),
          fetch('/api/foro/hilos?tipo=mas-vistos&limit=6'),
          fetch('/api/foro/hilos?tipo=sin-respuestas&limit=6'),
          fetch('/api/foro/hilos?tipo=recientes&limit=6')
        ]);

        const [votadosData, vistosData, sinRespuestasData, recientesData] = await Promise.all([
          votadosRes.ok ? votadosRes.json() : { items: [] },
          vistosRes.ok ? vistosRes.json() : { items: [] },
          sinRespuestasRes.ok ? sinRespuestasRes.json() : { items: [] },
          recientesRes.ok ? recientesRes.json() : { items: [] }
        ]);

        setHilos({
          masVotados: votadosData.items || [],
          masVistos: vistosData.items || [],
          sinRespuestas: sinRespuestasData.items || [],
          recientes: recientesData.items || []
        });
      } catch (error) {
        console.error('Error al cargar hilos del foro:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHilos();
  }, []);

  const getAuthorColor = (rol?: string) => {
    switch (rol) {
      case 'admin': return 'text-red-600 dark:text-red-400';
      case 'moderator': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getExcerpt = (contenido: string | undefined, maxLength: number = 80) => {
    if (!contenido) return '';
    const plainText = contenido.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  };

  const HiloCard = ({ hilo }: { hilo: HiloForo }) => (
    <Link href={`/foro/hilo/${hilo.id}`}>
      <article className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md dark:hover:shadow-gray-900/20 transition-all duration-200 hover:scale-[1.01] group">
        <div className="flex items-start gap-3">
          {/* Votación */}
          <div className="flex flex-col items-center gap-1 min-w-[40px]">
            <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowUp className="h-4 w-4 text-gray-400 hover:text-green-500" />
            </button>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {hilo.votos_conteo}
            </span>
            <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowDown className="h-4 w-4 text-gray-400 hover:text-red-500" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {hilo.titulo}
              </h3>
              {hilo.categoria && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 text-xs flex-shrink-0"
                  style={{ 
                    borderLeft: `2px solid ${hilo.categoria.color || '#3b82f6'}` 
                  }}
                >
                  {hilo.categoria.nombre}
                </Badge>
              )}
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2">
              {getExcerpt(hilo.contenido)}
            </p>

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className={`font-medium ${getAuthorColor(hilo.autor?.rol)}`}>
                    {hilo.autor?.username ?? 'Anónimo'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(hilo.created_at), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{hilo.respuestas_conteo}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{hilo.vistas}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );

  if (loading) {
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="mas-votados" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Más Votados</span>
            <span className="sm:hidden">Top</span>
          </TabsTrigger>
          <TabsTrigger value="mas-vistos" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Más Vistos</span>
            <span className="sm:hidden">Vistos</span>
          </TabsTrigger>
          <TabsTrigger value="sin-respuestas" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Sin Respuesta</span>
            <span className="sm:hidden">Sin Resp.</span>
          </TabsTrigger>
          <TabsTrigger value="recientes" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Recientes</span>
            <span className="sm:hidden">Nuevos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mas-votados" className="mt-6">
          <div className="space-y-4">
            {hilos.masVotados.map((hilo) => (
              <HiloCard key={hilo.id} hilo={hilo} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mas-vistos" className="mt-6">
          <div className="space-y-4">
            {hilos.masVistos.map((hilo) => (
              <HiloCard key={hilo.id} hilo={hilo} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sin-respuestas" className="mt-6">
          <div className="space-y-4">
            {hilos.sinRespuestas.map((hilo) => (
              <HiloCard key={hilo.id} hilo={hilo} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recientes" className="mt-6">
          <div className="space-y-4">
            {hilos.recientes.map((hilo) => (
              <HiloCard key={hilo.id} hilo={hilo} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
