import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UsuarioCompleto } from '@/types'

// Tipos
export interface FiltrosUsuarios {
  search?: string
  role?: string
  activo?: string
  fechaDesde?: string
  fechaHasta?: string
  inactivoDias?: number
  emailVerificado?: boolean
  ordenCampo?: string
  ordenDireccion?: 'ASC' | 'DESC'
}

export interface UsuariosResponse {
  usuarios: UsuarioCompleto[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface EstadisticasUsuario {
  total_hilos: number
  total_posts: number
  total_noticias: number
  total_comentarios: number
  total_votos_dados: number
  total_votos_recibidos: number
  total_advertencias: number
  total_suspensiones: number
  ultima_actividad: string | null
}

export interface SuspensionUsuario {
  id: string
  usuario_id: string
  tipo: 'suspension_temporal' | 'suspension_permanente' | 'baneo'
  razon: string
  inicio: string
  fin: string | null
  activa: boolean
  moderador_id: string
  notas_internas?: string
}

// Hook principal para obtener usuarios con filtros
export function useAdminUsuarios(filtros: FiltrosUsuarios, page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['admin-usuarios', filtros, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filtros.search && { search: filtros.search }),
        ...(filtros.role && filtros.role !== 'all' && { role: filtros.role }),
        ...(filtros.activo && filtros.activo !== 'all' && { activo: filtros.activo }),
        ...(filtros.fechaDesde && { fechaDesde: filtros.fechaDesde }),
        ...(filtros.fechaHasta && { fechaHasta: filtros.fechaHasta }),
        ...(filtros.inactivoDias && { inactivoDias: filtros.inactivoDias.toString() }),
        ...(filtros.emailVerificado !== undefined && { emailVerificado: filtros.emailVerificado.toString() }),
        ...(filtros.ordenCampo && { ordenCampo: filtros.ordenCampo }),
        ...(filtros.ordenDireccion && { ordenDireccion: filtros.ordenDireccion })
      })

      const response = await fetch(`/api/admin/usuarios?${params}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al cargar usuarios')
      }
      return response.json() as Promise<UsuariosResponse>
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para paginación infinita
export function useAdminUsuariosInfinite(filtros: FiltrosUsuarios, limit: number = 20) {
  return useInfiniteQuery({
    queryKey: ['admin-usuarios-infinite', filtros, limit],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: limit.toString(),
        ...(filtros.search && { search: filtros.search }),
        ...(filtros.role && filtros.role !== 'all' && { role: filtros.role }),
        ...(filtros.activo && filtros.activo !== 'all' && { activo: filtros.activo })
      })

      const response = await fetch(`/api/admin/usuarios?${params}`)
      if (!response.ok) throw new Error('Error al cargar usuarios')
      return response.json() as Promise<UsuariosResponse>
    },
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  })
}

// Hook para obtener estadísticas de un usuario específico
export function useEstadisticasUsuario(usuarioId: string | null) {
  return useQuery({
    queryKey: ['usuario-estadisticas', usuarioId],
    queryFn: async () => {
      if (!usuarioId) throw new Error('ID de usuario requerido')
      const response = await fetch(`/api/admin/usuarios/${usuarioId}/estadisticas`)
      if (!response.ok) throw new Error('Error al cargar estadísticas')
      return response.json() as Promise<EstadisticasUsuario>
    },
    enabled: !!usuarioId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener historial de actividad
export function useHistorialActividad(usuarioId: string | null) {
  return useQuery({
    queryKey: ['usuario-historial', usuarioId],
    queryFn: async () => {
      if (!usuarioId) throw new Error('ID de usuario requerido')
      const response = await fetch(`/api/admin/usuarios/${usuarioId}/historial`)
      if (!response.ok) throw new Error('Error al cargar historial')
      return response.json()
    },
    enabled: !!usuarioId,
    staleTime: 3 * 60 * 1000,
  })
}

// Hook para obtener suspensiones de un usuario
export function useSuspensionesUsuario(usuarioId: string | null) {
  return useQuery({
    queryKey: ['usuario-suspensiones', usuarioId],
    queryFn: async () => {
      if (!usuarioId) throw new Error('ID de usuario requerido')
      const response = await fetch(`/api/admin/usuarios/${usuarioId}/suspensiones`)
      if (!response.ok) throw new Error('Error al cargar suspensiones')
      return response.json() as Promise<SuspensionUsuario[]>
    },
    enabled: !!usuarioId,
    staleTime: 1 * 60 * 1000,
  })
}

// Mutación para cambiar estado de usuario (activar/desactivar)
export function useToggleUsuarioStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ usuarioId, activo }: { usuarioId: string; activo: boolean }) => {
      const response = await fetch(`/api/admin/usuarios/${usuarioId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_active',
          activo
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al cambiar estado')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Estado actualizado correctamente')
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios-infinite'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// Mutación para eliminar usuario
export function useEliminarUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (usuarioId: string) => {
      const response = await fetch(`/api/admin/usuarios?userId=${usuarioId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar usuario')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Usuario eliminado correctamente')
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['usuarios-stats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// Mutación para actualizar usuario
export function useActualizarUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ usuarioId, updates }: { usuarioId: string; updates: Record<string, unknown> }) => {
      const response = await fetch(`/api/admin/usuarios`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: usuarioId, updates })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar usuario')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || 'Usuario actualizado correctamente')
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['usuario-estadisticas', variables.usuarioId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// Mutación para suspender usuario
export function useSuspenderUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      usuarioId: string
      tipo: 'suspension_temporal' | 'suspension_permanente' | 'baneo'
      razon: string
      fin?: string
      notasInternas?: string
    }) => {
      const response = await fetch(`/api/admin/usuarios/${data.usuarioId}/suspender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al suspender usuario')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || 'Usuario suspendido correctamente')
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['usuario-suspensiones', variables.usuarioId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// Mutación para levantar suspensión
export function useLevantarSuspension() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ usuarioId, suspensionId }: { usuarioId: string; suspensionId: string }) => {
      const response = await fetch(`/api/admin/usuarios/${usuarioId}/suspensiones/${suspensionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al levantar suspensión')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || 'Suspensión levantada correctamente')
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['usuario-suspensiones', variables.usuarioId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// Mutación para dar advertencia
export function useAdvertirUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      usuarioId: string
      razon: string
      severidad: 1 | 2 | 3
    }) => {
      const response = await fetch(`/api/admin/usuarios/${data.usuarioId}/advertir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al advertir usuario')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || 'Advertencia enviada correctamente')
      queryClient.invalidateQueries({ queryKey: ['usuario-estadisticas', variables.usuarioId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// Mutación para acciones en lote
export function useAccionesLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      usuarioIds: string[]
      accion: 'activar' | 'desactivar' | 'cambiar_rol' | 'eliminar'
      parametros?: Record<string, unknown>
    }) => {
      const response = await fetch(`/api/admin/usuarios/lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al ejecutar acción en lote')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Acción ejecutada correctamente')
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['usuarios-stats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
