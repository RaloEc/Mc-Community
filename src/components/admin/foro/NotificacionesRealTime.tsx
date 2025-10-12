/**
 * Componente de notificaciones para el foro
 * Utiliza polling para actualizaciones (alternativa a Realtime)
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import { Bell, MessageSquare, FileText, Trash2, X, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';

interface Notificacion {
  id: string;
  tipo: 'nuevo_hilo' | 'nuevo_comentario' | 'hilo_eliminado' | 'comentario_eliminado';
  titulo: string;
  descripcion: string;
  autor_username: string;
  autor_avatar_url: string | null;
  url: string;
  created_at: string;
  leida: boolean;
}

export default function NotificacionesRealTime() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());
  const [actualizando, setActualizando] = useState(false);

  // Función para obtener actividad reciente
  const obtenerActividadReciente = useCallback(async () => {
    try {
      setActualizando(true);
      const supabase = createClient();
      const hace5Min = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      // Obtener hilos recientes (últimos 5 minutos)
      const { data: hilosRecientes } = await supabase
        .from('foro_hilos')
        .select(`
          id,
          titulo,
          slug,
          created_at,
          autor_id,
          perfiles:autor_id (
            username,
            avatar_url
          )
        `)
        .is('deleted_at', null)
        .gte('created_at', hace5Min)
        .order('created_at', { ascending: false })
        .limit(10);

      // Obtener comentarios recientes (últimos 5 minutos)
      const { data: comentariosRecientes } = await supabase
        .from('foro_posts')
        .select(`
          id,
          created_at,
          autor_id,
          hilo_id,
          perfiles:autor_id (
            username,
            avatar_url
          ),
          foro_hilos:hilo_id (
            titulo,
            slug
          )
        `)
        .is('deleted_at', null)
        .gte('created_at', hace5Min)
        .order('created_at', { ascending: false })
        .limit(10);

      const nuevasNotificaciones: Notificacion[] = [];

      // Procesar hilos
      if (hilosRecientes) {
        hilosRecientes.forEach((hilo: any) => {
          if (new Date(hilo.created_at) > ultimaActualizacion) {
            nuevasNotificaciones.push({
              id: `hilo-${hilo.id}`,
              tipo: 'nuevo_hilo',
              titulo: 'Nuevo hilo creado',
              descripcion: hilo.titulo,
              autor_username: hilo.perfiles?.username || 'Usuario',
              autor_avatar_url: hilo.perfiles?.avatar_url || null,
              url: `/foro/${hilo.slug}`,
              created_at: hilo.created_at,
              leida: false,
            });
          }
        });
      }

      // Procesar comentarios
      if (comentariosRecientes) {
        comentariosRecientes.forEach((comentario: any) => {
          if (new Date(comentario.created_at) > ultimaActualizacion) {
            nuevasNotificaciones.push({
              id: `comentario-${comentario.id}`,
              tipo: 'nuevo_comentario',
              titulo: 'Nuevo comentario',
              descripcion: `en: ${comentario.foro_hilos?.titulo || 'Hilo desconocido'}`,
              autor_username: comentario.perfiles?.username || 'Usuario',
              autor_avatar_url: comentario.perfiles?.avatar_url || null,
              url: `/foro/${comentario.foro_hilos?.slug || ''}#comentario-${comentario.id}`,
              created_at: comentario.created_at,
              leida: false,
            });
          }
        });
      }

      // Agregar nuevas notificaciones
      if (nuevasNotificaciones.length > 0) {
        setNotificaciones((prev) => [...nuevasNotificaciones, ...prev].slice(0, 50));
        setNoLeidas((prev) => prev + nuevasNotificaciones.length);
        
        // Mostrar toast solo para la primera notificación
        if (nuevasNotificaciones.length > 0) {
          const primera = nuevasNotificaciones[0];
          toast.info(primera.titulo, {
            description: primera.descripcion,
          });
        }
      }

      setUltimaActualizacion(new Date());
    } catch (error) {
      console.error('Error al obtener actividad reciente:', error);
    } finally {
      setActualizando(false);
    }
  }, []);

  // Polling cada 30 segundos
  useEffect(() => {
    obtenerActividadReciente();
    
    const interval = setInterval(() => {
      obtenerActividadReciente();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [obtenerActividadReciente]);

  const marcarComoLeida = (id: string) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
    setNoLeidas((prev) => Math.max(0, prev - 1));
  };

  const marcarTodasLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    setNoLeidas(0);
  };

  const eliminarNotificacion = (id: string) => {
    const notif = notificaciones.find((n) => n.id === id);
    if (notif && !notif.leida) {
      setNoLeidas((prev) => Math.max(0, prev - 1));
    }
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcono = (tipo: Notificacion['tipo']) => {
    switch (tipo) {
      case 'nuevo_hilo':
        return <FileText className="h-4 w-4" />;
      case 'nuevo_comentario':
        return <MessageSquare className="h-4 w-4" />;
      case 'hilo_eliminado':
      case 'comentario_eliminado':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setMostrarPanel(!mostrarPanel)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {noLeidas > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {noLeidas > 99 ? '99+' : noLeidas}
          </Badge>
        )}
      </Button>

      {mostrarPanel && (
        <Card className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificaciones
                {noLeidas > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {noLeidas} nuevas
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={obtenerActividadReciente}
                  disabled={actualizando}
                  title="Actualizar notificaciones"
                >
                  <RefreshCw className={`h-4 w-4 ${actualizando ? 'animate-spin' : ''}`} />
                </Button>
                {noLeidas > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={marcarTodasLeidas}
                    className="text-xs"
                  >
                    Marcar todas como leídas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarPanel(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Actualización automática cada 30 segundos
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {notificaciones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground px-4">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notificaciones.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-accent transition-colors ${
                        !notif.leida ? 'bg-accent/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={notif.autor_avatar_url || undefined}
                            alt={notif.autor_username}
                          />
                          <AvatarFallback>
                            {notif.autor_username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getIcono(notif.tipo)}
                                <span className="text-sm font-medium">
                                  {notif.titulo}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {notif.descripcion}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground">
                                  por {notif.autor_username}
                                </span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(notif.created_at), {
                                    addSuffix: true,
                                    locale: es,
                                  })}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarNotificacion(notif.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <Link href={notif.url} target="_blank">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => marcarComoLeida(notif.id)}
                              >
                                Ver
                              </Button>
                            </Link>
                            {!notif.leida && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => marcarComoLeida(notif.id)}
                              >
                                Marcar como leída
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
