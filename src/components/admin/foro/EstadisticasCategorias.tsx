/**
 * Componente para mostrar estadísticas detalladas por categoría
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useEstadisticasCategorias } from './hooks/useEstadisticasForo';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { FolderOpen, MessageSquare, Eye, TrendingUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function EstadisticasCategorias() {
  const { data: categorias, isLoading, error } = useEstadisticasCategorias();

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Error al cargar estadísticas de categorías</p>
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
  const categoriasPrincipales = categorias.filter(c => c.nivel === 0 || c.parent_id === null);
  const subcategorias = categorias.filter(c => c.nivel === 2 && c.parent_id !== null);

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
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Hilos</TableHead>
                <TableHead className="text-center">Comentarios</TableHead>
                <TableHead className="text-center">Vistas</TableHead>
                <TableHead className="text-center">Activos (7d)</TableHead>
                <TableHead>Último Hilo</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriasPrincipales.map((categoria) => {
                const subs = subcategorias.filter(s => s.parent_id === categoria.id);
                
                return (
                  <React.Fragment key={categoria.id}>
                    {/* Categoría principal */}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {categoria.icono && <span>{categoria.icono}</span>}
                          <span>{categoria.nombre}</span>
                          {categoria.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: categoria.color }}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {categoria.total_hilos}
                      </TableCell>
                      <TableCell className="text-center">
                        {categoria.total_comentarios}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          {categoria.total_vistas.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={categoria.hilos_activos_semana > 0 ? 'default' : 'secondary'}>
                          {categoria.hilos_activos_semana}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {categoria.ultimo_hilo_fecha ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(categoria.ultimo_hilo_fecha), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin hilos</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={categoria.es_activa ? 'default' : 'destructive'}>
                          {categoria.es_activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                    </TableRow>

                    {/* Subcategorías */}
                    {subs.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="pl-8">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">└─</span>
                            {sub.icono && <span>{sub.icono}</span>}
                            <span>{sub.nombre}</span>
                            {sub.color && (
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: sub.color }}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{sub.total_hilos}</TableCell>
                        <TableCell className="text-center">{sub.total_comentarios}</TableCell>
                        <TableCell className="text-center">
                          {sub.total_vistas.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={sub.hilos_activos_semana > 0 ? 'default' : 'secondary'} className="text-xs">
                            {sub.hilos_activos_semana}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sub.ultimo_hilo_fecha ? (
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(sub.ultimo_hilo_fecha), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin hilos</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={sub.es_activa ? 'outline' : 'destructive'} className="text-xs">
                            {sub.es_activa ? 'Activa' : 'Inactiva'}
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
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {categorias.reduce((sum, c) => sum + c.total_hilos, 0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Total de Hilos</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {categorias.reduce((sum, c) => sum + c.total_comentarios, 0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Total de Comentarios</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {categorias.reduce((sum, c) => sum + c.total_vistas, 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Total de Vistas</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
