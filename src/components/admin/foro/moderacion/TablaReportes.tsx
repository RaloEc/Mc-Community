"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  MoreHorizontal,
  Flag,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface Reporte {
  id: string;
  tipo_contenido: string;
  contenido_id: string;
  reportado_por: string;
  razon: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  created_at: string;
  reportador_nombre: string;
  reportador_avatar: string;
  contenido_preview: string;
  hilo_slug: string;
  hilo_id: string;
}

export default function TablaReportes() {
  const [filtroEstado, setFiltroEstado] = useState<string>("pendiente");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [reportesSeleccionados, setReportesSeleccionados] = useState<string[]>(
    []
  );
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [reporteActual, setReporteActual] = useState<Reporte | null>(null);
  const [resolucion, setResolucion] = useState("");
  const queryClient = useQueryClient();

  // Función para generar la URL del contenido reportado
  const generarUrlReporte = (reporte: Reporte): string => {
    if (!reporte.hilo_slug) return "#";

    const baseUrl = `/foro/hilos/${reporte.hilo_slug}`;

    // Si es un post/comentario, agregar el hash para resaltar
    if (reporte.tipo_contenido === "post" || reporte.tipo_contenido === "comentario") {
      return `${baseUrl}?highlight=${reporte.contenido_id}#post-${reporte.contenido_id}`;
    }

    // Si es un hilo, solo retornar la URL base
    return baseUrl;
  };

  const { data: reportesData, isLoading } = useQuery({
    queryKey: ["reportes-foro", filtroEstado, filtroTipo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtroEstado) params.append("estado", filtroEstado);
      if (filtroTipo && filtroTipo !== "todos")
        params.append("tipo_contenido", filtroTipo);

      const res = await fetch(`/api/admin/foro/reportes?${params}`);
      if (!res.ok) throw new Error("Error al cargar reportes");
      return res.json();
    },
  });

  const resolverMutation = useMutation({
    mutationFn: async ({
      reporte_id,
      accion,
      resolucion,
    }: {
      reporte_id: string;
      accion: string;
      resolucion: string;
    }) => {
      const res = await fetch("/api/admin/foro/reportes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reporte_id, accion, resolucion }),
      });
      if (!res.ok) throw new Error("Error al procesar reporte");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reportes-foro"] });
      const accionTexto =
        variables.accion === "resolver" ? "resuelto" : "desestimado";
      toast.success(`Reporte ${accionTexto} correctamente`);
      setDialogAbierto(false);
      setResolucion("");
      setReporteActual(null);
    },
    onError: () => {
      toast.error("Error al procesar el reporte");
    },
  });

  const procesarMasivoMutation = useMutation({
    mutationFn: async ({
      reporte_ids,
      accion,
      resolucion,
    }: {
      reporte_ids: string[];
      accion: string;
      resolucion: string;
    }) => {
      const res = await fetch("/api/admin/foro/reportes/masivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reporte_ids, accion, resolucion }),
      });
      if (!res.ok) throw new Error("Error al procesar reportes");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reportes-foro"] });
      toast.success(`${data.procesados} reportes procesados correctamente`);
      setReportesSeleccionados([]);
    },
    onError: () => {
      toast.error("Error al procesar los reportes");
    },
  });

  const handleSeleccionarTodo = (checked: boolean) => {
    if (checked) {
      setReportesSeleccionados(
        reportesData?.reportes?.map((r: Reporte) => r.id) || []
      );
    } else {
      setReportesSeleccionados([]);
    }
  };

  const handleSeleccionarReporte = (id: string, checked: boolean) => {
    if (checked) {
      setReportesSeleccionados([...reportesSeleccionados, id]);
    } else {
      setReportesSeleccionados(
        reportesSeleccionados.filter((rid) => rid !== id)
      );
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "critica":
        return "destructive";
      case "alta":
        return "destructive";
      case "media":
        return "default";
      case "baja":
        return "secondary";
      default:
        return "default";
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "default";
      case "en_revision":
        return "default";
      case "resuelto":
        return "default";
      case "desestimado":
        return "secondary";
      default:
        return "default";
    }
  };

  const reportes = reportesData?.reportes || [];

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="en_revision">En revisión</SelectItem>
            <SelectItem value="resuelto">Resueltos</SelectItem>
            <SelectItem value="desestimado">Desestimados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo de contenido" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="hilo">Hilos</SelectItem>
            <SelectItem value="post">Posts</SelectItem>
            <SelectItem value="comentario">Comentarios</SelectItem>
          </SelectContent>
        </Select>

        {reportesSeleccionados.length > 0 && (
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (
                  confirm(`¿Resolver ${reportesSeleccionados.length} reportes?`)
                ) {
                  const resolucionMasiva = prompt("Ingresa la resolución:");
                  if (resolucionMasiva) {
                    procesarMasivoMutation.mutate({
                      reporte_ids: reportesSeleccionados,
                      accion: "resolver",
                      resolucion: resolucionMasiva,
                    });
                  }
                }
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolver seleccionados ({reportesSeleccionados.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (
                  confirm(
                    `¿Desestimar ${reportesSeleccionados.length} reportes?`
                  )
                ) {
                  const razonMasiva = prompt("Ingresa la razón:");
                  if (razonMasiva) {
                    procesarMasivoMutation.mutate({
                      reporte_ids: reportesSeleccionados,
                      accion: "desestimar",
                      resolucion: razonMasiva,
                    });
                  }
                }
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Desestimar seleccionados
            </Button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    reportesSeleccionados.length === reportes.length &&
                    reportes.length > 0
                  }
                  onCheckedChange={handleSeleccionarTodo}
                />
              </TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Razón</TableHead>
              <TableHead>Reportado por</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Cargando reportes...
                </TableCell>
              </TableRow>
            ) : reportes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No hay reportes con los filtros seleccionados
                </TableCell>
              </TableRow>
            ) : (
              reportes.map((reporte: Reporte) => (
                <TableRow key={reporte.id}>
                  <TableCell>
                    <Checkbox
                      checked={reportesSeleccionados.includes(reporte.id)}
                      onCheckedChange={(checked) =>
                        handleSeleccionarReporte(reporte.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{reporte.tipo_contenido}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{reporte.razon}</p>
                      {reporte.contenido_preview && (
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {reporte.contenido_preview}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {reporte.reportador_nombre || "Usuario"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getPrioridadColor(reporte.prioridad) as any}
                    >
                      {reporte.prioridad}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEstadoColor(reporte.estado) as any}>
                      {reporte.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(reporte.created_at), "dd/MM/yyyy HH:mm", {
                      locale: es,
                    })}
                  </TableCell>
                  <TableCell>
                    <Dialog
                      open={dialogAbierto && reporteActual?.id === reporte.id}
                      onOpenChange={(open) => {
                        setDialogAbierto(open);
                        if (!open) {
                          setResolucion("");
                          setReporteActual(null);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReporteActual(reporte);
                            setResolucion("");
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[92vw] max-w-[92vw] md:w-[70vw] md:max-w-[70vw] h-[90vh] max-h-[900px] p-0 overflow-hidden flex flex-col">
                        <DialogHeader className="p-2 border-b">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                              <Flag className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <DialogTitle className="text-xl">
                                Gestionar Reporte
                              </DialogTitle>
                              <DialogDescription className="text-base">
                                Revisa y toma acción sobre este reporte
                              </DialogDescription>
                            </div>
                          </div>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Información del reporte */}
                          <div className="bg-muted/50 rounded-lg p-4 space-y-3 md:col-span-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    getPrioridadColor(reporte.prioridad) as any
                                  }
                                  className="text-xs"
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {reporte.prioridad}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {reporte.tipo_contenido}
                                </Badge>
                                <Badge
                                  variant={
                                    getEstadoColor(reporte.estado) as any
                                  }
                                  className="text-xs"
                                >
                                  {reporte.estado}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(
                                  new Date(reporte.created_at),
                                  "d 'de' MMMM, yyyy 'a las' HH:mm",
                                  { locale: es }
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Reportado por */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <User className="h-4 w-4" />
                              Reportado por
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={reporte.reportador_avatar}
                                  alt={reporte.reportador_nombre}
                                />
                                <AvatarFallback>
                                  {reporte.reportador_nombre
                                    ?.substring(0, 2)
                                    .toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {reporte.reportador_nombre || "Usuario"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Usuario de la comunidad
                                </p>
                              </div>
                            </div>
                          </div>

                          <Separator className="md:col-span-2" />

                          {/* Razón del reporte */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <AlertCircle className="h-4 w-4" />
                              Razón del reporte
                            </div>
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
                              <p className="font-semibold text-amber-900 dark:text-amber-100 capitalize">
                                {reporte.razon.replace(/_/g, " ")}
                              </p>
                            </div>
                          </div>

                          {/* Descripción adicional */}
                          {reporte.descripcion && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <FileText className="h-4 w-4" />
                                Descripción adicional
                              </div>
                              <div className="p-3 bg-muted/30 rounded-lg border">
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {reporte.descripcion}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Vista previa del contenido */}
                          {reporte.contenido_preview && (
                            <div className="space-y-2 md:col-span-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Eye className="h-4 w-4" />
                                  Vista previa del contenido reportado
                                </div>
                                <a
                                  href={generarUrlReporte(reporte)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Ver origen
                                </a>
                              </div>
                              <div className="p-3 bg-muted/30 rounded-lg border">
                                <p className="text-sm line-clamp-3">
                                  {reporte.contenido_preview}
                                </p>
                              </div>
                            </div>
                          )}

                          <Separator />

                          {/* Resolución */}
                          <div className="space-y-3 md:col-span-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Tu resolución
                            </label>
                            <Textarea
                              value={resolucion}
                              onChange={(e) => setResolucion(e.target.value)}
                              placeholder="Describe la acción tomada y la razón de tu decisión..."
                              className="min-h-[100px] resize-none"
                              rows={4}
                            />
                            <p className="text-xs text-muted-foreground">
                              Esta resolución quedará registrada en el historial
                              del reporte
                            </p>
                          </div>

                          {/* Botones de acción */}
                          <div className="flex gap-3 pt-2 md:col-span-2">
                            <Button
                              onClick={() => {
                                if (resolucion.trim()) {
                                  resolverMutation.mutate({
                                    reporte_id: reporte.id,
                                    accion: "resolver",
                                    resolucion,
                                  });
                                } else {
                                  toast.error(
                                    "Por favor escribe una resolución"
                                  );
                                }
                              }}
                              disabled={
                                !resolucion.trim() || resolverMutation.isPending
                              }
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {resolverMutation.isPending
                                ? "Procesando..."
                                : "Resolver Reporte"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                if (resolucion.trim()) {
                                  resolverMutation.mutate({
                                    reporte_id: reporte.id,
                                    accion: "desestimar",
                                    resolucion,
                                  });
                                } else {
                                  toast.error("Por favor escribe una razón");
                                }
                              }}
                              disabled={
                                !resolucion.trim() || resolverMutation.isPending
                              }
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {resolverMutation.isPending
                                ? "Procesando..."
                                : "Desestimar"}
                            </Button>
                          </div>
                        </div>

                        {/* Footer fijo en la parte inferior */}
                        <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setDialogAbierto(false)}
                            >
                              Cerrar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
