'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EstadisticaCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  description?: string;
  loading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const EstadisticaCard = memo(function EstadisticaCard({
  icon: Icon,
  title,
  value,
  description,
  loading = false,
  trend,
}: EstadisticaCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Colores de fondo basados en el tipo de tarjeta
  const cardColors: Record<string, string> = {
    'Total Noticias': 'bg-blue-50 dark:bg-blue-900/20',
    'Total Vistas': 'bg-green-50 dark:bg-green-900/20',
    'Categorías': 'bg-purple-50 dark:bg-purple-900/20',
    'Noticias Recientes': 'bg-amber-50 dark:bg-amber-900/20',
    'Pendientes': 'bg-rose-50 dark:bg-rose-900/20'
  };

  // Colores de íconos basados en el tipo de tarjeta
  const iconColors: Record<string, string> = {
    'Total Noticias': 'text-blue-600 dark:text-blue-400',
    'Total Vistas': 'text-green-600 dark:text-green-400',
    'Categorías': 'text-purple-600 dark:text-purple-400',
    'Noticias Recientes': 'text-amber-600 dark:text-amber-400',
    'Pendientes': 'text-rose-600 dark:text-rose-400'
  };

  const cardClass = cardColors[title] || 'bg-gray-50 dark:bg-gray-800';
  const iconClass = iconColors[title] || 'text-primary';

  return (
    <Card className={cn("overflow-hidden relative", cardClass, {
      'hover:shadow-lg transition-all duration-200': true,
      'border-0': true
    })}>
      <div className="absolute top-4 right-4">
        <div className={cn("p-2 rounded-lg", iconClass, {
          'bg-white/20': true
        })}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <CardContent className="p-6 pt-8">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold text-foreground">{value}</h3>
          {trend && (
            <div className="flex items-center text-sm">
              <span className={cn("inline-flex items-center", {
                'text-green-600 dark:text-green-400': trend.isPositive,
                'text-red-600 dark:text-red-400': !trend.isPositive
              })}>
                {trend.isPositive ? (
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {trend.value}% del mes anterior
              </span>
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default EstadisticaCard;
