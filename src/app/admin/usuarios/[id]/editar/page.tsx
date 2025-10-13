'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminProtection from '@/components/AdminProtection'
import { UsuarioCompleto } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { 
  ArrowLeft,
  Save,
  RefreshCw,
  User,
  Mail,
  Shield,
  Key
} from 'lucide-react'
import { toast } from 'sonner'

interface FormData {
  username: string
  email: string
  role: 'admin' | 'moderator' | 'usuario'
  activo: boolean
  bio: string
  ubicacion: string
  sitio_web: string
  avatar_url: string
  password: string
}

function EditarUsuarioContent() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [usuario, setUsuario] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    role: 'usuario',
    activo: true,
    bio: '',
    ubicacion: '',
    sitio_web: '',
    avatar_url: '',
    password: ''
  })

  const fetchUsuario = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/usuarios/${userId}`)
      const data = await response.json()

      if (response.ok) {
        console.log('Datos recibidos del usuario:', data)
        setUsuario(data)
        setFormData({
          username: data.username || '',
          email: data.email || '',
          role: data.role || 'usuario',
          activo: data.activo ?? true,
          bio: data.bio || '',
          ubicacion: data.ubicacion || '',
          sitio_web: data.sitio_web || '',
          avatar_url: data.avatar_url || '',
          password: ''
        })
      } else {
        toast.error(data.error || 'Error al cargar usuario')
        router.push('/admin/usuarios')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar usuario')
      router.push('/admin/usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUsuario()
    }
  }, [userId])

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username.trim()) {
      toast.error('El nombre de usuario es requerido')
      return
    }

    if (!formData.email.trim()) {
      toast.error('El email es requerido')
      return
    }

    try {
      setSaving(true)

      // Preparar los datos para enviar
      const updates: any = {
        username: formData.username.trim(),
        role: formData.role,
        activo: formData.activo,
        bio: formData.bio.trim(),
        ubicacion: formData.ubicacion.trim(),
        sitio_web: formData.sitio_web.trim(),
        avatar_url: formData.avatar_url.trim()
      }

      // Solo incluir email si cambió
      if (formData.email && formData.email !== usuario?.email) {
        updates.email = formData.email.trim()
      }

      // Solo incluir password si se proporcionó
      if (formData.password.trim()) {
        if (formData.password.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres')
          return
        }
        updates.password = formData.password
      }

      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        router.push(`/admin/usuarios/${userId}`)
      } else {
        toast.error(data.error || 'Error al actualizar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar usuario')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-400">Cargando usuario...</span>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Usuario no encontrado</h1>
          <Button onClick={() => router.push('/admin/usuarios')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a usuarios
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/usuarios')}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Editar Usuario</h1>
            <p className="text-gray-400">Modificar información de {usuario.username || formData.username || 'Usuario'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        {/* Información básica */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <User className="w-5 h-5 mr-2" />
              Información Básica
            </CardTitle>
            <CardDescription className="text-gray-400">
              Datos principales del usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username" className="text-gray-300">
                  Nombre de usuario *
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-300">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role" className="text-gray-300">
                  Rol
                </Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usuario">Usuario</SelectItem>
                    <SelectItem value="moderator">Moderador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="avatar_url" className="text-gray-300">
                  URL del Avatar
                </Label>
                {formData.avatar_url && (
                  <img
                    src={formData.avatar_url}
                    alt="Avatar actual"
                    className="w-16 h-16 rounded-full mt-2 mb-2 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <Input
                  id="avatar_url"
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="https://ejemplo.com/avatar.jpg"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => handleInputChange('activo', checked)}
              />
              <Label htmlFor="activo" className="text-gray-300">
                Cuenta activa
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Información Adicional</CardTitle>
            <CardDescription className="text-gray-400">
              Datos opcionales del perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bio" className="text-gray-300">
                Biografía
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
                placeholder="Cuéntanos algo sobre ti..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ubicacion" className="text-gray-300">
                  Ubicación
                </Label>
                <Input
                  id="ubicacion"
                  value={formData.ubicacion}
                  onChange={(e) => handleInputChange('ubicacion', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Ciudad, País"
                />
              </div>
              <div>
                <Label htmlFor="sitio_web" className="text-gray-300">
                  Sitio Web
                </Label>
                <Input
                  id="sitio_web"
                  type="url"
                  value={formData.sitio_web}
                  onChange={(e) => handleInputChange('sitio_web', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="https://ejemplo.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Seguridad
            </CardTitle>
            <CardDescription className="text-gray-400">
              Cambiar contraseña (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="password" className="text-gray-300">
                Nueva Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Dejar vacío para mantener la actual"
                autoComplete="new-password"
                minLength={6}
              />
              <p className="text-gray-500 text-sm mt-1">
                Mínimo 6 caracteres. Dejar vacío para no cambiar la contraseña.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/usuarios/${userId}`)}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function EditarUsuario() {
  return (
    <AdminProtection>
      <EditarUsuarioContent />
    </AdminProtection>
  )
}
