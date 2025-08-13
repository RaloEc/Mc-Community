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
          activo: !usuario.activo
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setUsuario(prev => prev ? { ...prev, activo: !prev.activo } : null)
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



  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
                <AvatarImage src={usuario.avatar_url || undefined} alt={usuario.username} />
                <AvatarFallback>{usuario.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold tracking-tight">{usuario.username}</h1>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {getRoleBadge(usuario.role)}
                  {getStatusBadge(usuario.activo)}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
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
                      <UserX className="mr-2 h-4 w-4" />
                      <span>{usuario.activo ? 'Desactivar Cuenta' : 'Activar Cuenta'}</span>
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
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold">Biografía</h2>
              <p className="mt-2 text-muted-foreground">
                {usuario.bio || 'Este usuario aún no ha compartido su biografía.'}
              </p>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Se unió:</span>
                  <span className="font-medium">{formatDate(usuario.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Último acceso:</span>
                  <span className="font-medium">{usuario.fecha_ultimo_acceso ? formatDate(usuario.fecha_ultimo_acceso) : 'Nunca'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- Columna Secundaria (Derecha) --- */}
        <div className="space-y-6 lg:col-span-1">
          {/* Este div está intencionalmente vacío para mantener el layout. */}
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
                <AlertDialogTitle>¿{usuario.activo ? 'Desactivar' : 'Activar'} cuenta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vas a {usuario.activo ? 'desactivar' : 'activar'} la cuenta de {usuario.username}. ¿Estás seguro?
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
                  Se creará una contraseña temporal para {usuario.username}. Deberás compartirla de forma segura.
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
                  Esta acción es irreversible y eliminará permanentemente a {usuario.username}.
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
