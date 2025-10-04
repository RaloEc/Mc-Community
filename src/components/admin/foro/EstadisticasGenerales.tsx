/**
 * Componente de estadísticas generales del foro
 * Muestra métricas clave en tarjetas visuales
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEstadisticasGenerales } from './hooks/useEstadisticasForo';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Eye, 
  FolderOpen, 
  Tag,
  Calendar,
  Activity
} from 'lucide-react';

interface MetricaCardProps {
  titulo: string;
  valor: number | string;
  icono: React.ReactNode;
  descripcion?: string;
  tendencia?: {
    valor: number;
    esPositiva: boolean;
  };
}

const MetricaCard = React.memo(({ titulo, valor, icono, descripcion, tendencia }: MetricaCardProps) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {titulo}
      </CardTitle>
      <div className="text-muted-foreground">
        {icono}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {typeof valor === 'number' ? valor.toLocaleString() : valor ?? '0'}
      </div>
      {descripcion && (
        <p className="text-xs text-muted-foreground mt-1">{descripcion}</p>
      )}
      {tendencia && (
        <div className={`flex items-center mt-2 text-xs ${tendencia.esPositiva ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp className={`h-3 w-3 mr-1 ${!tendencia.esPositiva && 'rotate-180'}`} />
          <span>{tendencia.valor}% vs período anterior</span>
        </div>
      )}
    </CardContent>
  </Card>
));

MetricaCard.displayName = 'MetricaCard';

export default function EstadisticasGenerales() {
  const { data: stats, isLoading, error } = useEstadisticasGenerales();

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Error al cargar las estadísticas</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricaCard
          titulo="Total de Hilos"
          valor={stats.total_hilos}
          icono={<MessageSquare className="h-4 w-4" />}
          descripcion="Hilos activos en el foro"
        />
        <MetricaCard
          titulo="Total de Comentarios"
          valor={stats.total_comentarios}
          icono={<Users className="h-4 w-4" />}
          descripcion="Respuestas en todos los hilos"
        />
        <MetricaCard
          titulo="Categorías Activas"
          valor={stats.total_categorias}
          icono={<FolderOpen className="h-4 w-4" />}
          descripcion="Categorías disponibles"
        />
        <MetricaCard
          titulo="Total de Vistas"
          valor={stats.total_vistas}
          icono={<Eye className="h-4 w-4" />}
          descripcion="Vistas acumuladas"
        />
      </div>

      {/* Métricas adicionales */}
      <div className="grid gap-4 md:grid-cols-2">
        <MetricaCard
          titulo="Promedio de Comentarios por Hilo"
          valor={stats.promedio_comentarios_por_hilo || 0}
          icono={<TrendingUp className="h-4 w-4" />}
          descripcion="Engagement promedio"
        />
        <MetricaCard
          titulo="Promedio de Hilos por Usuario"
          valor={stats.promedio_hilos_por_usuario || 0}
          icono={<Users className="h-4 w-4" />}
          descripcion="Actividad promedio por usuario"
        />
      </div>
    </div>
  );
}
