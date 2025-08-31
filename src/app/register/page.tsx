'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { Separator } from '@/components/ui/separator'

// Esquema de validación con zod
const registerSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La confirmación debe tener al menos 6 caracteres')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [isLoading, setIsLoading] = useState(false)
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false)

  // Configurar react-hook-form con validación zod
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  })

  // Manejar envío del formulario
  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      // Registrar usuario con Supabase
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
          },
        }
      })

      if (error) {
        toast.error(error.message || 'Error al registrar usuario')
        return
      }

      // Verificar si se requiere confirmación de email
      if (authData?.user && !authData?.session) {
        setEmailConfirmationRequired(true)
        toast.info('Te hemos enviado un correo de confirmación. Por favor, verifica tu bandeja de entrada.')
        return
      }

      // Crear perfil en la tabla perfiles
      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('perfiles')
          .insert([
            { 
              id: authData.user.id,
              username: data.username,
              role: 'user',
              created_at: new Date().toISOString()
            }
          ])

        if (profileError) {
          console.error('Error al crear perfil:', profileError)
          // No mostramos este error al usuario para no confundirlo
          // El usuario ya está creado, solo falló la creación del perfil
        }
      }

      // Éxito - mostrar toast y redirigir
      toast.success('Registro exitoso')
      router.push(redirectTo)
      router.refresh()
    } catch (error) {
      console.error('Error de registro:', error)
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  // Si se requiere confirmación de email, mostrar mensaje
  if (emailConfirmationRequired) {
    return (
      <div className="container flex h-screen items-center justify-center">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Verifica tu correo</CardTitle>
            <CardDescription>
              Te hemos enviado un correo electrónico con un enlace de confirmación.
              Por favor, verifica tu bandeja de entrada y sigue las instrucciones.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/login')} variant="outline">
              Ir a Iniciar Sesión
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
          <CardDescription>
            Ingresa tus datos para registrarte en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                placeholder="usuario123"
                {...register('username')}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('confirmPassword')}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrarse'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="flex items-center gap-2 py-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">O continúa con</span>
            <Separator className="flex-1" />
          </div>
          
          <OAuthButtons redirectTo={redirectTo} />
          
          <div className="text-center text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Iniciar Sesión
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
