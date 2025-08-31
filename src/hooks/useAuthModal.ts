'use client'

import { useState } from 'react'

export function useAuthModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [redirectTo, setRedirectTo] = useState<string | undefined>(undefined)

  const openLogin = (redirect?: string) => {
    setMode('login')
    setRedirectTo(redirect)
    setIsOpen(true)
  }

  const openRegister = (redirect?: string) => {
    setMode('register')
    setRedirectTo(redirect)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setRedirectTo(undefined)
  }

  return {
    isOpen,
    mode,
    redirectTo,
    openLogin,
    openRegister,
    close
  }
}
