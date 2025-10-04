/**
 * Componente para mostrar los usuarios más activos del foro
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUsuariosActivos } from './hooks/useEstadisticasForo';
import { Users, MessageSquare, FileText, Award, TrendingUp } from 'lucide-react';

type PeriodoType = 7 | 30 | 0;

export default function UsuariosActivos() {
  const [periodo, setPeriodo] = useState<PeriodoType>(30);
  const { data: usuarios, isLoading, error } = useUsuariosActivos(10, periodo);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Error al cargar usuarios activos</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !usuarios) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRolColor = (rol: string) => {
    switch (rol.toLowerCase()) {
      case 'admin':
        return 'bg-red-500';
      case 'moderador':
        return 'bg-blue-500';
      case 'vip':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios Más Activos
            </CardTitle>
            <CardDescription className="mt-2">
              Top 10 usuarios por actividad
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={periodo === 7 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodo(7)}
            >
              7 días
            </Button>
            <Button
              variant={periodo === 30 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodo(30)}
            >
              30 días
            </Button>
            <Button
              variant={periodo === 0 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodo(0)}
            >
              Todo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {usuarios.map((usuario, index) => (
            <div
              key={usuario.usuario_id}
              className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              {/* Ranking */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                {index + 1}
              </div>

              {/* Avatar y nombre */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={usuario.avatar_url || undefined} alt={usuario.username} />
                  <AvatarFallback>{usuario.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{usuario.username}</span>
                    {usuario.role && usuario.role !== 'usuario' && (
                      <Badge variant="secondary" className={`text-xs ${getRolColor(usuario.role)} text-white`}>
                        {usuario.role}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>{usuario.hilos_creados || 0} hilos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{usuario.comentarios_creados || 0} comentarios</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      <span>{usuario.total_votos_recibidos || 0} votos</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actividad Total */}
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <div className="text-right">
                  <div className="font-bold text-lg">{(usuario.hilos_creados || 0) + (usuario.comentarios_creados || 0)}</div>
                  <div className="text-xs text-muted-foreground">actividad</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {usuarios.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay usuarios activos en este período
          </div>
        )}
      </CardContent>
    </Card>
  );
}
