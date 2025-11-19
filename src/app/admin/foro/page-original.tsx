/**
 * Panel de Administración del Foro - Versión Optimizada
 * Dashboard completo con estadísticas en tiempo real y herramientas de moderación
 */

"use client";

import React, { Suspense, lazy } from "react";
import AdminProtection from "@/components/AdminProtection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  LayoutDashboard,
  Shield,
  FolderOpen,
  BarChart3,
  Settings,
  Tag,
} from "lucide-react";

// Lazy loading de componentes para optimizar carga inicial
const EstadisticasGenerales = lazy(
  () => import("@/components/admin/foro/EstadisticasGenerales")
);
const GraficoActividad = lazy(
  () => import("@/components/admin/foro/GraficoActividad")
);
const HilosPopulares = lazy(
  () => import("@/components/admin/foro/HilosPopulares")
);
const UsuariosActivos = lazy(
  () => import("@/components/admin/foro/UsuariosActivos")
);
const EstadisticasCategorias = lazy(
  () => import("@/components/admin/foro/EstadisticasCategorias")
);
const PanelModeracion = lazy(
  () => import("@/components/admin/foro/PanelModeracion")
);
/* const GestorCategorias = lazy(() => import('@/components/admin/foro/GestorCategorias')); */
const BusquedaAvanzada = lazy(
  () => import("@/components/admin/foro/BusquedaAvanzada")
);
const NotificacionesRealTime = lazy(
  () => import("@/components/admin/foro/NotificacionesRealTime")
);

// Nuevos componentes de moderación
const TablaReportes = lazy(
  () => import("@/components/admin/foro/moderacion/TablaReportes")
);
const GestionUsuarios = lazy(
  () => import("@/components/admin/foro/moderacion/GestionUsuarios")
);
const EstadisticasModeracion = lazy(
  () => import("@/components/admin/foro/moderacion/EstadisticasModeracion")
);

// Componente de carga
function ComponenteSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-[400px] w-full" />
      </CardContent>
    </Card>
  );
}

function DashboardContent() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Panel de Administración del Foro
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona y modera el contenido del foro de la comunidad
          </p>
        </div>
        <Suspense fallback={null}>
          <NotificacionesRealTime />
        </Suspense>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="moderacion" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Moderación</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Categorías</span>
          </TabsTrigger>
          <TabsTrigger value="estadisticas" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Estadísticas</span>
          </TabsTrigger>
          <TabsTrigger
            value="configuracion"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configuración</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Dashboard Principal */}
        <TabsContent value="dashboard" className="space-y-6">
          <Suspense fallback={<ComponenteSkeleton />}>
            <EstadisticasGenerales />
          </Suspense>

          <div className="grid gap-6 lg:grid-cols-2">
            <Suspense fallback={<ComponenteSkeleton />}>
              <GraficoActividad />
            </Suspense>
            <Suspense fallback={<ComponenteSkeleton />}>
              <HilosPopulares />
            </Suspense>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Suspense fallback={<ComponenteSkeleton />}>
              <UsuariosActivos />
            </Suspense>
            <Suspense fallback={<ComponenteSkeleton />}>
              <EstadisticasCategorias />
            </Suspense>
          </div>
        </TabsContent>

        {/* Tab: Moderación */}
        <TabsContent value="moderacion" className="space-y-6">
          <Suspense fallback={<ComponenteSkeleton />}>
            <EstadisticasModeracion />
          </Suspense>

          <Tabs defaultValue="reportes" className="space-y-4">
            <TabsList>
              <TabsTrigger value="reportes">Reportes</TabsTrigger>
              <TabsTrigger value="usuarios">Gestión de Usuarios</TabsTrigger>
            </TabsList>

            <TabsContent value="reportes">
              <Suspense fallback={<ComponenteSkeleton />}>
                <TablaReportes />
              </Suspense>
            </TabsContent>

            <TabsContent value="usuarios">
              <Suspense fallback={<ComponenteSkeleton />}>
                <GestionUsuarios />
              </Suspense>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Tab: Categorías - Eliminado temporalmente */}
        <TabsContent value="categorias" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Gestión de Categorías
                </h3>
                <p className="text-muted-foreground">
                  Próximamente: Nueva interfaz de gestión de categorías
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Estadísticas Detalladas */}
        <TabsContent value="estadisticas" className="space-y-6">
          <Suspense fallback={<ComponenteSkeleton />}>
            <EstadisticasCategorias />
          </Suspense>

          <Suspense fallback={<ComponenteSkeleton />}>
            <GraficoActividad />
          </Suspense>

          <div className="grid gap-6 lg:grid-cols-2">
            <Suspense fallback={<ComponenteSkeleton />}>
              <HilosPopulares />
            </Suspense>
            <Suspense fallback={<ComponenteSkeleton />}>
              <UsuariosActivos />
            </Suspense>
          </div>
        </TabsContent>

        {/* Tab: Configuración */}
        <TabsContent value="configuracion" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Configuración del Foro
                </h3>
                <p className="text-muted-foreground">
                  Próximamente: Configuración avanzada del foro
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminForoPage() {
  return (
    <AdminProtection>
      <DashboardContent />
    </AdminProtection>
  );
}
