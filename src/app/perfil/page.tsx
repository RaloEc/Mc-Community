'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Loader2, UserCircle, ShieldAlert, Settings, FileText, Server } from 'lucide-react'
import Image from 'next/image'
import ImageUploader from '@/components/ImageUploader'

interface Perfil {
  id: string
  username: string
  role: string
  email?: string
  created_at?: string
  avatar_url?: string
  color?: string
}

export default function PerfilPage() {
  const router = useRouter()
  const { session, loading: authLoading, user } = useAuth()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(false) // Ya no necesitamos iniciar con loading=true
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [userColor, setUserColor] = useState('#3b82f6') // Color por defecto (azul)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [estadisticas, setEstadisticas] = useState({
    noticias: 0,
    comentarios: 0
  })

  useEffect(() => {
    // Si estamos cargando la autenticación, no hacemos nada aún
    if (authLoading) return;
    
    // Si no hay sesión después de cargar, redirigimos al login
    if (!session && !authLoading) {
      router.push('/login');
      return;
    }
    
    // Si tenemos usuario del contexto, lo utilizamos
    if (user && session) {
      const perfilCompleto = {
        ...user,
        email: session.user.email,
        created_at: session.user.created_at
      };
      
      setPerfil(perfilCompleto);
      setUsername(perfilCompleto.username || '');
      
      // Cargar el avatar si existe
      if (perfilCompleto.avatar_url) {
        setAvatarUrl(perfilCompleto.avatar_url);
      }
      
      // Cargar el color del usuario
      if (perfilCompleto.color) {
        setUserColor(perfilCompleto.color);
      } else {
        try {
          // Intentar cargar desde localStorage como respaldo
          const savedColor = localStorage.getItem('userColor');
          if (savedColor) {
            setUserColor(savedColor);
          }
        } catch (e) {
          console.error('Error al cargar el color del usuario:', e);
        }
      }
      
      // Cargar estadísticas si es usuario normal
      if (perfilCompleto.role !== 'admin' && session.user.id) {
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
      console.log('[Perfil] Nuevos valores - Username:', username, 'Color:', userColor)
      
      // Intentar actualizar usando API para evitar problemas de RLS
      const response = await fetch('/api/perfil/actualizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: perfil.id,
          username: username,
          color: userColor
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error('[Perfil] Error al actualizar perfil via API:', result.error)
        throw new Error(result.error || 'Error al guardar los cambios')
      }
      
      console.log('[Perfil] Perfil actualizado correctamente via API:', result)
      
      // Actualizar estado local
      setPerfil({
        ...perfil,
        username,
        color: userColor
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
                      <Label htmlFor="username">Nombre de usuario</Label>
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
                    <p className="text-xs text-muted-foreground">El color seleccionado se aplicará a tu nombre de usuario en todo el sitio</p>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Tu nombre de usuario"
                    />
                    <div className="mt-2 p-2 border rounded-md bg-muted/30">
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
                    <Alert className="w-full bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400">
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
                        className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                        onClick={() => router.push('/admin/dashboard')}
                      >
                        <Server className="h-6 w-6" />
                        <span>Dashboard</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                        onClick={() => router.push('/admin/noticias')}
                      >
                        <FileText className="h-6 w-6" />
                        <span>Gestionar Noticias</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                        onClick={() => router.push('/admin/servidores')}
                      >
                        <Server className="h-6 w-6" />
                        <span>Gestionar Servidores</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-center justify-center gap-2"
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
