'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { 
  Card, 
  CardBody, 
  CardHeader,
  Avatar, 
  Button, 
  Chip, 
  Link,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner
} from '@nextui-org/react'
import { 
  MapPin, 
  Globe, 
  Clock, 
  Calendar, 
  Edit, 
  LogOut, 
  Quote,
  Shield,
  User,
  Activity,
  FileText,
  Server
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface PerfilCompleto {
  id: string
  username: string
  role: 'user' | 'admin' | 'moderator'
  email?: string
  avatar_url: string
  color: string
  bio?: string
  ubicacion?: string
  sitio_web?: string
  activo?: boolean
  ultimo_acceso?: string
  created_at?: string
  updated_at?: string
}

export default function PerfilPage() {
  const router = useRouter()
  const { user, session, profile, loading: authLoading, refreshAuth } = useAuth()
  const { toast } = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [estadisticas, setEstadisticas] = useState({ noticias: 0, comentarios: 0 })

  // Estados para el modal de edición
  const [editData, setEditData] = useState({
    username: '',
    bio: '',
    ubicacion: '',
    sitio_web: '',
    color: '#3b82f6',
    avatar_url: ''
  })

  useEffect(() => {
    if (authLoading) return
    
    if (!session) {
      router.push('/login')
      return
    }

    if (!user) return

    // Construir perfil completo
    const userMetadata = user.user_metadata || {}
    const roleValue = (profile as any)?.role || 'user'
    const validRole = ['user', 'admin', 'moderator'].includes(roleValue) 
      ? roleValue as 'user' | 'admin' | 'moderator'
      : 'user'

    const perfilCompleto: PerfilCompleto = {
      id: user.id,
      username: (profile as any)?.username || userMetadata.full_name || userMetadata.name || 'Usuario',
      role: validRole,
      email: session.user.email || '',
      avatar_url: (profile as any)?.avatar_url || userMetadata.avatar_url || userMetadata.picture || '/images/default-avatar.png',
      color: (profile as any)?.color || '#3b82f6',
      bio: (profile as any)?.bio || '',
      ubicacion: (profile as any)?.ubicacion || '',
      sitio_web: (profile as any)?.sitio_web || '',
      activo: (profile as any)?.activo ?? true,
      ultimo_acceso: (profile as any)?.ultimo_acceso || new Date().toISOString(),
      created_at: session.user.created_at || new Date().toISOString(),
      updated_at: (profile as any)?.updated_at || new Date().toISOString()
    }

    setPerfil(perfilCompleto)
    
    // Configurar datos para edición
    setEditData({
      username: perfilCompleto.username,
      bio: perfilCompleto.bio || '',
      ubicacion: perfilCompleto.ubicacion || '',
      sitio_web: perfilCompleto.sitio_web || '',
      color: perfilCompleto.color,
      avatar_url: perfilCompleto.avatar_url
    })

    setLoading(false)
    
    // Cargar estadísticas
    cargarEstadisticas()
  }, [authLoading, session, user, profile, router])

  const cargarEstadisticas = async () => {
    if (!user) return

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const [noticiasResult, comentariosResult] = await Promise.all([
        supabase.from('noticias').select('id', { count: 'exact' }).eq('autor_id', user.id),
        supabase.from('comentarios').select('id', { count: 'exact' }).eq('usuario_id', user.id)
      ])

      setEstadisticas({
        noticias: noticiasResult.count || 0,
        comentarios: comentariosResult.count || 0
      })
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const handleSave = async () => {
    if (!perfil) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/perfil/actualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editData.username,
          bio: editData.bio,
          ubicacion: editData.ubicacion,
          sitio_web: editData.sitio_web,
          color: editData.color,
          avatar_url: editData.avatar_url
        })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar perfil')
      }

      // Actualizar perfil local
      setPerfil(prev => prev ? {
        ...prev,
        username: editData.username,
        bio: editData.bio,
        ubicacion: editData.ubicacion,
        sitio_web: editData.sitio_web,
        color: editData.color,
        avatar_url: editData.avatar_url
      } : null)

      // Refrescar contexto de auth
      await refreshAuth()
      
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente."
      })

      onClose()
    } catch (error) {
      console.error('Error:', error)
      setError('Error al actualizar el perfil')
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil."
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
        cargarEstadisticasUsuario(session.user.id);
      }
    }
  }, [authLoading, session, user, router])
  
  async function cargarEstadisticasUsuario(userId: string) {
    try {
      // Contar noticias del usuario
      const { count: noticiasCount, error: noticiasError } = await supabase
        .from('noticias')
        .select('*', { count: 'exact', head: true })
        .eq('autor', userId)
      
      if (noticiasError) throw noticiasError
      
      // Contar comentarios (asumiendo que existe una tabla de comentarios)
      // Si no existe, puedes eliminar esta parte
      const { count: comentariosCount, error: comentariosError } = await supabase
        .from('comentarios')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', userId)
      
      if (comentariosError && comentariosError.code !== 'PGRST116') {
        // PGRST116 es el error cuando la tabla no existe, lo ignoramos
        throw comentariosError
      }
      
      setEstadisticas({
        noticias: noticiasCount || 0,
        comentarios: comentariosCount || 0
      })
    } catch (error: any) {
      console.error('Error cargando estadísticas:', error)
      // No mostramos error al usuario para no interrumpir la experiencia
    }
  }
  
  async function handleGuardarCambios() {
    try {
      setIsSaving(true)
      setSaveError(null)
      setSaveSuccess(false)
      
      if (!perfil) return
      
      console.log('[Perfil] Guardando cambios para usuario:', perfil.id)
      console.log('[Perfil] Nuevos valores - Username:', username, 'Color:', userColor, 'Avatar URL:', avatarUrl)
      
      // Intentar actualizar usando API para evitar problemas de RLS
      const response = await fetch('/api/perfil/actualizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: perfil.id,
          username: username,
          color: userColor,
          avatar_url: avatarUrl
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error('[Perfil] Error al actualizar perfil via API:', result.error)
        throw new Error(result.error || 'Error al guardar los cambios')
      }
      
      console.log('[Perfil] Cambios guardados correctamente:', result)
      
      // Actualizar estado local
      setSaveSuccess(true)
      
      // Actualizar el contexto de autenticación para reflejar los cambios
      try {
        await refreshProfile()
        console.log('[Perfil] Contexto de autenticación actualizado')
      } catch (error) {
        console.error('[Perfil] Error al actualizar el contexto de autenticación:', error)
      }
      
      // Mostrar mensaje de éxito
      toast({
        title: 'Cambios guardados',
        description: 'Los cambios en tu perfil se han guardado correctamente.',
        variant: 'default',
      })
      
      // Guardar también en localStorage como respaldo
      try {
        localStorage.setItem('userColor', userColor)
      } catch (e) {
        console.warn('[Perfil] No se pudo guardar el color en localStorage:', e)
      }
      
      setSaveSuccess(true)
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (error: any) {
      console.error('[Perfil] Error guardando cambios:', error)
      setSaveError(error.message || 'Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }
  
  if (!perfil) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertDescription>No se pudo cargar la información del perfil</AlertDescription>
        </Alert>
      </div>
    )
  }
  
  const isAdmin = perfil.role === 'admin'
  
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta de información básica */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Información
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-4">
              {avatarUrl ? (
                <div className="size-24 overflow-hidden rounded-full">
                  <img 
                    src={avatarUrl}
                    alt={perfil.username || 'Avatar'}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : (
                <div className="size-24 flex items-center justify-center bg-primary text-white text-4xl font-bold rounded-full">
                  {perfil.username?.charAt(0).toUpperCase() || perfil.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Nombre de usuario</p>
              <p className="font-medium" style={{ color: perfil.color || '#3b82f6' }}>{perfil.username || 'No establecido'}</p>
            </div>
            
            <Separator />
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Correo electrónico</p>
              <p className="font-medium break-words">{perfil.email}</p>
            </div>
            
            <Separator />
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Rol</p>
              <p className="font-medium flex items-center justify-center gap-1">
                {isAdmin ? (
                  <>
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    Administrador
                  </>
                ) : 'Usuario'}
              </p>
            </div>
            
            <Separator />
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Miembro desde</p>
              <p className="font-medium">
                {perfil.created_at 
                  ? new Date(perfil.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : 'Desconocido'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Contenido principal */}
        <div className="md:col-span-2">
          <Tabs defaultValue="configuracion">
            <TabsList className="mb-4">
              <TabsTrigger value="configuracion" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Configuración
              </TabsTrigger>
              
              {isAdmin && (
                <TabsTrigger value="admin" className="flex items-center gap-1">
                  <ShieldAlert className="h-4 w-4" />
                  Panel Admin
                </TabsTrigger>
              )}
              
              {!isAdmin && (
                <TabsTrigger value="actividad" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Mi Actividad
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="configuracion">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de la cuenta</CardTitle>
                  <CardDescription>
                    Actualiza la información de tu perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sección de imagen de perfil */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Imagen de perfil</h3>
                    <ImageUploader
                      currentImageUrl={avatarUrl || undefined}
                      userId={perfil.id}
                      onImageUploaded={(url) => {
                        setAvatarUrl(url);
                        // Actualizar el objeto de perfil
                        if (perfil) {
                          setPerfil({
                            ...perfil,
                            avatar_url: url
                          });
                        }
                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 3000);
                      }}
                      className="mb-4"
                    />
                    <p className="text-xs text-muted-foreground text-center">Sube una imagen para personalizar tu perfil (máx. 2MB)</p>
                  </div>
                  
                  <Separator />
                  
                  {/* Sección de nombre de usuario y color */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium mb-4">Información de usuario</h3>
                    <div className="flex justify-between items-center">
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre de usuario
                      </label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="userColor" className="text-sm">Color</Label>
                        <div 
                          className="size-6 rounded-md border cursor-pointer overflow-hidden"
                          style={{ backgroundColor: userColor }}
                        >
                          <Input
                            id="userColor"
                            type="color"
                            value={userColor}
                            onChange={(e) => setUserColor(e.target.value)}
                            className="opacity-0 w-full h-full cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white sm:text-sm"
                        placeholder={perfil?.username || (user?.user_metadata?.full_name || user?.user_metadata?.name || '') || 'No establecido'}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">El color seleccionado se aplicará a tu nombre de usuario en todo el sitio</p>
                    <div className="mt-2 p-2 border rounded-md bg-muted/30 dark:bg-zinc-800/30 amoled:bg-zinc-900/50">
                      <p className="text-xs text-muted-foreground">Vista previa:</p>
                      <p className="font-medium" style={{ color: userColor }}>
                        {username || 'Tu nombre de usuario'}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start space-y-2">
                  {saveError && (
                    <Alert variant="destructive" className="w-full">
                      <AlertDescription>{saveError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {saveSuccess && (
                    <Alert className="w-full bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 amoled:bg-green-950/30 amoled:text-green-400">
                      <AlertDescription>Cambios guardados correctamente</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    onClick={handleGuardarCambios} 
                    disabled={isSaving || (username === perfil.username && userColor === (perfil.color || '#3b82f6'))}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {isAdmin && (
              <TabsContent value="admin">
                <Card>
                  <CardHeader>
                    <CardTitle>Acceso rápido al panel de administración</CardTitle>
                    <CardDescription>
                      Gestiona el contenido del sitio
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-center justify-center gap-2 amoled:bg-black amoled:border-zinc-900 amoled:hover:bg-zinc-900/50"
                        onClick={() => router.push('/admin/dashboard')}
                      >
                        <Server className="h-6 w-6" />
                        <span>Dashboard</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-center justify-center gap-2 amoled:bg-black amoled:border-zinc-900 amoled:hover:bg-zinc-900/50"
                        onClick={() => router.push('/admin/noticias')}
                      >
                        <FileText className="h-6 w-6" />
                        <span>Gestionar Noticias</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-center justify-center gap-2 amoled:bg-black amoled:border-zinc-900 amoled:hover:bg-zinc-900/50"
                        onClick={() => router.push('/admin/servidores')}
                      >
                        <Server className="h-6 w-6" />
                        <span>Gestionar Servidores</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-center justify-center gap-2 amoled:bg-black amoled:border-zinc-900 amoled:hover:bg-zinc-900/50"
                        onClick={() => router.push('/admin/recursos')}
                      >
                        <FileText className="h-6 w-6" />
                        <span>Gestionar Recursos</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            {!isAdmin && (
              <TabsContent value="actividad">
                <Card>
                  <CardHeader>
                    <CardTitle>Mi actividad en la comunidad</CardTitle>
                    <CardDescription>
                      Resumen de tu participación
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <span>Noticias publicadas</span>
                        </div>
                        <span className="font-bold">{estadisticas.noticias}</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <span>Comentarios realizados</span>
                        </div>
                        <span className="font-bold">{estadisticas.comentarios}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
