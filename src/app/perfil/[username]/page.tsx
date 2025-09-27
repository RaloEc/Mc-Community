'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, MessageSquare, Newspaper } from 'lucide-react'
 

// Tipos para los datos del perfil
interface ProfileData {
  id: string
  username: string
  created_at: string
  avatar_url: string
  banner_url: string | null
  bio: string
  role: string
  stats: {
    hilos: number
    posts: number
  }
  ultimosHilos: {
    id: string
    titulo: string
    created_at: string
    categoria_titulo: string
  }[]
  ultimosPosts: {
    id: string
    contenido: string
    created_at: string
    hilo_id: string
    hilo_titulo: string
  }[]
}

// Componente para el esqueleto de carga
const ProfileSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <Skeleton className="h-48 w-full" />
      <CardHeader className="flex flex-row items-center space-x-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </CardHeader>
    </Card>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Cargando hilos...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cargando respuestas...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    </div>
  </div>
)

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (username) {
      const fetchProfile = async () => {
        setLoading(true)
        try {
          const response = await fetch(`/api/perfil/${username}`)
          if (!response.ok) {
            throw new Error('Perfil no encontrado')
          }
          const data = await response.json()
          setProfile(data)
        } catch (err: any) {
          setError(err.message)
        } finally {
          setLoading(false)
        }
      }
      fetchProfile()
    }
  }, [username])

  if (loading) {
    return <ProfileSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Link href="/" className="mt-4 inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md">
          Volver al inicio
        </Link>
      </div>
    )
  }

  if (!profile) {
    return null // O un estado de no encontrado más explícito
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive'
      case 'moderator': return 'secondary'
      default: return 'default'
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Cabecera del Perfil */}
      <Card className="overflow-hidden">
        <div className="relative h-48 w-full">
          {profile.banner_url ? (
            <Image
              src={profile.banner_url}
              alt={`Banner de ${profile.username}`}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/10 to-secondary/10" />
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex items-start -mt-16">
            <Avatar className="w-24 h-24 border-4 border-background">
              <AvatarImage src={profile.avatar_url} alt={profile.username} />
              <AvatarFallback>{profile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="ml-6 flex-grow">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{profile.username}</h1>
                <Badge variant={getRoleBadge(profile.role)}>{profile.role}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Miembro desde {new Date(profile.created_at).toLocaleDateString()}
              </p>
              <p className="mt-4 text-sm">{profile.bio || 'Este usuario todavía no ha escrito una biografía.'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 text-center border-t pt-4">
            <div>
              <p className="text-xl font-bold">{profile.stats.hilos}</p>
              <p className="text-sm text-muted-foreground">Hilos creados</p>
            </div>
            <div>
              <p className="text-xl font-bold">{profile.stats.posts}</p>
              <p className="text-sm text-muted-foreground">Respuestas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Newspaper className="mr-2" /> Últimos Hilos Creados</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {profile.ultimosHilos?.length > 0 ? (
                profile.ultimosHilos.map(hilo => (
                  <li key={hilo.id} className="flex items-center justify-between">
                    <div>
                      <Link href={`/foro/hilo/${hilo.id}`} className="font-semibold hover:underline">
                        {hilo.titulo}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        en {hilo.categoria_titulo} - {new Date(hilo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link href={`/foro/hilo/${hilo.id}`}><ExternalLink className="h-4 w-4" /></Link>
                  </li>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Este usuario no ha creado ningún hilo.</p>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><MessageSquare className="mr-2" /> Últimas Respuestas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {profile.ultimosPosts?.length > 0 ? (
                profile.ultimosPosts.map(post => (
                  <li key={post.id} className="border-l-2 pl-4">
                    <p className="text-sm italic">\"{post.contenido}\"</p>
                    <Link href={`/foro/hilo/${post.hilo_id}#post-${post.id}`} className="text-xs font-semibold text-muted-foreground hover:underline">
                      en {post.hilo_titulo} - {new Date(post.created_at).toLocaleDateString()}
                    </Link>
                  </li>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Este usuario no ha publicado ninguna respuesta.</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
