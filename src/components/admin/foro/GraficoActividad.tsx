/**
 * Componente de gráfico de actividad diaria del foro
 * Utiliza Recharts para visualización de datos
 */

"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useActividadDiaria } from "./hooks/useEstadisticasForo";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp } from "lucide-react";

type PeriodoType = 7 | 14 | 30;

export default function GraficoActividad() {
  const [periodo, setPeriodo] = useState<PeriodoType>(30);
  const [isDesktop, setIsDesktop] = React.useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  const { data: actividad, isLoading, error } = useActividadDiaria(periodo);

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">
            Error al cargar el gráfico de actividad
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !actividad) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Formatear datos para el gráfico
  const datosGrafico = actividad.map((item) => ({
    fecha: format(new Date(item.fecha), "dd MMM", { locale: es }),
    fechaCompleta: format(new Date(item.fecha), "dd/MM/yyyy"),
    hilos: item.hilos_nuevos,
    comentarios: item.comentarios_nuevos,
    vistas: item.total_vistas,
  }));

  // Calcular totales del período
  const totales = actividad.reduce(
    (acc, item) => ({
      hilos: acc.hilos + item.hilos_nuevos,
      comentarios: acc.comentarios + item.comentarios_nuevos,
      vistas: acc.vistas + item.total_vistas,
    }),
    { hilos: 0, comentarios: 0, vistas: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <TrendingUp className="h-5 w-5" />
              Actividad del Foro
            </CardTitle>
            <CardDescription className="mt-2 text-xs sm:text-sm">
              Últimos {periodo} días - {totales.hilos} hilos,{" "}
              {totales.comentarios} comentarios
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={periodo === 7 ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriodo(7)}
              className="text-xs sm:text-sm"
            >
              7 días
            </Button>
            <Button
              variant={periodo === 14 ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriodo(14)}
              className="text-xs sm:text-sm"
            >
              14 días
            </Button>
            <Button
              variant={periodo === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriodo(30)}
              className="text-xs sm:text-sm"
            >
              30 días
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 -mx-6 sm:mx-0">
        <div className="w-full overflow-x-auto px-4 sm:px-0">
          <div style={{ minWidth: isDesktop ? "100%" : "calc(100vw - 48px)" }}>
            <ResponsiveContainer width="100%" height={isDesktop ? 300 : 220}>
              <AreaChart data={datosGrafico}>
                <defs>
                  <linearGradient id="colorHilos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorComentarios"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="fecha"
                  className="text-xs"
                  tick={{ fill: "currentColor", fontSize: isDesktop ? 12 : 10 }}
                  angle={isDesktop ? 0 : -45}
                  height={isDesktop ? 30 : 60}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "currentColor", fontSize: isDesktop ? 12 : 10 }}
                  width={isDesktop ? 40 : 30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.fechaCompleta;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="hilos"
                  name="Nuevos Hilos"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorHilos)"
                />
                <Area
                  type="monotone"
                  dataKey="comentarios"
                  name="Nuevos Comentarios"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorComentarios)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de líneas para vistas */}
        <div className="mt-8 w-full overflow-x-auto px-4 sm:px-0 -mx-6 sm:mx-0 sm:mt-8">
          <h4 className="text-sm font-medium mb-4 px-4 sm:px-0">
            Vistas Diarias
          </h4>
          <div style={{ minWidth: isDesktop ? "100%" : "calc(100vw - 48px)" }}>
            <ResponsiveContainer width="100%" height={isDesktop ? 200 : 160}>
              <LineChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="fecha"
                  className="text-xs"
                  tick={{ fill: "currentColor", fontSize: isDesktop ? 12 : 10 }}
                  angle={isDesktop ? 0 : -45}
                  height={isDesktop ? 30 : 60}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "currentColor", fontSize: isDesktop ? 12 : 10 }}
                  width={isDesktop ? 40 : 30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="vistas"
                  name="Vistas"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
