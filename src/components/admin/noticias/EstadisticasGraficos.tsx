'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import type { NoticiaEstadistica } from './EstadisticasTabla';

interface EstadisticasGraficosProps {
  datos: NoticiaEstadistica[];
  isLoading?: boolean;
  periodo?: 'semanal' | 'mensual' | 'anual';
  onPeriodoChange?: (periodo: 'semanal' | 'mensual' | 'anual') => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export function EstadisticasGraficos({
  datos,
  isLoading = false,
  periodo = 'mensual',
  onPeriodoChange,
}: EstadisticasGraficosProps) {
  // Preparar datos para gráfico de barras (Top 10 noticias)
  const datosBarras = useMemo(() => {
    return datos.slice(0, 10).map((noticia) => ({
      nombre: noticia.titulo.length > 30 ? noticia.titulo.substring(0, 30) + '...' : noticia.titulo,
      vistas: noticia.vistas,
      vistas_semana: noticia.vistas_semana,
      vistas_mes: noticia.vistas_mes,
    }));
  }, [datos]);

  // Preparar datos para gráfico de líneas (Tendencias)
  const datosLineas = useMemo(() => {
    return datos.slice(0, 15).map((noticia, index) => ({
      posicion: index + 1,
      vistas: noticia.vistas,
      tendencia: noticia.porcentaje_cambio,
    }));
  }, [datos]);

  // Preparar datos para gráfico de área (Comparación semanal vs mensual)
  const datosArea = useMemo(() => {
    return datos.slice(0, 10).map((noticia, index) => ({
      nombre: `N${index + 1}`,
      semana: noticia.vistas_semana,
      mes: noticia.vistas_mes,
    }));
  }, [datos]);

  // Preparar datos para gráfico circular (Distribución de tendencias)
  const datosPie = useMemo(() => {
    const tendencias = datos.reduce(
      (acc, noticia) => {
        if (noticia.tendencia === 'up') acc.positivas++;
        else if (noticia.tendencia === 'down') acc.negativas++;
        else acc.estables++;
        return acc;
      },
      { positivas: 0, negativas: 0, estables: 0 }
    );

    return [
      { name: 'Tendencia Positiva', value: tendencias.positivas, color: '#00C49F' },
      { name: 'Tendencia Negativa', value: tendencias.negativas, color: '#FF8042' },
      { name: 'Estable', value: tendencias.estables, color: '#8884d8' },
    ];
  }, [datos]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!datos || datos.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No hay datos suficientes para mostrar gráficos
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
              <Activity className="h-5 w-5" />
              Visualización de Datos
            </CardTitle>
            <CardDescription>
              Análisis visual del rendimiento de noticias
            </CardDescription>
          </div>
          <Select
            value={periodo}
            onValueChange={(value) =>
              onPeriodoChange?.(value as 'semanal' | 'mensual' | 'anual')
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensual">Mensual</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="barras" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="barras">
              <BarChart3 className="h-4 w-4 mr-2" />
              Barras
            </TabsTrigger>
            <TabsTrigger value="lineas">
              <TrendingUp className="h-4 w-4 mr-2" />
              Tendencias
            </TabsTrigger>
            <TabsTrigger value="area">
              <Activity className="h-4 w-4 mr-2" />
              Comparación
            </TabsTrigger>
            <TabsTrigger value="circular">
              <PieChartIcon className="h-4 w-4 mr-2" />
              Distribución
            </TabsTrigger>
          </TabsList>

          {/* Gráfico de Barras - Top Noticias */}
          <TabsContent value="barras" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Top 10 noticias por número de vistas
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={datosBarras} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nombre" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Legend />
                <Bar dataKey="vistas" fill="#8884d8" name="Vistas Totales" />
                <Bar dataKey="vistas_mes" fill="#82ca9d" name="Vistas del Mes" />
                <Bar dataKey="vistas_semana" fill="#ffc658" name="Vistas de la Semana" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Gráfico de Líneas - Tendencias */}
          <TabsContent value="lineas" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Evolución de vistas y tendencias (Top 15)
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={datosLineas} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="posicion" label={{ value: 'Ranking', position: 'insideBottom', offset: -10 }} />
                <YAxis yAxisId="left" label={{ value: 'Vistas', angle: -90, position: 'insideLeft' }} />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  label={{ value: 'Cambio %', angle: 90, position: 'insideRight' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="vistas" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Vistas"
                  dot={{ r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="tendencia" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Cambio %"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Gráfico de Área - Comparación */}
          <TabsContent value="area" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Comparación de vistas semanales vs mensuales (Top 10)
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={datosArea} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="mes" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  name="Vistas del Mes"
                />
                <Area 
                  type="monotone" 
                  dataKey="semana" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                  name="Vistas de la Semana"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Gráfico Circular - Distribución de Tendencias */}
          <TabsContent value="circular" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Distribución de tendencias en todas las noticias
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={datosPie}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(p: { name?: string; percent?: number }) => {
                    const name = p.name ?? ''
                    const percent = typeof p.percent === 'number' ? p.percent : 0
                    return `${name}: ${(percent * 100).toFixed(0)}%`
                  }}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {datosPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            {/* Resumen numérico */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              {datosPie.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{item.name}</p>
                        <p className="text-2xl font-bold">{item.value}</p>
                      </div>
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Componente de skeleton para los gráficos
export function EstadisticasGraficosLoading() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </CardContent>
    </Card>
  );
}
