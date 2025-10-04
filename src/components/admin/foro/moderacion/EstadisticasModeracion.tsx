'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, Users, Shield, TrendingUp } from 'lucide-react';

export default function EstadisticasModeracion() {
  const { data: estadisticasData, isLoading } = useQuery({
    queryKey: ['estadisticas-moderacion'],
    queryFn: async () => {
      const res = await fetch('/api/admin/foro/estadisticas-moderacion');
      if (!res.ok) throw new Error('Error al cargar estadísticas');
      return res.json();
    },
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });

  const stats = estadisticasData?.estadisticas || {};

  const estadisticas = [
    {
      titulo: 'Reportes Totales',
      valor: stats.reportes_totales || 0,
      descripcion: 'Últimos 30 días',
      icono: AlertCircle,
      color: 'text-blue-500',
    },
    {
      titulo: 'Reportes Pendientes',
      valor: stats.reportes_pendientes || 0,
      descripcion: 'Requieren atención',
      icono: Clock,
      color: 'text-yellow-500',
    },
    {
      titulo: 'Reportes Resueltos',
      valor: stats.reportes_resueltos || 0,
      descripcion: 'Últimos 30 días',
      icono: CheckCircle,
      color: 'text-green-500',
    },
    {
      titulo: 'Usuarios Sancionados',
      valor: stats.usuarios_sancionados || 0,
      descripcion: 'Últimos 30 días',
      icono: Shield,
      color: 'text-red-500',
    },
    {
      titulo: 'En Lista de Vigilancia',
      valor: stats.usuarios_en_vigilancia || 0,
      descripcion: 'Usuarios problemáticos',
      icono: Users,
      color: 'text-orange-500',
    },
    {
      titulo: 'Tiempo Promedio',
      valor: stats.tiempo_promedio_resolucion 
        ? `${Math.round(stats.tiempo_promedio_resolucion)}h`
        : 'N/A',
      descripcion: 'Resolución de reportes',
      icono: TrendingUp,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {estadisticas.map((stat, index) => {
          const Icon = stat.icono;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.titulo}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : stat.valor}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.descripcion}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Acciones por Tipo */}
      {stats.acciones_por_tipo && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones de Moderación por Tipo</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.acciones_por_tipo).map(([tipo, cantidad]: [string, any]) => (
                <div key={tipo} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{tipo.replace('_', ' ')}</span>
                  <span className="text-sm font-medium">{cantidad}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
