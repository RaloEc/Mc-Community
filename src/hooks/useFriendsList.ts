'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Friend {
  friendship_id: string
  friend_id: string
  username: string
  public_id: string
  avatar_url: string | null
  color: string
  role: string
  created_at: string
}

export const useFriendsList = (userId: string | null | undefined, limit: number = 10) => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['friends-list', userId, limit],
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('user_friends_view')
        .select('*')
        .limit(limit)

      if (error) {
        console.error('[useFriendsList] Error:', error)
        throw new Error(error.message)
      }

      return (data || []) as Friend[]
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  })
}
