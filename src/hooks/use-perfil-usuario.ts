import { useQuery } from '@tanstack/react-query'

export interface ProfileData {
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

const fetchPerfilUsuario = async (username: string): Promise<ProfileData> => {
  const response = await fetch(`/api/perfil/${username}`)
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Perfil no encontrado')
    }
    throw new Error('Error al cargar el perfil')
  }
  
  return response.json()
}

export const usePerfilUsuario = (username: string) => {
  return useQuery<ProfileData, Error>({
    queryKey: ['perfil', username],
    queryFn: () => fetchPerfilUsuario(username),
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
