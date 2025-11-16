"use client";

import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  Edit,
  UserX,
  UserCheck,
  AlertTriangle,
  Ban,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import { UsuarioCompleto } from "@/types";

interface TablaUsuariosProps {
  usuarios: UsuarioCompleto[];
  isLoading: boolean;
  usuariosSeleccionados: string[];
  ordenCampo: string;
  ordenDireccion: "ASC" | "DESC";
  onToggleSeleccionTodos: () => void;
  onToggleSeleccionUsuario: (id: string) => void;
  onCambiarOrden: (campo: string) => void;
  onToggleStatus: (usuario: UsuarioCompleto) => void;
  onAdvertir: (usuario: UsuarioCompleto) => void;
  onSuspender: (usuario: UsuarioCompleto) => void;
  onEliminar: (usuario: UsuarioCompleto) => void;
}

export function TablaUsuarios({
  usuarios,
  isLoading,
  usuariosSeleccionados,
  ordenCampo,
  ordenDireccion,
  onToggleSeleccionTodos,
  onToggleSeleccionUsuario,
  onCambiarOrden,
  onToggleStatus,
  onAdvertir,
  onSuspender,
  onEliminar,
}: TablaUsuariosProps) {
  const router = useRouter();

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "destructive",
      moderator: "default",
      usuario: "secondary",
    } as const;

    return (
      <Badge variant={variants[role as keyof typeof variants] || "secondary"}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (activo: boolean) => {
    return (
      <Badge variant={activo ? "default" : "destructive"}>
        {activo ? (
          <>
            <UserCheck className="w-3 h-3 mr-1" />
            Activo
          </>
        ) : (
          <>
            <UserX className="w-3 h-3 mr-1" />
            Inactivo
          </>
        )}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Nunca";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Fecha inválida";
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const formatDateRelative = (dateString: string | null | undefined) => {
    if (!dateString) return "Nunca";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Fecha inválida";

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Hace un momento";
      if (diffMins < 60) return `Hace ${diffMins}m`;
      if (diffHours < 24) return `Hace ${diffHours}h`;
      if (diffDays < 7) return `Hace ${diffDays}d`;

      return formatDate(dateString);
    } catch {
      return "Fecha inválida";
    }
  };

  const IconoOrden = ({ campo }: { campo: string }) => {
    if (ordenCampo !== campo) return null;
    return ordenDireccion === "ASC" ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  const renderAcciones = (usuario: UsuarioCompleto) => (
    <div className="flex justify-center items-center space-x-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => router.push(`/admin/usuarios/${usuario.id}`)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver Perfil</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() =>
                router.push(`/admin/usuarios/${usuario.id}/editar`)
              }
            >
              <Edit className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Editar</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onToggleStatus(usuario)}
              className={
                usuario.perfil?.activo ? "text-destructive" : "text-green-500"
              }
            >
              {usuario.perfil?.activo ? (
                <UserX className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{usuario.perfil?.activo ? "Desactivar" : "Activar"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onAdvertir(usuario)}
              className="text-amber-500"
            >
              <AlertTriangle className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Advertir</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onSuspender(usuario)}
              className="text-orange-500"
            >
              <Ban className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Suspender</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEliminar(usuario)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Eliminar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <>
      {/* Vista Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    usuariosSeleccionados.length === usuarios.length &&
                    usuarios.length > 0
                  }
                  onCheckedChange={onToggleSeleccionTodos}
                />
              </TableHead>
              <TableHead className="w-[80px]"></TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onCambiarOrden("username")}
              >
                Usuario <IconoOrden campo="username" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onCambiarOrden("role")}
              >
                Rol <IconoOrden campo="role" />
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onCambiarOrden("fecha_ultimo_acceso")}
              >
                Último Acceso <IconoOrden campo="fecha_ultimo_acceso" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onCambiarOrden("created_at")}
              >
                Registro <IconoOrden campo="created_at" />
              </TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                >
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                >
                  No se encontraron usuarios con los filtros actuales.
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => (
                <TableRow key={usuario.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={usuariosSeleccionados.includes(usuario.id)}
                      onCheckedChange={() =>
                        onToggleSeleccionUsuario(usuario.id)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <img
                      src={
                        usuario.perfil?.avatar_url ||
                        usuario.user_metadata?.avatar_url ||
                        "/images/default-avatar.svg"
                      }
                      alt={usuario.perfil?.username || "Usuario"}
                      className="w-12 h-12 rounded-full object-cover bg-gray-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/default-avatar.svg";
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {usuario.perfil?.username || "Usuario"}
                    {usuario.perfil?.email_verificado && (
                      <CheckCircle2 className="w-4 h-4 inline ml-1 text-green-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(usuario.perfil?.role ?? "usuario")}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(Boolean(usuario.perfil?.activo))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {usuario.perfil?.fecha_ultimo_acceso ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {formatDateRelative(
                                usuario.perfil.fecha_ultimo_acceso
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {formatDate(usuario.perfil.fecha_ultimo_acceso)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground/50">Nunca</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(usuario.created_at)}
                  </TableCell>
                  <TableCell className="text-center">
                    {renderAcciones(usuario)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vista Mobile */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Cargando usuarios...
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No se encontraron usuarios con los filtros actuales.
          </div>
        ) : (
          usuarios.map((usuario) => (
            <div
              key={usuario.id}
              className="p-4 bg-card rounded-lg border space-y-3"
            >
              {/* Header con avatar y checkbox */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={usuariosSeleccionados.includes(usuario.id)}
                    onCheckedChange={() => onToggleSeleccionUsuario(usuario.id)}
                  />
                  <img
                    src={
                      usuario.perfil?.avatar_url ||
                      usuario.user_metadata?.avatar_url ||
                      "/images/default-avatar.svg"
                    }
                    alt={usuario.perfil?.username || "Usuario"}
                    className="w-10 h-10 rounded-full object-cover bg-gray-700"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/default-avatar.svg";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate flex items-center gap-1">
                      {usuario.perfil?.username || "Usuario"}
                      {usuario.perfil?.email_verificado && (
                        <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {usuario.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                {getRoleBadge(usuario.perfil?.role ?? "usuario")}
                {getStatusBadge(Boolean(usuario.perfil?.activo))}
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Registro</div>
                  <div className="font-medium">
                    {formatDate(usuario.created_at)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Último acceso</div>
                  <div className="font-medium">
                    {usuario.perfil?.fecha_ultimo_acceso
                      ? formatDateRelative(usuario.perfil.fecha_ultimo_acceso)
                      : "Nunca"}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-1 justify-end pt-2 border-t">
                {renderAcciones(usuario)}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
