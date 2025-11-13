import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AccountPlatform = 'twitch' | 'discord' | 'league_of_legends' | 'valorant' | 'kick' | 'delta_force'

export interface ConnectedAccount {
  platform: AccountPlatform
  username: string
}

export type ConnectedAccountsData = Partial<Record<AccountPlatform, string>>

export const PLATFORM_LABELS: Record<AccountPlatform, string> = {
  twitch: 'Twitch',
  discord: 'Discord',
  league_of_legends: 'League of Legends',
  valorant: 'Valorant',
  kick: 'Kick',
  delta_force: 'Delta Force'
}

export const PLATFORM_PLACEHOLDERS: Record<AccountPlatform, string> = {
  twitch: 'usuario_twitch',
  discord: 'usuario#1234',
  league_of_legends: 'NombreJugador',
  valorant: 'Usuario#TAG',
  kick: 'usuario_kick',
  delta_force: 'usuario_df'
}

export const useConnectedAccounts = (userId: string) => {
  const [accounts, setAccounts] = useState<ConnectedAccountsData>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar cuentas conectadas
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .from('perfiles')
        .select('connected_accounts')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError
      
      setAccounts(data?.connected_accounts || {})
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar cuentas'
      setError(message)
      console.error('[useConnectedAccounts] Error fetching:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Agregar o actualizar cuenta
  const addOrUpdateAccount = useCallback(async (platform: AccountPlatform, username: string) => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      
      const updatedAccounts = {
        ...accounts,
        [platform]: username
      }

      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ connected_accounts: updatedAccounts })
        .eq('id', userId)

      if (updateError) throw updateError
      
      setAccounts(updatedAccounts)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar cuenta'
      setError(message)
      console.error('[useConnectedAccounts] Error adding account:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [userId, accounts])

  // Eliminar cuenta
  const removeAccount = useCallback(async (platform: AccountPlatform) => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      
      const updatedAccounts = { ...accounts }
      delete updatedAccounts[platform]

      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ connected_accounts: updatedAccounts })
        .eq('id', userId)

      if (updateError) throw updateError
      
      setAccounts(updatedAccounts)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar cuenta'
      setError(message)
      console.error('[useConnectedAccounts] Error removing account:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [userId, accounts])

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    addOrUpdateAccount,
    removeAccount,
    PLATFORM_LABELS,
    PLATFORM_PLACEHOLDERS
  }
}
