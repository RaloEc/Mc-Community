'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ProfileData } from '@/hooks/use-perfil-usuario'

interface PerfilHeaderProps {
  profile: ProfileData
}

export const PerfilHeader = ({ profile }: PerfilHeaderProps) => {
  const [bannerError, setBannerError] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': 
        return { variant: 'destructive' as const, label: 'Administrador' }
      case 'moderator': 
        return { variant: 'secondary' as const, label: 'Moderador' }
      default: 
        return { variant: 'default' as const, label: 'Usuario' }
    }
  }

  const roleBadge = getRoleBadge(profile.role)

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      {/* Banner */}
      <div className="relative h-48 w-full bg-gradient-to-r from-primary/10 to-secondary/10">
        {profile.banner_url && !bannerError ? (
          <Image
            src={profile.banner_url}
            alt={`Banner de ${profile.username}`}
            fill
            sizes="100vw"
            className="object-cover transition-opacity duration-300"
            priority
            onError={() => setBannerError(true)}
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 animate-gradient" />
        )}
      </div>

      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 -mt-16">
          {/* Avatar */}
          <Avatar className="w-24 h-24 border-4 border-background shadow-xl transition-transform hover:scale-105">
            {!avatarError ? (
              <AvatarImage 
                src={profile.avatar_url} 
                alt={profile.username}
                onError={() => setAvatarError(true)}
              />
            ) : null}
            <AvatarFallback className="text-2xl font-bold bg-primary/10">
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Info del usuario */}
          <div className="flex-grow w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {profile.username}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Miembro desde {new Date(profile.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <Badge variant={roleBadge.variant} className="w-fit">
                {roleBadge.label}
              </Badge>
            </div>
            
            {/* Biografía */}
            <div className="mt-4">
              <p className="text-sm leading-relaxed">
                {profile.bio || 'Este usuario todavía no ha escrito una biografía.'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
