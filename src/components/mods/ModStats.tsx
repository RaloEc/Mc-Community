'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Box, Code, Star } from 'lucide-react';

export function ModStats() {
  const [stats, setStats] = useState({
    totalMods: 0,
    totalDownloads: 0,
    totalCategories: 0,
    mostPopularMod: null as { id: string; nombre: string; descargas: number } | null,
    loading: true,
    error: null as string | null
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const supabase = createClient();
        
        // Obtener estadísticas de los mods
        const { data: modsData } = await supabase
          .from('mods')
          .select('id, nombre, descargas')
          .order('descargas', { ascending: false })
          .limit(1);

        const { count: totalMods } = await supabase
          .from('mods')
          .select('*', { count: 'exact', head: true });

        const { count: totalCategories } = await supabase
          .from('categorias_mod')
          .select('*', { count: 'exact', head: true });

        const totalDownloads = modsData?.reduce((sum, mod) => sum + (mod.descargas || 0), 0) || 0;
        const mostPopularMod = modsData?.[0] || null;

        setStats({
          totalMods: totalMods || 0,
          totalDownloads,
          totalCategories: totalCategories || 0,
          mostPopularMod,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error al cargar estadísticas de mods:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Error al cargar las estadísticas de los mods.'
        }));
      }
    };

    loadStats();
  }, []);

  const { totalMods, totalDownloads, totalCategories, mostPopularMod, loading, error } = stats;

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
              <div className="h-6 w-6 bg-muted rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 w-16 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        {error}
      </div>
    );
  }

  const statsData = [
    {
      title: 'Total de Mods',
      value: totalMods.toLocaleString(),
      icon: <Box className="h-6 w-6 text-muted-foreground" />,
      description: 'Mods disponibles en la plataforma',
    },
    {
      title: 'Descargas Totales',
      value: totalDownloads.toLocaleString(),
      icon: <Download className="h-6 w-6 text-muted-foreground" />,
      description: 'Descargas acumuladas',
    },
    {
      title: 'Categorías',
      value: totalCategories.toLocaleString(),
      icon: <Code className="h-6 w-6 text-muted-foreground" />,
      description: 'Diferentes categorías disponibles',
    },
    {
      title: 'Mod más popular',
      value: mostPopularMod ? '1' : 'N/A',
      icon: <Star className="h-6 w-6 text-muted-foreground" />,
      description: mostPopularMod 
        ? `"${mostPopularMod.nombre}" con ${mostPopularMod.descargas?.toLocaleString()} descargas` 
        : 'Aún no hay datos',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className="h-6 w-6">
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
