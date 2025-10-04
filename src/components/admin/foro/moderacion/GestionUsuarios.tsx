'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertTriangle, Ban, Clock, Shield, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistorialItem {
  id: string;
  tipo_accion: string;
  razon: string;
  moderador_nombre: string;
  created_at: string;
  detalles: any;
}

export default function GestionUsuarios() {
  const [usuarioId, setUsuarioId] = useState('');
  const [dialogSancion, setDialogSancion] = useState(false);
  const [tipoSancion, setTipoSancion] = useState('advertencia');
  const [razonSancion, setRazonSancion] = useState('');
  const [diasSuspension, setDiasSuspension] = useState('7');
  const [puntosSancion, setPuntosSancion] = useState('5');
  const queryClient = useQueryClient();

  // Buscar información del usuario
  const { data: usuarioData, isLoading: loadingUsuario, error: errorUsuario } = useQuery({
    queryKey: ['usuario-info', usuarioId],
    queryFn: async () => {
      if (!usuarioId) return null;
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('perfiles')
        .select('id, username, avatar_url, role, created_at')
        .eq('id', usuarioId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!usuarioId && usuarioId.length >= 36, // UUID mínimo
    retry: false,
  });

  const { data: historialData } = useQuery({
    queryKey: ['historial-usuario', usuarioId],
    queryFn: async () => {
      if (!usuarioId) return null;
      const res = await fetch(`/api/admin/foro/usuarios/${usuarioId}/historial`);
      if (!res.ok) throw new Error('Error al cargar historial');
      return res.json();
    },
    enabled: !!usuarioId && !!usuarioData,
  });

  const { data: sancionesData } = useQuery({
    queryKey: ['sanciones-usuario', usuarioId],
    queryFn: async () => {
      if (!usuarioId) return null;
      const res = await fetch(`/api/admin/foro/sanciones?usuario_id=${usuarioId}`);
      if (!res.ok) throw new Error('Error al cargar sanciones');
      return res.json();
    },
    enabled: !!usuarioId && !!usuarioData,
  });

  const aplicarSancionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/foro/sanciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Error al aplicar sanción');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historial-usuario'] });
      queryClient.invalidateQueries({ queryKey: ['sanciones-usuario'] });
      toast.success('Sanción aplicada correctamente');
      setDialogSancion(false);
      setRazonSancion('');
    },
    onError: () => {
      toast.error('Error al aplicar la sanción');
    },
  });

  const handleAplicarSancion = () => {
    if (!razonSancion.trim()) {
      toast.error('Debes proporcionar una razón');
      return;
    }

    const puntos = parseInt(puntosSancion) || 0;
    const dias = tipoSancion === 'suspension_temporal' ? parseInt(diasSuspension) : null;

    aplicarSancionMutation.mutate({
      usuario_id: usuarioId,
      tipo_sancion: tipoSancion,
      razon: razonSancion,
      dias_duracion: dias,
      puntos,
      notificar: true,
    });
  };

  const getTipoAccionIcon = (tipo: string) => {
    switch (tipo) {
      case 'advertencia': return <AlertTriangle className="h-4 w-4" />;
      case 'suspension_temporal': return <Clock className="h-4 w-4" />;
      case 'suspension_permanente': return <Ban className="h-4 w-4" />;
      case 'baneo': return <Ban className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const historial = historialData?.historial || [];
  const sanciones = sancionesData?.sanciones || [];

  return (
    <div className="space-y-6">
      {/* Búsqueda de usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Usuario</CardTitle>
          <CardDescription>
            Ingresa el ID del usuario para ver su historial de moderación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="ID del usuario (UUID)"
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                className="flex-1"
              />
              <Dialog open={dialogSancion} onOpenChange={setDialogSancion}>
                <DialogTrigger asChild>
                  <Button disabled={!usuarioData}>
                    <Shield className="h-4 w-4 mr-2" />
                    Aplicar Sanción
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Aplicar Sanción</DialogTitle>
                  <DialogDescription>
                    Aplica una sanción al usuario seleccionado
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tipo de Sanción</label>
                    <Select value={tipoSancion} onValueChange={setTipoSancion}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="advertencia">Advertencia</SelectItem>
                        <SelectItem value="suspension_temporal">Suspensión Temporal</SelectItem>
                        <SelectItem value="suspension_permanente">Suspensión Permanente</SelectItem>
                        <SelectItem value="baneo">Baneo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {tipoSancion === 'suspension_temporal' && (
                    <div>
                      <label className="text-sm font-medium">Días de Suspensión</label>
                      <Input
                        type="number"
                        value={diasSuspension}
                        onChange={(e) => setDiasSuspension(e.target.value)}
                        className="mt-1"
                        min="1"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Puntos de Sanción</label>
                    <Input
                      type="number"
                      value={puntosSancion}
                      onChange={(e) => setPuntosSancion(e.target.value)}
                      className="mt-1"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Razón</label>
                    <Textarea
                      value={razonSancion}
                      onChange={(e) => setRazonSancion(e.target.value)}
                      placeholder="Describe la razón de la sanción..."
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={handleAplicarSancion}
                    disabled={aplicarSancionMutation.isPending}
                    className="w-full"
                  >
                    Aplicar Sanción
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>

            {/* Tarjeta de vista previa del usuario */}
            {loadingUsuario && usuarioId.length >= 36 && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Buscando usuario...</p>
              </div>
            )}

            {errorUsuario && usuarioId.length >= 36 && (
              <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                <p className="text-sm text-destructive font-medium">Usuario no encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Verifica que el ID sea correcto
                </p>
              </div>
            )}

            {usuarioData && (
              <div className="p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {usuarioData.avatar_url ? (
                      <img
                        src={usuarioData.avatar_url}
                        alt={usuarioData.username}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                          {usuarioData.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{usuarioData.username}</h3>
                      {usuarioData.role === 'admin' && (
                        <Badge variant="default">Admin</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">ID: {usuarioData.id}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Miembro desde: {format(new Date(usuarioData.created_at), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {usuarioData && (
        <>
          {/* Sanciones Activas */}
          {sanciones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sanciones Activas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sanciones.map((sancion: any) => (
                    <div
                      key={sancion.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getTipoAccionIcon(sancion.tipo_sancion)}
                        <div>
                          <p className="font-medium">{sancion.tipo_sancion.replace('_', ' ')}</p>
                          <p className="text-sm text-muted-foreground">{sancion.razon}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">{sancion.puntos_acumulados} pts</Badge>
                        {sancion.fin && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Hasta: {format(new Date(sancion.fin), 'dd/MM/yyyy', { locale: es })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historial de Moderación */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Moderación</CardTitle>
              <CardDescription>
                Todas las acciones de moderación aplicadas a este usuario
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historial.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay historial de moderación para este usuario
                </p>
              ) : (
                <div className="space-y-3">
                  {historial.map((item: HistorialItem) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      {getTipoAccionIcon(item.tipo_accion)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{item.tipo_accion.replace('_', ' ')}</p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.razon}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Por: {item.moderador_nombre || 'Moderador'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
