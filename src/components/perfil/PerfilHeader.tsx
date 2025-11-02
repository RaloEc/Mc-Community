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

  // Crear variable CSS para el color personalizado
  const colorStyle = {
    '--user-color': profile.color || '#3b82f6',
  } as React.CSSProperties

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg dark:border-gray-800">
      {/* Banner */}
      <div 
        className="relative h-32 sm:h-40 md:h-48 w-full bg-gradient-to-r dark:bg-gradient-to-r dark:from-gray-900 dark:to-gray-800"
        style={{
          backgroundImage: profile.banner_url && !bannerError 
            ? undefined 
            : `linear-gradient(135deg, color-mix(in srgb, var(--user-color) 20%, transparent), color-mix(in srgb, var(--user-color) 10%, transparent))`,
          ...colorStyle
        }}
      >
        {profile.banner_url && !bannerError ? (
          <Image
            src={profile.banner_url}
            alt={`Banner de ${profile.username}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px"
            className="object-cover transition-opacity duration-300"
            priority
            quality={75}
            onError={() => setBannerError(true)}
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />
        ) : null}
      </div>

      <CardContent className="px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 -mt-12 sm:-mt-14 md:-mt-16">
          {/* Avatar */}
          <Avatar 
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 border-4 border-background dark:border-gray-950 shadow-lg transition-transform hover:scale-105 flex-shrink-0"
            style={{
              borderColor: `color-mix(in srgb, var(--user-color) 30%, white)`,
              ...colorStyle
            }}
          >
            {!avatarError ? (
              <AvatarImage 
                src={profile.avatar_url} 
                alt={profile.username}
                onError={() => setAvatarError(true)}
              />
            ) : null}
            <AvatarFallback 
              className="text-lg sm:text-2xl font-bold"
              style={{
                backgroundColor: `color-mix(in srgb, var(--user-color) 15%, transparent)`,
                color: `var(--user-color)`,
                ...colorStyle
              }}
            >
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Info del usuario */}
          <div className="flex-grow w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">
                  {profile.username}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Miembro desde {new Date(profile.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <Badge 
                variant={roleBadge.variant} 
                className="w-fit text-xs sm:text-sm flex-shrink-0"
                style={{
                  backgroundColor: roleBadge.variant === 'default' ? `color-mix(in srgb, var(--user-color) 20%, transparent)` : undefined,
                  color: roleBadge.variant === 'default' ? `var(--user-color)` : undefined,
                  ...colorStyle
                }}
              >
                {roleBadge.label}
              </Badge>
            </div>
            
            {/* Biografía */}
            {profile.bio && (
              <div className="mt-3 sm:mt-4">
                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  "{profile.bio}"
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
