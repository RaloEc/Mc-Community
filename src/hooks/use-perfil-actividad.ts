import { useInfiniteQuery } from '@tanstack/react-query'

export interface ActivityData {
  hilos: Array<{
    id: string
    titulo: string
    created_at: string
    categoria_titulo: string
  }>
  posts: Array<{
    id: string
    contenido: string
    created_at: string
    hilo_id: string
    hilo_titulo: string
  }>
  stats: {
    hilos: number
    posts: number
  }
}

const fetchActividad = async (publicId: string, page: number, limit: number): Promise<ActivityData> => {
  const response = await fetch(`/api/perfil/${publicId}/actividad?page=${page}&limit=${limit}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Perfil no encontrado')
    }
    throw new Error('Error al cargar la actividad')
  }

  return response.json()
}

export const usePerfilActividad = (publicId: string, limit: number = 5) => {
  return useInfiniteQuery<ActivityData, Error>({
    queryKey: ['perfil-actividad', publicId],
    queryFn: ({ pageParam }) => fetchActividad(publicId, pageParam as number, limit),
    getNextPageParam: (lastPage, pages) => {
      // Si la última página tiene menos items que el límite, no hay más páginas
      const totalItems = lastPage.hilos.length + lastPage.posts.length
      if (totalItems < limit) {
        return undefined
      }
      return pages.length + 1
    },
    initialPageParam: 1,
    enabled: !!publicId,
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 60 minutos
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
