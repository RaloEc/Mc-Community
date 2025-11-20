"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NoticiaEstadistica } from "./EstadisticasTabla";

interface EstadisticasGraficosProps {
  datos: NoticiaEstadistica[];
  isLoading?: boolean;
  periodo?: "semanal" | "mensual" | "anual";
  onPeriodoChange?: (periodo: "semanal" | "mensual" | "anual") => void;
}

// Lazy load EstadisticasGraficos
// Recharts es pesado (~150KB), se carga solo cuando se necesita
const EstadisticasGraficosComponent = dynamic(
  () =>
    import("./EstadisticasGraficos").then((mod) => mod.EstadisticasGraficos),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle>Cargando gráficos...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    ),
    ssr: true, // Recharts puede ser SSR
  }
);

export function EstadisticasGraficosLazy(props: EstadisticasGraficosProps) {
  return <EstadisticasGraficosComponent {...props} />;
}
