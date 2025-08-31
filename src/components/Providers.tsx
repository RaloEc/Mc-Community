'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/AuthContext'
import FABMobile from '@/components/ui/FABMobile'

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode
  session?: any
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider session={session}>
        {children}
        <Toaster />
        {/* Botón flotante global solo móvil */}
        <FABMobile />
      </AuthProvider>
    </ThemeProvider>
  )
}
