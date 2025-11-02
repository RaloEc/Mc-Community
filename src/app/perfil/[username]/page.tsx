'use client'

import { useParams } from 'next/navigation'
import { usePerfilUsuario } from '@/hooks/use-perfil-usuario'
import { PerfilHeader } from '@/components/perfil/PerfilHeader'
import { EstadisticasUsuario } from '@/components/perfil/EstadisticasUsuario'
import { EstadisticasExtendidas } from '@/components/perfil/EstadisticasExtendidas'
import { TabsActividad } from '@/components/perfil/TabsActividad'
import { ProximamenteBloques } from '@/components/perfil/ProximamenteBloques'
import { PerfilSkeleton } from '@/components/perfil/PerfilSkeleton'
import { PerfilError } from '@/components/perfil/PerfilError'

export default function UserProfilePage() {
  const params = useParams()
  const publicId = params.username as string

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

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto py-6 sm:py-8 px-3 sm:px-4 max-w-5xl">
        {/* Cabecera del Perfil */}
        <div className="mb-6 sm:mb-8">
          <PerfilHeader profile={profile} />
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Columna izquierda - Contenido principal */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Estadísticas */}
            <EstadisticasUsuario stats={profile.stats} userColor={profile.color} />

            {/* Actividad Reciente con Tabs */}
            <TabsActividad 
              ultimosHilos={profile.ultimosHilos} 
              ultimosPosts={profile.ultimosPosts}
              weaponStatsRecords={profile.weaponStatsRecords}
              userColor={profile.color}
            />
          </div>

          {/* Columna derecha - Información adicional */}
          <div className="lg:col-span-1 space-y-6">
            <EstadisticasExtendidas stats={profile.stats} userColor={profile.color} />
            <ProximamenteBloques userColor={profile.color} />
          </div>
        </div>
      </div>
    </div>
  )
}
