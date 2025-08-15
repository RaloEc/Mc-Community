'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminProtection from '@/components/AdminProtection'
import { UsuarioCompleto } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  ShieldX,
  Eye,
  UserX,
  UserCheck,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

function AdminUsuariosContent() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<UsuarioCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; usuario: UsuarioCompleto | null }>({
    open: false,
    usuario: null
  })

  const fetchUsuarios = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter && statusFilter !== 'all' && { activo: statusFilter })
      })

      const response = await fetch(`/api/admin/usuarios?${params}`)
      const data = await response.json()

      if (response.ok) {
        setUsuarios(data.usuarios)
        setTotalPages(data.totalPages)
      } else {
        toast.error(data.error || 'Error al cargar usuarios')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [currentPage, searchTerm, roleFilter, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsuarios()
  }

  const toggleUserStatus = async (usuario: UsuarioCompleto) => {
    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_active',
          activo: !(usuario.perfil?.activo ?? false)
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        fetchUsuarios()
      } else {
        toast.error(data.error || 'Error al cambiar estado del usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cambiar estado del usuario')
    }
  }

  const deleteUser = async () => {
    if (!deleteDialog.usuario) return

    try {
      const response = await fetch(`/api/admin/usuarios?userId=${deleteDialog.usuario.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setDeleteDialog({ open: false, usuario: null })
        fetchUsuarios()
      } else {
        toast.error(data.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar usuario')
    }
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'destructive',
      moderator: 'default',
      usuario: 'secondary'
    } as const

    const colors = {
      admin: 'text-white',
      moderator: 'text-white',
      usuario: 'text-black dark:text-white'
    } as const

    return (
      <Badge variant={variants[role as keyof typeof variants] || 'secondary'}>
        <span className={colors[role as keyof typeof colors] || 'text-gray-600'}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
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

  return (
    <div className="p-4 md:p-6 bg-background/80 rounded-lg min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">Administra, edita y visualiza los usuarios de la comunidad.</p>
        </div>
        <Button onClick={() => router.push('/admin/usuarios/crear')} className="mt-4 md:mt-0">
          <UserPlus className="mr-2 h-4 w-4" />
          Añadir Usuario
        </Button>
      </header>

      {/* Filtros y búsqueda */}
      <form onSubmit={handleSearch} className="mb-6 p-4 bg-card rounded-lg border flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="usuario">Usuario</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="true">Activo</SelectItem>
              <SelectItem value="false">Inactivo</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">
            <RefreshCw className="mr-2 h-4 w-4" />
            Aplicar
          </Button>
        </div>
      </form>

      {/* Contenido principal */}
      <div className="bg-card rounded-lg border overflow-hidden">
        {/* Vista de escritorio */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]"></TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No se encontraron usuarios con los filtros actuales.
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map(usuario => (
                  <TableRow key={usuario.id} className="hover:bg-muted/50">
                    <TableCell>
                      <img
                        src={usuario.perfil?.avatar_url || '/images/default-avatar.png'}
                        alt={usuario.perfil?.username || 'Usuario'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{usuario.perfil?.username || 'Usuario'}</TableCell>
                    <TableCell>{getRoleBadge(usuario.perfil?.role ?? 'usuario')}</TableCell>
                    <TableCell>{getStatusBadge(Boolean(usuario.perfil?.activo))}</TableCell>
                    <TableCell className="text-muted-foreground">{usuario.perfil?.fecha_ultimo_acceso ? formatDate(usuario.perfil.fecha_ultimo_acceso) : '—'}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" onClick={() => router.push(`/admin/usuarios/${usuario.id}`)} className="text-muted-foreground hover:text-foreground"><Eye className="w-4 h-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver Perfil</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" onClick={() => router.push(`/admin/usuarios/${usuario.id}/editar`)} className="text-muted-foreground hover:text-foreground"><Edit className="w-4 h-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Usuario</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" onClick={() => toggleUserStatus(usuario)} className={`${usuario.perfil?.activo ? 'text-destructive hover:text-destructive/80' : 'text-green-500 hover:text-green-400'}`}>{usuario.perfil?.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}</Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{usuario.perfil?.activo ? 'Desactivar Usuario' : 'Activar Usuario'}</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" onClick={() => setDeleteDialog({ open: true, usuario })} className="text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Eliminar Usuario</p></TooltipContent>
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

        {/* Vista móvil */}
        <div className="md:hidden p-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Cargando usuarios...</p>
          ) : usuarios.length === 0 ? (
            <p className="text-center text-muted-foreground">No se encontraron usuarios.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {usuarios.map(usuario => (
                <div 
                  key={usuario.id} 
                  className="bg-card p-4 rounded-xl flex flex-col sm:border-2 sm:dark:border-zinc-800 sm:border-zinc-200"
                  style={{
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={usuario.perfil?.avatar_url || '/images/default-avatar.png'}
                      alt={usuario.perfil?.username || 'Usuario'}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div className="flex-grow">
                      <p className="font-bold text-foreground text-base">{usuario.perfil?.username || 'Usuario'}</p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        {getRoleBadge(usuario.perfil?.role ?? 'usuario')}
                        {getStatusBadge(Boolean(usuario.perfil?.activo))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Último acceso: {usuario.perfil?.fecha_ultimo_acceso ? formatDate(usuario.perfil.fecha_ultimo_acceso) : '—'}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-1 mt-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/usuarios/${usuario.id}`)}><Eye className="w-4 h-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Ver Perfil</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/usuarios/${usuario.id}/editar`)}><Edit className="w-4 h-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Editar Usuario</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => toggleUserStatus(usuario)} className={`${usuario.perfil?.activo ? 'text-destructive hover:bg-destructive/10' : 'text-green-500 hover:bg-green-500/10'}`}>{usuario.perfil?.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}</Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{usuario.perfil?.activo ? 'Desactivar Usuario' : 'Activar Usuario'}</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteDialog({ open: true, usuario })}><Trash2 className="w-4 h-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Eliminar Usuario</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, usuario: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar al usuario <strong>{deleteDialog.usuario?.perfil?.username}</strong>?
              Esta acción no se puede deshacer y eliminará permanentemente la cuenta y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function AdminUsuarios() {
  return (
    <AdminProtection>
      <AdminUsuariosContent />
    </AdminProtection>
  )
}
