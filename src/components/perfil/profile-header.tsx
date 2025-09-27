'use client'

import { Button, Chip } from '@nextui-org/react'
import { Edit, Shield, User } from 'lucide-react'
import UserAvatar from '@/components/UserAvatar'
import Image from 'next/image'

interface ProfileHeaderProps {
  perfil: {
    username: string
    role: 'user' | 'admin' | 'moderator'
    avatar_url: string
    color: string
    banner_url?: string
  }
  onEditClick: () => void
}

export default function ProfileHeader({ perfil, onEditClick }: ProfileHeaderProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'danger'
      case 'moderator': return 'warning'
      default: return 'primary'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />
      case 'moderator': return <Shield className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'moderator': return 'Moderador'
      default: return 'Usuario'
    }
  }

  return (
    <div className="relative overflow-hidden bg-white dark:bg-black amoled:bg-black rounded-xl shadow-lg">
      {/* Banner personalizado */}
      <div className="w-full h-28 rounded-t-xl overflow-hidden relative">
        {perfil.banner_url ? (
          <Image
            key={perfil.banner_url} // Forzar recarga cuando cambie la URL
            src={`${perfil.banner_url}${perfil.banner_url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`}
            alt={`Banner de ${perfil.username}`}
            fill
            sizes="100vw"
            className="object-cover"
            priority
            unoptimized={perfil.banner_url?.includes('supabase')} // Desactivar optimización para imágenes de Supabase
            onError={(e) => {
              // Si falla la carga, intentar forzar recarga
              const target = e.target as HTMLImageElement;
              target.src = `${perfil.banner_url}${perfil.banner_url?.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
            }}
          />
        ) : (
          <div 
            className="w-full h-full"
            style={{
              backgroundColor: `${perfil.color}33` // Color pastel con 20% de opacidad
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      
      {/* Contenido del header */}
      <div className="relative -mt-[70px] px-6 pb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          {/* Avatar y info básica */}
          <div className="flex flex-col items-center text-center">
            <UserAvatar
              username={perfil.username}
              avatarUrl={perfil.avatar_url}
              size="lg"
              className="w-32 h-32 mb-4 ring-4 ring-white dark:ring-black amoled:ring-black shadow-xl border-4"
              borderColor={perfil.color || '#3b82f6'}
            />
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white amoled:text-white">
              {perfil.username}
            </h1>
            <Chip
              color={getRoleColor(perfil.role)}
              variant="flat"
              startContent={getRoleIcon(perfil.role)}
              className="mb-4"
            >
              {getRoleText(perfil.role)}
            </Chip>
          </div>
          
          {/* Botón de editar */}
          <div className="flex justify-center md:justify-end">
            <Button
              color="primary"
              variant="flat"
              startContent={<Edit className="w-4 h-4" />}
              onPress={onEditClick}
              className="bg-white/90 dark:bg-black/90 amoled:bg-black/90 backdrop-blur-sm hover:bg-white dark:hover:bg-black amoled:hover:bg-black transition-all duration-200"
            >
              Editar Perfil
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
