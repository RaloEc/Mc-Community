'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminProtection from '@/components/AdminProtection'
import { UsuarioCompleto } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { AlertTriangle, ArrowLeft, Calendar, Clock, KeyRound, MoreVertical, Send, SquarePen, Trash2, UserCheck, UserX } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const getRoleVariant = (role: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (role) {
    case 'admin': return 'default'
    case 'moderator': return 'secondary'
    case 'editor': return 'outline'
    default: return 'destructive'
  }
}

const getRoleBadge = (role: string) => (
  <Badge variant={getRoleVariant(role)}>
    {role.charAt(0).toUpperCase() + role.slice(1)}
  </Badge>
)

const getStatusBadge = (activo: boolean) => (
  <Badge variant={activo ? 'success' : 'destructive'} className="flex items-center">
    {activo ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
    {activo ? 'Activo' : 'Inactivo'}
  </Badge>
)

function UsuarioDetallesContent() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [usuario, setUsuario] = useState<UsuarioCompleto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDesactivarConfirm, setShowDesactivarConfirm] = useState(false)
  const [showGenerarPassConfirm, setShowGenerarPassConfirm] = useState(false)
  const [showEnviarEmailConfirm, setShowEnviarEmailConfirm] = useState(false)
  const [showEliminarConfirm, setShowEliminarConfirm] = useState(false)
  const [tempPassword, setTempPassword] = useState('')

  const generateTempPassword = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/usuarios/${userId}/generar-password`, {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok) {
        setTempPassword(data.tempPassword)
        toast.success(data.message)
        setShowGenerarPassConfirm(false)
      } else {
        toast.error(data.error || 'Error al generar contraseña')
      }
    } catch (error) {
      toast.error('No se pudo conectar con el servidor.')
    } finally {
      setActionLoading(false)
    }
  }

  const fetchUsuario = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/usuarios/${id}`)
      const data = await response.json()

      if (response.ok) {
        setUsuario(data)
      } else {
        setError(data.error || 'Usuario no encontrado')
        toast.error(data.error || 'Error al cargar datos del usuario')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('No se pudieron cargar los datos del usuario.')
      toast.error('Error al cargar datos del usuario')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (userId) {
      fetchUsuario(userId as string)
    }
  }, [userId, fetchUsuario])

  const toggleUserStatus = async () => {
    if (!usuario) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/usuarios/${userId}`, {
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
        setUsuario(prev => {
          if (!prev) return null
          if (!prev.perfil) return prev
          const prevActivo = prev.perfil.activo
          return { ...prev, perfil: { ...prev.perfil, activo: !prevActivo } }
        })
      } else {
        toast.error(data.error || 'Error al cambiar estado del usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('No se pudieron cargar los datos del usuario.')
      toast.error('Error al cargar datos del usuario')
    } finally {
      setActionLoading(false)
    }
  }

  const resetPassword = async () => {
    if (!usuario) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password' })
      })

      const data = await response.json()

      if (response.ok) {
        setTempPassword(data.tempPassword)
        toast.success(data.message)
        setShowGenerarPassConfirm(false)
      } else {
        toast.error(data.error || 'Error al restablecer contraseña')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al restablecer contraseña')
    } finally {
      setActionLoading(false)
    }
  }

  const sendResetEmail = async () => {
    if (!usuario) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_reset_email' })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
      } else {
        toast.error(data.error || 'Error al enviar email')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al enviar email')
    } finally {
      setActionLoading(false)
    }
  }

  const deleteUser = async () => {
    if (!usuario) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        router.push('/admin/usuarios')
      } else {
        toast.error(data.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar usuario')
    } finally {
      setActionLoading(false)
    }
  }



  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nunca'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Fecha inválida'
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Fecha inválida'
    }
  }

  const formatDateRelative = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nunca'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Fecha inválida'
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      if (diffMins < 1) return 'Hace un momento'
      if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`
      if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
      if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
      
      return formatDate(dateString)
    } catch {
      return 'Fecha inválida'
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-background text-destructive">
        <AlertTriangle className="h-12 w-12" />
        <h2 className="mt-4 text-2xl font-bold">Error al Cargar</h2>
        <p className="mt-2 text-center text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    )
  }


  return (
    <div className="container mx-auto max-w-7xl p-2 sm:p-3 lg:p-4">
      <Button onClick={() => router.back()} variant="ghost" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a la lista
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* --- Columna Principal (Izquierda) --- */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-col items-center gap-4 bg-muted/30 p-6 sm:flex-row">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage 
                  src={usuario.perfil?.avatar_url || '/images/default-avatar.svg'} 
                  alt={usuario.perfil?.username || 'Usuario'}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/default-avatar.svg';
                  }}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {usuario.perfil?.username?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold tracking-tight">{usuario.perfil?.username || 'Usuario'}</h1>
                <p className="text-sm text-muted-foreground mt-1">{usuario.email || 'Sin email'}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {getRoleBadge(usuario.perfil?.role ?? 'usuario')}
                  {getStatusBadge(Boolean(usuario.perfil?.activo))}
                  {usuario.perfil?.email_verificado && (
                    <Badge variant="outline" className="border-green-500 text-green-500">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild>
                  <Link href={`/admin/usuarios/${userId}/editar`}>
                    <SquarePen className="h-4 w-4 mr-2" />
                    Editar
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowDesactivarConfirm(true)}>
                      {usuario.perfil?.activo ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                      <span>{usuario.perfil?.activo ? 'Desactivar Cuenta' : 'Activar Cuenta'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowGenerarPassConfirm(true)}>
                      <KeyRound className="mr-2 h-4 w-4" />
                      <span>Generar Contraseña</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowEnviarEmailConfirm(true)}>
                      <Send className="mr-2 h-4 w-4" />
                      <span>Enviar Email de Reset</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-500 focus:bg-red-500/10 focus:text-red-600" onClick={() => setShowEliminarConfirm(true)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Eliminar Usuario</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Información Personal */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Información Personal</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Usuario</p>
                    <p className="font-medium">{usuario.perfil?.username || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{usuario.email || 'N/A'}</p>
                  </div>
                  {usuario.perfil?.ubicacion && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Ubicación</p>
                      <p className="font-medium">{usuario.perfil.ubicacion}</p>
                    </div>
                  )}
                  {usuario.perfil?.sitio_web && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Sitio Web</p>
                      <a href={usuario.perfil.sitio_web} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                        {usuario.perfil.sitio_web}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Biografía */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Biografía</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {usuario.perfil?.bio || 'Este usuario aún no ha compartido su biografía.'}
                </p>
              </div>

              <Separator />

              {/* Fechas y Actividad */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Actividad</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Fecha de registro</p>
                      <p className="font-medium">{formatDate(usuario.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Último acceso</p>
                      <p className="font-medium">{formatDateRelative(usuario.perfil?.fecha_ultimo_acceso)}</p>
                      {usuario.perfil?.fecha_ultimo_acceso && (
                        <p className="text-xs text-muted-foreground">{formatDate(usuario.perfil.fecha_ultimo_acceso)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              {usuario.perfil?.racha_dias !== undefined && usuario.perfil.racha_dias > 0 && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Estadísticas</h2>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <span className="text-2xl">🔥</span>
                      <div>
                        <p className="font-medium">{usuario.perfil.racha_dias} días de racha</p>
                        <p className="text-sm text-muted-foreground">Días consecutivos activo</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- Columna Secundaria (Derecha) --- */}
        <div className="space-y-6 lg:col-span-1">
          {/* Información Administrativa */}
          <Card>
            <CardHeader>
              <CardTitle>Información Administrativa</CardTitle>
              <CardDescription>Datos internos del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ID de Usuario</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block break-all">{usuario.id}</code>
              </div>
              {usuario.auth_id && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ID de Autenticación</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block break-all">{usuario.auth_id}</code>
                </div>
              )}
              <Separator />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Rol</p>
                <p className="font-medium capitalize">{usuario.perfil?.role || 'usuario'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="font-medium">{usuario.perfil?.activo ? 'Activo' : 'Inactivo'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email Verificado</p>
                <p className="font-medium">{usuario.perfil?.email_verificado ? 'Sí' : 'No'}</p>
              </div>
              {usuario.perfil?.notas_moderador && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Notas del Moderador</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">{usuario.perfil.notas_moderador}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Badges */}
          {usuario.perfil?.badges && Array.isArray(usuario.perfil.badges) && usuario.perfil.badges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Insignias</CardTitle>
                <CardDescription>Logros del usuario</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {usuario.perfil.badges.map((badge: any, index: number) => (
                    <Badge key={index} variant="outline">
                      {badge.icon && <span className="mr-1">{badge.icon}</span>}
                      {badge.name || badge}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Contraseña Temporal (si existe) */}
      {tempPassword && (
        <Card className="mt-6 border-yellow-500/50 bg-yellow-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400">
              <KeyRound className="h-5 w-5" />
              Contraseña Temporal Generada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-200">
              Comparte esta contraseña de forma segura con el usuario:
            </p>
            <div className="mt-2 flex items-center gap-2 rounded-md bg-black/30 p-3">
              <code className="flex-grow font-mono text-lg text-white">{tempPassword}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword);
                  toast.success('Contraseña copiada al portapapeles');
                }}
              >
                Copiar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs de confirmación */}
      {usuario && (
        <>
          {/* Desactivar/Activar Cuenta */}
          <AlertDialog open={showDesactivarConfirm} onOpenChange={setShowDesactivarConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿{usuario.perfil?.activo ? 'Desactivar' : 'Activar'} cuenta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vas a {usuario.perfil?.activo ? 'desactivar' : 'activar'} la cuenta de {usuario.perfil?.username || 'Usuario'}. ¿Estás seguro?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={toggleUserStatus}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Generar Contraseña */}
          <AlertDialog open={showGenerarPassConfirm} onOpenChange={setShowGenerarPassConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Generar nueva contraseña?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se creará una contraseña temporal para {usuario.perfil?.username || 'Usuario'}. Deberás compartirla de forma segura.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={generateTempPassword}>Generar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Enviar Email de Reset */}
          <AlertDialog open={showEnviarEmailConfirm} onOpenChange={setShowEnviarEmailConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Enviar email de reseteo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se enviará un email a {usuario.email} con un enlace para restablecer su contraseña.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={sendResetEmail}>Enviar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Eliminar Usuario */}
          <AlertDialog open={showEliminarConfirm} onOpenChange={setShowEliminarConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción es irreversible y eliminará permanentemente a {usuario.perfil?.username || 'Usuario'}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={deleteUser} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}

export default function UsuarioDetalles() {
  return (
    <AdminProtection>
      <UsuarioDetallesContent />
    </AdminProtection>
  )
}
