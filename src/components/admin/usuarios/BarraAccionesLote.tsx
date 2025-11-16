"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Ban, Trash2, X, Users } from "lucide-react";

interface BarraAccionesLoteProps {
  cantidadSeleccionados: number;
  onActivar: () => void;
  onDesactivar: () => void;
  onEliminar: () => void;
  onCancelar: () => void;
}

export function BarraAccionesLote({
  cantidadSeleccionados,
  onActivar,
  onDesactivar,
  onEliminar,
  onCancelar,
}: BarraAccionesLoteProps) {
  if (cantidadSeleccionados === 0) return null;

  return (
    <div className="mb-4 p-4 bg-primary/10 rounded-lg border border-primary/20 animate-in slide-in-from-top space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">
            {cantidadSeleccionados} usuario(s) seleccionado(s)
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={onCancelar}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Desktop: botones en fila */}
      <div className="hidden md:flex gap-2">
        <Button size="sm" variant="outline" onClick={onActivar}>
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Activar
        </Button>
        <Button size="sm" variant="outline" onClick={onDesactivar}>
          <Ban className="w-4 h-4 mr-1" />
          Desactivar
        </Button>
        <Button size="sm" variant="destructive" onClick={onEliminar}>
          <Trash2 className="w-4 h-4 mr-1" />
          Eliminar
        </Button>
      </div>

      {/* Mobile: botones en grid */}
      <div className="md:hidden grid grid-cols-3 gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onActivar}
          className="text-xs"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Activar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDesactivar}
          className="text-xs"
        >
          <Ban className="w-3 h-3 mr-1" />
          Desactivar
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onEliminar}
          className="text-xs"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Eliminar
        </Button>
      </div>
    </div>
  );
}
