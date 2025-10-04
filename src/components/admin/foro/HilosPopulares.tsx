/**
 * Componente para mostrar los hilos más populares del foro
 * Con opciones de filtrado por período
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useHilosPopulares } from './hooks/useEstadisticasForo';
import { Eye, MessageSquare, TrendingUp, ArrowUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useUserTheme } from '@/hooks/useUserTheme';

type PeriodoType = 7 | 30 | 0;

export default function HilosPopulares() {
  const [periodo, setPeriodo] = useState<PeriodoType>(30);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { getFadedBackground } = useUserTheme();
  const { data: hilos, isLoading, error } = useHilosPopulares(10, periodo);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Error al cargar los hilos populares</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !hilos) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Hilos Más Populares
            </CardTitle>
            <CardDescription className="mt-2">
              Top 10 hilos por engagement
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={periodo === 7 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodo(7)}
            >
              7 días
            </Button>
            <Button
              variant={periodo === 30 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodo(30)}
            >
              30 días
            </Button>
            <Button
              variant={periodo === 0 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodo(0)}
            >
              Todo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hilos.map((hilo, index) => (
            <div
              key={hilo.id}
              className="flex items-start gap-4 p-4 rounded-lg border transition-colors"
              onMouseEnter={() => setHoveredId(hilo.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ backgroundColor: hoveredId === hilo.id ? getFadedBackground() : undefined }}
            >
              {/* Ranking */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                {index + 1}
              </div>

              {/* Avatar del autor */}
              <Avatar className="h-10 w-10">
                <AvatarImage src={hilo.autor_avatar_url || undefined} alt={hilo.autor_username} />
                <AvatarFallback>{hilo.autor_username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Link
                      href={`/foro/${hilo.categoria_nombre.toLowerCase()}/${hilo.slug}`}
                      className="font-medium hover:underline line-clamp-2"
                    >
                      {hilo.titulo}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>por {hilo.autor_username}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {hilo.categoria_nombre}
                      </Badge>
                    </div>
                  </div>
                  <Link
                    href={`/foro/${hilo.categoria_nombre.toLowerCase()}/${hilo.slug}`}
                    target="_blank"
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Métricas */}
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{hilo.vistas.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{hilo.comentarios_count}</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <ArrowUp className="h-4 w-4" />
                    <span>{hilo.votos_conteo}</span>
                  </div>
                  <div className="ml-auto">
                    <Badge variant="secondary" className="text-xs">
                      Score: {Math.round(hilo.puntuacion_popularidad)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hilos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay hilos en este período
          </div>
        )}
      </CardContent>
    </Card>
  );
}
