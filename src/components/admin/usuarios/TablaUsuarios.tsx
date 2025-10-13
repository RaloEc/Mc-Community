'use client'

import { useRouter } from 'next/navigation'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Eye, Edit, UserX, UserCheck, AlertTriangle, Ban, Trash2, 
  ChevronDown, ChevronUp, CheckCircle2 
} from 'lucide-react'
import { UsuarioCompleto } from '@/types'

interface TablaUsuariosProps {
  usuarios: UsuarioCompleto[]
  isLoading: boolean
  usuariosSeleccionados: string[]
  ordenCampo: string
  ordenDireccion: 'ASC' | 'DESC'
  onToggleSeleccionTodos: () => void
  onToggleSeleccionUsuario: (id: string) => void
  onCambiarOrden: (campo: string) => void
  onToggleStatus: (usuario: UsuarioCompleto) => void
  onAdvertir: (usuario: UsuarioCompleto) => void
  onSuspender: (usuario: UsuarioCompleto) => void
  onEliminar: (usuario: UsuarioCompleto) => void
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
  onEliminar
}: TablaUsuariosProps) {
  const router = useRouter()

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'destructive',
      moderator: 'default',
      usuario: 'secondary'
    } as const

    return (
      <Badge variant={variants[role as keyof typeof variants] || 'secondary'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const getStatusBadge = (activo: boolean) => {
    return (
      <Badge variant={activo ? 'default' : 'destructive'}>
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
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const IconoOrden = ({ campo }: { campo: string }) => {
    if (ordenCampo !== campo) return null
    return ordenDireccion === 'ASC' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />
  }

  return (
    <div className="hidden md:block overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={usuariosSeleccionados.length === usuarios.length && usuarios.length > 0}
                onCheckedChange={onToggleSeleccionTodos}
              />
            </TableHead>
            <TableHead className="w-[80px]"></TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onCambiarOrden('username')}
            >
              Usuario <IconoOrden campo="username" />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onCambiarOrden('role')}
            >
              Rol <IconoOrden campo="role" />
            </TableHead>
            <TableHead>Estado</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onCambiarOrden('fecha_ultimo_acceso')}
            >
              Último Acceso <IconoOrden campo="fecha_ultimo_acceso" />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onCambiarOrden('created_at')}
            >
              Registro <IconoOrden campo="created_at" />
            </TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                Cargando usuarios...
              </TableCell>
            </TableRow>
          ) : usuarios.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No se encontraron usuarios con los filtros actuales.
              </TableCell>
            </TableRow>
          ) : (
            usuarios.map(usuario => (
              <TableRow key={usuario.id} className="hover:bg-muted/50">
                <TableCell>
                  <Checkbox
                    checked={usuariosSeleccionados.includes(usuario.id)}
                    onCheckedChange={() => onToggleSeleccionUsuario(usuario.id)}
                  />
                </TableCell>
                <TableCell>
                  <img
                    src={usuario.perfil?.avatar_url || usuario.user_metadata?.avatar_url || '/images/default-avatar.png'}
                    alt={usuario.perfil?.username || 'Usuario'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {usuario.perfil?.username || 'Usuario'}
                  {usuario.perfil?.email_verificado && (
                    <CheckCircle2 className="w-4 h-4 inline ml-1 text-green-500" />
                  )}
                </TableCell>
                <TableCell>{getRoleBadge(usuario.perfil?.role ?? 'usuario')}</TableCell>
                <TableCell>{getStatusBadge(Boolean(usuario.perfil?.activo))}</TableCell>
                <TableCell className="text-muted-foreground">
                  {usuario.perfil?.fecha_ultimo_acceso ? formatDate(usuario.perfil.fecha_ultimo_acceso) : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(usuario.created_at)}
                </TableCell>
                <TableCell className="text-center">
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
                        <TooltipContent><p>Ver Perfil</p></TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => router.push(`/admin/usuarios/${usuario.id}/editar`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Editar</p></TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => onToggleStatus(usuario)}
                            className={usuario.perfil?.activo ? 'text-destructive' : 'text-green-500'}
                          >
                            {usuario.perfil?.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{usuario.perfil?.activo ? 'Desactivar' : 'Activar'}</p>
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
                        <TooltipContent><p>Advertir</p></TooltipContent>
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
                        <TooltipContent><p>Suspender</p></TooltipContent>
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
                        <TooltipContent><p>Eliminar</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
