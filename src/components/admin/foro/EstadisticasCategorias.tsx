/**
 * Componente para mostrar estadísticas detalladas por categoría
 */

"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useEstadisticasCategorias } from "./hooks/useEstadisticasForo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FolderOpen,
  MessageSquare,
  Eye,
  TrendingUp,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function EstadisticasCategorias() {
  const { data: categorias, isLoading, error } = useEstadisticasCategorias();

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">
            Error al cargar estadísticas de categorías
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !categorias) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Separar categorías principales y subcategorías
  // Las categorías principales tienen nivel 0 (sin parent_id)
  // Las subcategorías tienen nivel 2 (con parent_id)
  const categoriasPrincipales = categorias.filter(
    (c) => c.nivel === 0 || c.parent_id === null
  );
  const subcategorias = categorias.filter(
    (c) => c.nivel === 2 && c.parent_id !== null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Estadísticas por Categoría
        </CardTitle>
        <CardDescription>
          Rendimiento detallado de cada categoría del foro
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="rounded-md border overflow-x-auto -mx-6 sm:mx-0 px-4 sm:px-0">
          <Table className="min-w-full text-xs sm:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Categoría</TableHead>
                <TableHead className="text-center text-xs sm:text-sm">
                  Hilos
                </TableHead>
                <TableHead className="text-center text-xs sm:text-sm hidden sm:table-cell">
                  Comentarios
                </TableHead>
                <TableHead className="text-center text-xs sm:text-sm hidden md:table-cell">
                  Vistas
                </TableHead>
                <TableHead className="text-center text-xs sm:text-sm">
                  Activos
                </TableHead>
                <TableHead className="text-xs sm:text-sm hidden lg:table-cell">
                  Último Hilo
                </TableHead>
                <TableHead className="text-center text-xs sm:text-sm">
                  Estado
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriasPrincipales.map((categoria) => {
                const subs = subcategorias.filter(
                  (s) => s.parent_id === categoria.id
                );

                return (
                  <React.Fragment key={categoria.id}>
                    {/* Categoría principal */}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-medium text-xs sm:text-sm">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {categoria.icono && (
                            <span className="hidden sm:inline">
                              {categoria.icono}
                            </span>
                          )}
                          <span className="truncate">{categoria.nombre}</span>
                          {categoria.color && (
                            <div
                              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: categoria.color }}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-xs sm:text-sm">
                        {categoria.total_hilos}
                      </TableCell>
                      <TableCell className="text-center text-xs sm:text-sm hidden sm:table-cell">
                        {categoria.total_comentarios}
                      </TableCell>
                      <TableCell className="text-center text-xs sm:text-sm hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          {categoria.total_vistas.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            categoria.hilos_activos_semana > 0
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {categoria.hilos_activos_semana}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                        {categoria.ultimo_hilo_fecha ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(
                              new Date(categoria.ultimo_hilo_fecha),
                              {
                                addSuffix: true,
                                locale: es,
                              }
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Sin hilos
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            categoria.es_activa ? "default" : "destructive"
                          }
                          className="text-xs"
                        >
                          {categoria.es_activa ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                    </TableRow>

                    {/* Subcategorías */}
                    {subs.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="pl-4 sm:pl-8 text-xs sm:text-sm">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="text-muted-foreground text-xs">
                              └─
                            </span>
                            {sub.icono && (
                              <span className="hidden sm:inline">
                                {sub.icono}
                              </span>
                            )}
                            <span className="truncate">{sub.nombre}</span>
                            {sub.color && (
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: sub.color }}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-xs sm:text-sm">
                          {sub.total_hilos}
                        </TableCell>
                        <TableCell className="text-center text-xs sm:text-sm hidden sm:table-cell">
                          {sub.total_comentarios}
                        </TableCell>
                        <TableCell className="text-center text-xs sm:text-sm hidden md:table-cell">
                          {sub.total_vistas.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              sub.hilos_activos_semana > 0
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {sub.hilos_activos_semana}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                          {sub.ultimo_hilo_fecha ? (
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(sub.ultimo_hilo_fecha),
                                {
                                  addSuffix: true,
                                  locale: es,
                                }
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Sin hilos
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={sub.es_activa ? "outline" : "destructive"}
                            className="text-xs"
                          >
                            {sub.es_activa ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Resumen */}
        <div className="mt-6 grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 px-4 sm:px-0 -mx-6 sm:mx-0">
          <Card>
            <CardContent className="pt-3 sm:pt-6 pb-3 sm:pb-6 px-3 sm:px-6">
              <div className="text-center">
                <div className="text-base sm:text-2xl font-bold">
                  {categorias.reduce((sum, c) => sum + c.total_hilos, 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Hilos</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 sm:pt-6 pb-3 sm:pb-6 px-3 sm:px-6">
              <div className="text-center">
                <div className="text-base sm:text-2xl font-bold">
                  {categorias.reduce((sum, c) => sum + c.total_comentarios, 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Comentarios
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="pt-3 sm:pt-6 pb-3 sm:pb-6 px-3 sm:px-6">
              <div className="text-center">
                <div className="text-base sm:text-2xl font-bold">
                  {categorias
                    .reduce((sum, c) => sum + c.total_vistas, 0)
                    .toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Vistas</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
