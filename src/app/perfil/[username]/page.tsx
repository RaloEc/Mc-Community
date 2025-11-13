'use client'

import { useParams } from 'next/navigation'
import { useIsMobile } from '@/hooks/use-mobile'
import { usePerfilUsuario } from '@/hooks/use-perfil-usuario'
import { PerfilHeader } from '@/components/perfil/PerfilHeader'
import { EstadisticasUnificadas } from '@/components/perfil/EstadisticasUnificadas'
import { FeedActividad } from '@/components/perfil/FeedActividad'
import MobileUserProfileLayout from '@/components/perfil/MobileUserProfileLayout'
import { PerfilSkeleton } from '@/components/perfil/PerfilSkeleton'
import { PerfilError } from '@/components/perfil/PerfilError'

export default function UserProfilePage() {
  const params = useParams()
  const publicId = params.username as string
  const isMobile = useIsMobile(1024)

  const { data: profile, isLoading, error, refetch } = usePerfilUsuario(publicId)

  if (isLoading) {
    return <PerfilSkeleton />
  }

  if (error) {
    return <PerfilError error={error} onRetry={() => refetch()} />
  }

  if (!profile) {
    return <PerfilError error={new Error('Perfil no encontrado')} />
  }

  // Layout móvil
  if (isMobile) {
    return <MobileUserProfileLayout profile={profile} />
  }

  // Layout desktop
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto py-6 sm:py-8 px-3 sm:px-4 max-w-5xl">
        {/* Cabecera del Perfil */}
        <div className="mb-6 sm:mb-8">
          <PerfilHeader profile={profile} />
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Columna izquierda - Feed de actividad (estilo red social) */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Feed unificado de hilos y respuestas */}
            <FeedActividad 
              ultimosHilos={profile.ultimosHilos} 
              ultimosPosts={profile.ultimosPosts}
              weaponStatsRecords={profile.weaponStatsRecords}
              userColor={profile.color}
            />
          </div>

          {/* Columna derecha - Estadísticas unificadas */}
          <div className="lg:col-span-1 space-y-6">
            <EstadisticasUnificadas stats={profile.stats} userColor={profile.color} />
          </div>
        </div>
      </div>
    </div>
  )
}
