'use client'

import { useParams } from 'next/navigation'
import { usePerfilUsuario } from '@/hooks/use-perfil-usuario'
import { PerfilHeader } from '@/components/perfil/PerfilHeader'
import { EstadisticasUsuario } from '@/components/perfil/EstadisticasUsuario'
import { TabsActividad } from '@/components/perfil/TabsActividad'
import { PerfilSkeleton } from '@/components/perfil/PerfilSkeleton'
import { PerfilError } from '@/components/perfil/PerfilError'

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string

  const { data: profile, isLoading, error, refetch } = usePerfilUsuario(username)

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
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Cabecera del Perfil */}
      <PerfilHeader profile={profile} />

      {/* Estadísticas */}
      <EstadisticasUsuario stats={profile.stats} />

      {/* Actividad Reciente con Tabs */}
      <TabsActividad 
        ultimosHilos={profile.ultimosHilos} 
        ultimosPosts={profile.ultimosPosts} 
      />
    </div>
  )
}
