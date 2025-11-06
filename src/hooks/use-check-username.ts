import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './use-debounce'

interface UsernameCheckResult {
  available: boolean | null
  loading: boolean
  error: string | null
  message: string | null
}

export function useCheckUsername(username: string, currentUserId?: string): UsernameCheckResult {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Debounce el username para no hacer requests en cada keystroke
  const debouncedUsername = useDebounce(username, 500)

  const checkUsername = useCallback(async () => {
    if (!debouncedUsername || debouncedUsername.trim().length === 0) {
      setAvailable(null)
      setError(null)
      setMessage(null)
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const params = new URLSearchParams()
      params.append('username', debouncedUsername)
      if (currentUserId) {
        params.append('userId', currentUserId)
      }

      const response = await fetch(`/api/perfil/check-username?${params}`)
      const data = await response.json()

      if (!response.ok) {
        setAvailable(false)
        setError(data.error || 'Error al verificar username')
        return
      }

      setAvailable(data.available)
      if (data.message) {
        setMessage(data.message)
      }
      if (data.error) {
        setError(data.error)
      }
    } catch (err) {
      console.error('Error checking username:', err)
      setAvailable(false)
      setError('Error al verificar username')
    } finally {
      setLoading(false)
    }
  }, [debouncedUsername, currentUserId])

  useEffect(() => {
    checkUsername()
  }, [checkUsername])

  return {
    available,
    loading,
    error,
    message,
  }
}
